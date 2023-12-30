import { DebugHelper } from "logic/debug";
import { EventHelper } from "logic/event";
import { CountsByFile, FileHelper } from "logic/file";
import { NodeLabelHelper } from "logic/node_label";
import {
	ALIGNMENT_TYPES,
	CountType,
	COUNT_TYPE_DISPLAY_STRINGS,
	COUNT_TYPES,
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
	nodeLabelHelper: NodeLabelHelper;
	debugHelper = new DebugHelper();

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.fileHelper = new FileHelper(this.app, this);
		this.eventHelper = new EventHelper(
			this,
			app,
			this.debugHelper,
			this.fileHelper
		);
		this.nodeLabelHelper = new NodeLabelHelper(this);
	}

	// LIFECYCLE

	async onload() {
		await this.loadSettings();

		this.fileHelper.setDebugMode(this.savedData.settings.debugMode);
		this.debugHelper.setDebugMode(this.savedData.settings.debugMode);
		this.debugHelper.debug(`Detected locales: [${navigator.languages}]`);
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
					COUNT_TYPES[
						(COUNT_TYPES.indexOf(this.settings.countType) + 1) %
							COUNT_TYPES.length
					];
				await this.saveSettings();
				this.updateDisplayedCounts();
			},
		});

		this.addCommand({
			id: "toggle-abbreviate",
			name: "Toggle abbreviation on Notes",
			callback: async () => {
				this.debugHelper.debug(
					"[Toggle abbrevation - Notes] command triggered"
				);
				this.settings.abbreviateDescriptions =
					!this.settings.abbreviateDescriptions;
				await this.saveSettings();
				this.updateDisplayedCounts();
			},
		});

		for (const countType of COUNT_TYPES) {
			this.addCommand({
				id: `set-count-type-${countType}`,
				name: `Show ${COUNT_TYPE_DISPLAY_STRINGS[countType]} (1st position)`,
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
			!COUNT_TYPES.includes(loaded.settings.countType)
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

			const counts = this.fileHelper.getCachedDataForPath(
				this.savedData.cachedCounts,
				path
			);

			const item = fileItems[path];
			(item.titleEl ?? item.selfEl).setAttribute(
				"data-novel-word-count-plugin",
				this.nodeLabelHelper.getNodeLabel(counts)
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

	private setContainerClass(leaf: WorkspaceLeaf) {
		const container = leaf.view.containerEl;
		const notePrefix = `novel-word-count--note-`;
		const folderPrefix = `novel-word-count--folder-`;
		const alignmentClasses = ALIGNMENT_TYPES
			.map((at) => notePrefix + at)
			.concat(ALIGNMENT_TYPES.map((at) => folderPrefix + at));

		for (const ac of alignmentClasses) {
			container.toggleClass(ac, false);
		}

		container.toggleClass(notePrefix + this.settings.alignment, true);

		const folderAlignment = this.settings.showSameCountsOnFolders
			? this.settings.alignment
			: this.settings.folderAlignment;
		container.toggleClass(folderPrefix + folderAlignment, true);
	}
}
