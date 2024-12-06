import { DebugHelper } from "logic/debug";
import { EventHelper } from "logic/event";
import { FileHelper } from "logic/file";
import { NodeLabelHelper } from "logic/node_label";
import { NovelWordCountSavedData, SavedDataHelper } from "logic/saved_data";
import {
	ALIGNMENT_TYPES,
	COUNT_TYPE_DISPLAY_STRINGS,
	COUNT_TYPES,
	NovelWordCountSettings,
} from "logic/settings";
import { NovelWordCountSettingTab } from "logic/settings.tab";
import {
	App,
	Plugin,
	PluginManifest,
	WorkspaceLeaf,
	TAbstractFile,
} from "obsidian";

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
	savedDataHelper: SavedDataHelper;

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
		this.savedDataHelper = new SavedDataHelper(this)
	}

	// LIFECYCLE

	async onload() {
		this.savedData = await this.savedDataHelper.getSavedData();

		this.fileHelper.setDebugMode(this.savedData.settings.debugMode);
		this.debugHelper.setDebugMode(this.savedData.settings.debugMode);
		this.debugHelper.debug(`Detected locales: [${navigator.languages}]`);
		this.debugHelper.debug("onload lifecycle hook");

		this.addSettingTab(new NovelWordCountSettingTab(this.app, this));

		this.addCommand({
			id: "recount-vault",
			name: "Recount all notes / Reset session",
			callback: async () => {
				this.debugHelper.debug("[Recount] command triggered");
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

	async saveSettings() {
		await this.saveData(this.savedData);
	}

	// PUBLIC

	/**
		Called with (true) when the plugin initializes or the user clicks Reanalyze.
		Called with (false) every second while waiting for the file explorer to load.
	*/
	public async initialize(reinitializeAllCounts = true) {
		this.debugHelper.debug("initialize");

		this.app.workspace.onLayoutReady(async () => {
			if (reinitializeAllCounts) {
				await this.eventHelper.reinitializeAllCounts();
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
		const fileExplorerView = fileExplorerLeaf.view as any;
		const fileItems: { [path: string]: FileItem } = (
			fileExplorerView
		).fileItems;

		if (fileExplorerView?.headerDom?.navButtonsEl) {
			const counts = this.fileHelper.getCachedDataForPath(
				this.savedData.cachedCounts,
				"/"
			);

			fileExplorerView.headerDom.navButtonsEl.setAttribute(
				"data-novel-word-count-plugin",
				this.nodeLabelHelper.getNodeLabel(counts)
			)
		}

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
			if (file && (!file.path.includes(path) || file.path === '/')) {
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
		container.toggleClass(`novel-word-count--active`, true);

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
