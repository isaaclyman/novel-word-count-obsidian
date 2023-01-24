import { DebugHelper } from "logic/debug";
import { CountData, CountsByFile, FileHelper } from "logic/file";
import {
	AlignmentType,
	alignmentTypes,
	CountType,
	countTypeDisplayStrings,
	countTypes,
	DEFAULT_SETTINGS,
	NovelWordCountSettings,
	PageCountType,
} from "logic/settings";
import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	PluginManifest,
	WorkspaceLeaf,
	TAbstractFile,
	debounce,
	TextComponent,
} from "obsidian";

interface NovelWordCountSavedData {
	cachedCounts: CountsByFile;
	settings: NovelWordCountSettings;
}

interface FileItem {
	titleEl: HTMLElement;
}

export default class NovelWordCountPlugin extends Plugin {
	savedData: NovelWordCountSavedData;
	get settings(): NovelWordCountSettings {
		return this.savedData.settings;
	}
	fileHelper: FileHelper;
	debugHelper = new DebugHelper();

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.fileHelper = new FileHelper(this.app.vault, this);
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

		this.handleEvents();
		this.initialize();
	}

	async onunload() {
		this.saveSettings();
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

		if (refreshAllCounts) {
			await this.refreshAllCounts();
		}

		try {
			await this.updateDisplayedCounts();
		} catch (err) {
			// File Explorer pane may not be loaded yet
			setTimeout(() => {
				this.initialize(false);
			}, 1000);
		}
	}

	public async updateDisplayedCounts(file: TAbstractFile | null = null) {
		const debugEnd = this.debugHelper.debugStart("updateDisplayedCounts");

		if (!Object.keys(this.savedData.cachedCounts).length) {
			this.debugHelper.debug("No cached data found; refreshing all counts.");
			await this.refreshAllCounts();
		}

		const fileExplorerLeaf = await this.getFileExplorerLeaf();
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

			const counts = this.fileHelper.getCountDataForPath(
				this.savedData.cachedCounts,
				path
			);
			const item = fileItems[path];
			item.titleEl.setAttribute(
				"data-novel-word-count-plugin",
				this.getNodeLabel(counts)
			);
		}

		debugEnd();
	}

	// FUNCTIONALITY

	private async getFileExplorerLeaf(): Promise<WorkspaceLeaf> {
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
	): string {
		if (!counts || typeof counts.wordCount !== "number") {
			return "";
		}

		const getPluralizedCount = function (noun: string, count: number, round: boolean = true) {
			const roundedCount = round ? Math.ceil(count) : count;
			const displayCount = round ? roundedCount.toLocaleString() : roundedCount.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2});
			return `${displayCount} ${noun}${roundedCount == 1 ? "" : "s"}`;
		};

		switch (countType) {
			case CountType.None:
				return "";
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
					? `${counts.pageCount.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})}p`
					: getPluralizedCount("page", counts.pageCount, false);
			case CountType.Note:
				return abbreviateDescriptions
					? `${counts.noteCount.toLocaleString()}n`
					: getPluralizedCount("note", counts.noteCount);
			case CountType.Character:
				return abbreviateDescriptions
					? `${counts.characterCount.toLocaleString()}ch`
					: getPluralizedCount("character", counts.characterCount);
			case CountType.Created:
				if (counts.createdDate === 0) {
					return "";
				}

				return abbreviateDescriptions
					? `${new Date(counts.createdDate).toLocaleDateString()}/c`
					: `Created ${new Date(counts.createdDate).toLocaleDateString()}`;
			case CountType.Modified:
				if (counts.modifiedDate === 0) {
					return "";
				}

				return abbreviateDescriptions
					? `${new Date(counts.modifiedDate).toLocaleDateString()}/u`
					: `Updated ${new Date(counts.modifiedDate).toLocaleDateString()}`;
		}

		return "";
	}

	private getNodeLabel(counts: CountData): string {
		return [
			this.settings.countType,
			this.settings.countType2,
			this.settings.countType3,
		]
			.filter((ct) => ct !== CountType.None)
			.map((ct) =>
				this.getDataTypeLabel(counts, ct, this.settings.abbreviateDescriptions)
			)
			.join(" | ");
	}

	private async handleEvents(): Promise<void> {
		this.registerEvent(
			this.app.vault.on("modify", async (file) => {
				this.debugHelper.debug(
					"[modify] vault hook fired, recounting file",
					file.path
				);
				await this.fileHelper.updateFileCounts(
					file,
					this.savedData.cachedCounts
				);
				await this.updateDisplayedCounts(file);
			})
		);

		const recalculateAll = async (hookName: string, file?: TAbstractFile) => {
			if (file) {
				this.debugHelper.debug(
					`[${hookName}] vault hook fired by file`,
					file.path,
					"recounting all files"
				);
			} else {
				this.debugHelper.debug(
					`[${hookName}] hook fired`,
					"recounting all files"
				);
			}
			await this.refreshAllCounts();
			await this.updateDisplayedCounts();
		}

		this.registerEvent(
			this.app.vault.on(
				"rename",
				debounce(recalculateAll.bind(this, "rename"), 1000)
			)
		);

		this.registerEvent(
			this.app.vault.on(
				"create",
				debounce(recalculateAll.bind(this, "create"), 1000)
			)
		);

		this.registerEvent(
			this.app.vault.on(
				"delete",
				debounce(recalculateAll.bind(this, "delete"), 1000)
			)
		);

		const reshowCountsIfNeeded = async (hookName: string) => {
			this.debugHelper.debug(`[${hookName}] hook fired`);
			
			const fileExplorerLeaf = await this.getFileExplorerLeaf();
			if (this.isContainerTouched(fileExplorerLeaf)) {
				this.debugHelper.debug('container already touched, skipping display update');
				return;
			}

			this.debugHelper.debug('container is clean, updating display');
			await this.updateDisplayedCounts();
		}

		this.registerEvent(
			this.app.workspace.on(
				"layout-change",
				debounce(reshowCountsIfNeeded.bind(this, 'layout-change'), 1000)
			)
		);
	}

	private isContainerTouched(leaf: WorkspaceLeaf): boolean {
		const container = leaf.view.containerEl;
		return container.className.includes('novel-word-count--');
	}

	private async refreshAllCounts() {
		this.debugHelper.debug("refreshAllCounts");
		this.savedData.cachedCounts = await this.fileHelper.getAllFileCounts();
		await this.saveSettings();
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

class NovelWordCountSettingTab extends PluginSettingTab {
	plugin: NovelWordCountPlugin;

	constructor(app: App, plugin: NovelWordCountPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		/*
		 * GENERAL
		 */

		const mainHeader = containerEl.createEl("div", {
			cls: [
				"setting-item",
				"setting-item-heading",
				"novel-word-count-settings-header",
			],
		});
		mainHeader.createEl("div", { text: "General" });
		mainHeader.createEl("div", {
			text: "You can display up to three data types side by side.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("1st data type to show")
			.setDesc("Ex: 10,000 words")
			.addDropdown((drop) => {
				for (const countType of countTypes) {
					drop.addOption(countType, countTypeDisplayStrings[countType]);
				}

				drop
					.setValue(this.plugin.settings.countType)
					.onChange(async (value: CountType) => {
						this.plugin.settings.countType = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					});
			});

		new Setting(containerEl)
			.setName("2nd data type to show")
			.setDesc("Ex: 10,000 words | 33 pages")
			.addDropdown((drop) => {
				for (const countType of countTypes) {
					drop.addOption(countType, countTypeDisplayStrings[countType]);
				}

				drop
					.setValue(this.plugin.settings.countType2)
					.onChange(async (value: CountType) => {
						this.plugin.settings.countType2 = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					});
			});

		new Setting(containerEl)
			.setName("3rd data type to show")
			.setDesc("Ex: 10,000 words | 33 pages | Created 10/27/2022")
			.addDropdown((drop) => {
				for (const countType of countTypes) {
					drop.addOption(countType, countTypeDisplayStrings[countType]);
				}

				drop
					.setValue(this.plugin.settings.countType3)
					.onChange(async (value: CountType) => {
						this.plugin.settings.countType3 = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					});
			});

		new Setting(containerEl)
			.setName("Abbreviate descriptions")
			.setDesc("E.g. show '120w' instead of '120 words'")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.abbreviateDescriptions)
					.onChange(async (value) => {
						this.plugin.settings.abbreviateDescriptions = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					})
			);

		new Setting(containerEl)
			.setName("Alignment")
			.setDesc(
				"Show data inline with file/folder names, right-aligned, or underneath"
			)
			.addDropdown((drop) => {
				drop
					.addOption(AlignmentType.Inline, "Inline")
					.addOption(AlignmentType.Right, "Right-aligned")
					.addOption(AlignmentType.Below, "Below")
					.setValue(this.plugin.settings.alignment)
					.onChange(async (value: AlignmentType) => {
						this.plugin.settings.alignment = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					});
			});

		/*
		 *	ADVANCED
		 */

		containerEl
			.createEl("div", { text: "Advanced" })
			.addClasses(["setting-item", "setting-item-heading"]);

		new Setting(containerEl)
			.setName("Page count method")
			.setDesc("For language compatibility")
			.addDropdown((drop) => {
				drop
					.addOption(PageCountType.ByWords, "Words per page")
					.addOption(PageCountType.ByChars, "Characters per page")
					.setValue(this.plugin.settings.pageCountType)
					.onChange(async (value: PageCountType) => {
						this.plugin.settings.pageCountType = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();

						this.display();
					});
			});

		if (this.plugin.settings.pageCountType === PageCountType.ByWords) {
			const wordsPerPageChanged = async (txt: TextComponent, value: string) => {
				const asNumber = Number(value);
				const isValid = !isNaN(asNumber) && asNumber > 0;

				txt.inputEl.style.borderColor = isValid ? null : "red";

				this.plugin.settings.wordsPerPage = isValid ? Number(value) : 300;
				await this.plugin.saveSettings();
				await this.plugin.initialize();
			};
			new Setting(containerEl)
				.setName("Words per page")
				.setDesc(
					"Used for page count. 300 is standard in English language publishing."
				)
				.addText((txt) => {
					txt
						.setPlaceholder("300")
						.setValue(this.plugin.settings.wordsPerPage.toString())
						.onChange(debounce(wordsPerPageChanged.bind(this, txt), 1000));
				});
		}

		if (this.plugin.settings.pageCountType === PageCountType.ByChars) {
			const charsPerPageChanged = async (txt: TextComponent, value: string) => {
				const asNumber = Number(value);
				const isValid = !isNaN(asNumber) && asNumber > 0;

				txt.inputEl.style.borderColor = isValid ? null : "red";

				this.plugin.settings.charsPerPage = isValid ? Number(value) : 1500;
				await this.plugin.saveSettings();
				await this.plugin.initialize();
			};
			new Setting(containerEl)
				.setName("Characters per page (not counting whitespace)")
				.setDesc("Used for page count. 1500 is common in German (Normseite).")
				.addText((txt) => {
					txt
						.setPlaceholder("1500")
						.setValue(this.plugin.settings.charsPerPage.toString())
						.onChange(debounce(charsPerPageChanged.bind(this, txt), 1000));
				});
		}

		new Setting(containerEl)
			.setName("Reanalyze all documents")
			.setDesc(
				"If changes have occurred outside of Obsidian, you may need to trigger a manual analysis"
			)
			.addButton((button) =>
				button
					.setButtonText("Reanalyze")
					.setCta()
					.onClick(async () => {
						button.disabled = true;
						await this.plugin.initialize();
						button.setButtonText("Done");
						button.removeCta();

						setTimeout(() => {
							button.setButtonText("Reanalyze");
							button.setCta();
							button.disabled = false;
						}, 1000);
					})
			);

		new Setting(containerEl)
			.setName("Debug mode")
			.setDesc("Log debugging information to the developer console")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.debugMode)
					.onChange(async (value) => {
						this.plugin.settings.debugMode = value;
						this.plugin.debugHelper.setDebugMode(value);
						this.plugin.fileHelper.setDebugMode(value);
						await this.plugin.saveSettings();
					})
			);
	}
}
