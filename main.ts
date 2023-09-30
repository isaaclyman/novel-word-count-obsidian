import { DebugHelper } from "logic/debug";
import { EventHelper } from "logic/event";
import { CountData, CountsByFile, FileHelper } from "logic/file";
import { FileSizeHelper } from "logic/filesize";
import {
	alignmentTypes,
	CountType,
	countTypeDisplayStrings,
	countTypes,
	DEFAULT_SETTINGS,
	NovelWordCountSettings,
	NovelWordCountSettingTab,
} from "logic/settings";
import {
	App,
	Plugin,
	PluginManifest,
	WorkspaceLeaf,
	TAbstractFile,
} from "obsidian";

interface NovelWordCountSavedData {
	cachedCounts: CountsByFile;
	settings: NovelWordCountSettings;
}

interface FileItem {
	titleEl?: HTMLElement;
	selfEl: HTMLElement;
}

export default class NovelWordCountPlugin extends Plugin {
	savedData: NovelWordCountSavedData;
	get settings(): NovelWordCountSettings {
		return this.savedData.settings;
	}
	fileHelper: FileHelper;
	eventHelper: EventHelper;
	debugHelper = new DebugHelper();
	fileSizeHelper = new FileSizeHelper();

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.fileHelper = new FileHelper(this.app, this);
		this.eventHelper = new EventHelper(
			this,
			app,
			this.debugHelper,
			this.fileHelper
		);
	}

	// LIFECYCLE

	async onload() {
		await this.loadSettings();

		this.fileHelper.setDebugMode(this.savedData.settings.debugMode);
		this.debugHelper.setDebugMode(this.savedData.settings.debugMode);
		this.debugHelper.debug("onload lifecycle hook");

		this.addSettingTab(new NovelWordCountSettingTab(this.app, this));

		this.addCommand({
			id: "recount-vault",
			name: "Reanalyze (recount) all documents in vault",
			callback: async () => {
				this.debugHelper.debug("[Reanalyze] command triggered");
				await this.initialize();
			},
		});

		this.addCommand({
			id: "cycle-count-type",
			name: "Show next data type (1st position)",
			callback: async () => {
				this.debugHelper.debug("[Cycle next data type] command triggered");
				this.settings.countType =
					countTypes[
						(countTypes.indexOf(this.settings.countType) + 1) %
							countTypes.length
					];
				await this.saveSettings();
				this.updateDisplayedCounts();
			},
		});

		this.addCommand({
			id: "toggle-abbreviate",
			name: "Toggle abbreviation",
			callback: async () => {
				this.debugHelper.debug("[Toggle abbrevation] command triggered");
				this.settings.abbreviateDescriptions =
					!this.settings.abbreviateDescriptions;
				await this.saveSettings();
				this.updateDisplayedCounts();
			},
		});

		for (const countType of countTypes) {
			this.addCommand({
				id: `set-count-type-${countType}`,
				name: `Show ${countTypeDisplayStrings[countType]} (1st position)`,
				callback: async () => {
					this.debugHelper.debug(
						`[Set count type to ${countType}] command triggered`
					);
					this.settings.countType = countType;
					await this.saveSettings();
					this.updateDisplayedCounts();
				},
			});
		}

		this.eventHelper.handleEvents();
		this.initialize();
	}

	async onunload() {
		await this.saveSettings();
	}

	// SETTINGS

	async loadSettings() {
		const loaded: NovelWordCountSavedData = await this.loadData();

		if (
			loaded &&
			loaded.settings &&
			loaded.settings.countType &&
			!countTypes.includes(loaded.settings.countType)
		) {
			loaded.settings.countType = CountType.Word;
		}

		this.savedData = Object.assign({}, loaded);

		this.savedData.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			this.savedData.settings
		);
	}

	async saveSettings() {
		await this.saveData(this.savedData);
	}

	// PUBLIC

	public async initialize(refreshAllCounts = true) {
		this.debugHelper.debug("initialize");

		this.app.workspace.onLayoutReady(async () => {
			if (refreshAllCounts) {
				await this.eventHelper.refreshAllCounts();
			}

			try {
				await this.getFileExplorerLeaf();
				await this.updateDisplayedCounts();
			} catch (err) {
				this.debugHelper.debug("Error while updating displayed counts");
				this.debugHelper.error(err);

				// File Explorer pane may not be loaded yet
				setTimeout(() => {
					this.initialize(false);
				}, 1000);
			}
		});
	}

	public async updateDisplayedCounts(file: TAbstractFile | null = null) {
		const debugEnd = this.debugHelper.debugStart(
			`updateDisplayedCounts [${file == null ? "ALL" : file.path}]`
		);

		if (!Object.keys(this.savedData.cachedCounts).length) {
			this.debugHelper.debug("No cached data found; skipping update.");
			return;
		}

		let fileExplorerLeaf: WorkspaceLeaf;
		try {
			fileExplorerLeaf = await this.getFileExplorerLeaf();
		} catch (err) {
			this.debugHelper.debug("File explorer leaf not found; skipping update.");
			return;
		}

		this.setContainerClass(fileExplorerLeaf);
		const fileItems: { [path: string]: FileItem } = (
			fileExplorerLeaf.view as any
		).fileItems;

		if (file) {
			const relevantItems = Object.keys(fileItems).filter((path) =>
				file.path.includes(path)
			);
			this.debugHelper.debug(
				"Setting display counts for",
				relevantItems.length,
				"fileItems matching path",
				file.path
			);
		} else {
			this.debugHelper.debug(
				`Setting display counts for ${Object.keys(fileItems).length} fileItems`
			);
		}

		for (const path in fileItems) {
			if (file && !file.path.includes(path)) {
				continue;
			}

			if (!this.fileHelper.shouldShowCountOnPath(path)) {
				continue;
			}

			const counts = this.fileHelper.getCachedDataForPath(
				this.savedData.cachedCounts,
				path
			);
			const item = fileItems[path];
			(item.titleEl ?? item.selfEl).setAttribute(
				"data-novel-word-count-plugin",
				this.getNodeLabel(counts)
			);
		}

		debugEnd();
	}

	// FUNCTIONALITY

	public async getFileExplorerLeaf(): Promise<WorkspaceLeaf> {
		return new Promise((resolve, reject) => {
			let foundLeaf: WorkspaceLeaf | null = null;
			this.app.workspace.iterateAllLeaves((leaf) => {
				if (foundLeaf) {
					return;
				}

				const view = leaf.view as any;
				if (!view || !view.fileItems) {
					return;
				}

				foundLeaf = leaf;
				resolve(foundLeaf);
			});

			if (!foundLeaf) {
				reject(Error("Could not find file explorer leaf."));
			}
		});
	}

	private getDataTypeLabel(
		counts: CountData,
		countType: CountType,
		abbreviateDescriptions: boolean
	): string | null {
		if (!counts || typeof counts.wordCount !== "number") {
			return null;
		}

		const getPluralizedCount = function (
			noun: string,
			count: number,
			round: boolean = true
		) {
			const displayCount = round
				? Math.ceil(count).toLocaleString(undefined)
				: count.toLocaleString(undefined, {
						minimumFractionDigits: 1,
						maximumFractionDigits: 2,
				  });
			return `${displayCount} ${noun}${displayCount == "1" ? "" : "s"}`;
		};

		switch (countType) {
			case CountType.None:
				return null;
			case CountType.Word:
				return abbreviateDescriptions
					? `${Math.ceil(counts.wordCount).toLocaleString()}w`
					: getPluralizedCount("word", counts.wordCount);
			case CountType.Page:
				return abbreviateDescriptions
					? `${Math.ceil(counts.pageCount).toLocaleString()}p`
					: getPluralizedCount("page", counts.pageCount);
			case CountType.PageDecimal:
				return abbreviateDescriptions
					? `${counts.pageCount.toLocaleString(undefined, {
							minimumFractionDigits: 1,
							maximumFractionDigits: 2,
					  })}p`
					: getPluralizedCount("page", counts.pageCount, false);
			case CountType.PercentGoal:
				if (counts.wordGoal <= 0) {
					return null;
				}

				const fraction = counts.wordCountTowardGoal / counts.wordGoal;
				const percent = Math.round(fraction * 100).toLocaleString(undefined);
				return abbreviateDescriptions
					? `${percent}%`
					: `${percent}% of ${counts.wordGoal.toLocaleString(undefined)}`;
			case CountType.Note:
				return abbreviateDescriptions
					? `${counts.noteCount.toLocaleString()}n`
					: getPluralizedCount("note", counts.noteCount);
			case CountType.Character:
				return abbreviateDescriptions
					? `${counts.characterCount.toLocaleString()}ch`
					: getPluralizedCount("character", counts.characterCount);
			case CountType.Link:
				if (counts.linkCount === 0) {
					return null;
				}

				return abbreviateDescriptions
					? `${counts.linkCount.toLocaleString()}x`
					: getPluralizedCount("link", counts.linkCount);
			case CountType.Embed:
				if (counts.embedCount === 0) {
					return null;
				}

				return abbreviateDescriptions
					? `${counts.embedCount.toLocaleString()}em`
					: getPluralizedCount("embed", counts.embedCount);
			case CountType.Alias:
				if (
					!counts.aliases ||
					!Array.isArray(counts.aliases) ||
					!counts.aliases.length
				) {
					return null;
				}

				return abbreviateDescriptions
					? `${counts.aliases[0]}`
					: `alias: ${counts.aliases[0]}${
							counts.aliases.length > 1 ? ` +${counts.aliases.length - 1}` : ""
					  }`;
			case CountType.Created:
				if (counts.createdDate === 0) {
					return null;
				}

				return abbreviateDescriptions
					? `${new Date(counts.createdDate).toLocaleDateString()}/c`
					: `Created ${new Date(counts.createdDate).toLocaleDateString()}`;
			case CountType.Modified:
				if (counts.modifiedDate === 0) {
					return null;
				}

				return abbreviateDescriptions
					? `${new Date(counts.modifiedDate).toLocaleDateString()}/u`
					: `Updated ${new Date(counts.modifiedDate).toLocaleDateString()}`;
			case CountType.FileSize:
				return this.fileSizeHelper.formatFileSize(
					counts.sizeInBytes,
					abbreviateDescriptions
				);
		}

		return null;
	}

	private getNodeLabel(counts: CountData): string {
		const countTypes =
			counts.isDirectory && !this.settings.showSameCountsOnFolders
				? [
						this.settings.folderCountType,
						this.settings.folderCountType2,
						this.settings.folderCountType3,
				  ]
				: [
						this.settings.countType,
						this.settings.countType2,
						this.settings.countType3,
				  ];

		return countTypes
			.filter((ct) => ct !== CountType.None)
			.map((ct) =>
				this.getDataTypeLabel(counts, ct, this.settings.abbreviateDescriptions)
			)
			.filter((display) => display !== null)
			.join(" | ");
	}

	private setContainerClass(leaf: WorkspaceLeaf) {
		const container = leaf.view.containerEl;
		const prefix = `novel-word-count--`;
		const alignmentClasses = alignmentTypes.map((at) => prefix + at);

		for (const ac of alignmentClasses) {
			container.toggleClass(ac, false);
		}

		container.toggleClass(prefix + this.settings.alignment, true);
	}
}
