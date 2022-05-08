import { CountData, CountsByFile, FileHelper } from "logic/file";
import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	PluginManifest,
	WorkspaceLeaf,
} from "obsidian";

enum CountType {
	Word = "word",
	Page = "page",
	Character = "character",
	Created = "created",
	Modified = "modified",
}

const countTypes = [
	CountType.Word,
	CountType.Page,
	CountType.Character,
	CountType.Created,
	CountType.Modified,
];

interface NovelWordCountSettings {
	countType: CountType;
	abbreviateDescriptions: boolean;
}

const DEFAULT_SETTINGS: NovelWordCountSettings = {
	countType: CountType.Word,
	abbreviateDescriptions: false,
};

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

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.fileHelper = new FileHelper(this.app.vault);
	}

	// LIFECYCLE

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new NovelWordCountSettingTab(this.app, this));

		this.addCommand({
			id: "recount-vault",
			name: "Reanalyze (recount) all documents in vault",
			callback: async () => {
				await this.initialize();
			},
		});

		this.addCommand({
			id: "cycle-count-type",
			name: "Change data type to display",
			callback: async () => {
				this.settings.countType =
					countTypes[
						(countTypes.indexOf(this.settings.countType) + 1) %
							countTypes.length
					];
				await this.saveSettings();
				this.updateDisplayedCounts();
			},
		});

		this.handleEvents();
		this.initialize();
	}

	async onunload() {
		this.saveSettings();
	}

	// SETTINGS

	async loadSettings() {
		this.savedData = Object.assign(
			{},
			await this.loadData()
		) as NovelWordCountSavedData;
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

	public async initialize() {
		await this.refreshAllCounts();

		try {
			await this.updateDisplayedCounts();
		} catch (err) {
			// File Explorer pane may not be loaded yet
			setTimeout(() => {
				this.updateDisplayedCounts();
			}, 1000);
		}
	}

	public async updateDisplayedCounts() {
		if (!this.savedData.cachedCounts.hasOwnProperty("/")) {
			await this.refreshAllCounts();
		}

		const fileExplorerLeaf = await this.getFileExplorerLeaf();
		const fileItems: { [path: string]: FileItem } = (
			fileExplorerLeaf.view as any
		).fileItems;

		for (const path in fileItems) {
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

	private getNodeLabel(counts: CountData): string {
		if (!counts || typeof counts.wordCount !== "number") {
			return "";
		}

		switch (this.settings.countType) {
			case CountType.Word:
				return this.settings.abbreviateDescriptions ?
					`${counts.wordCount.toLocaleString()}w` :
					`${counts.wordCount.toLocaleString()} word${
						counts.wordCount === 1 ? "" : "s"
					}`;
			case CountType.Page:
				return this.settings.abbreviateDescriptions ?
					`${counts.pageCount.toLocaleString()}p` :
					`${counts.pageCount.toLocaleString()} page${
						counts.pageCount === 1 ? "" : "s"
					}`;
			case CountType.Character:
				return this.settings.abbreviateDescriptions ?
					`${counts.characterCount.toLocaleString()}ch` :
					`${counts.characterCount.toLocaleString()} character${
						counts.characterCount === 1 ? "" : "s"
					}`
			case CountType.Created:
				if (counts.createdDate === 0) {
					return "";
				}

				return this.settings.abbreviateDescriptions ?
					`${new Date(counts.createdDate).toLocaleDateString()}/c` :
					`Created ${new Date(counts.createdDate).toLocaleDateString()}`;
			case CountType.Modified:
				if (counts.modifiedDate === 0) {
					return "";
				}

				return this.settings.abbreviateDescriptions ?
					`${new Date(counts.modifiedDate).toLocaleDateString()}/u` :
					`Updated ${new Date(counts.modifiedDate).toLocaleDateString()}`;
		}

		return "";
	}

	private handleEvents(): void {
		this.registerEvent(
			this.app.vault.on("modify", async (file) => {
				await this.fileHelper.updateFileCounts(
					file,
					this.savedData.cachedCounts
				);
				await this.updateDisplayedCounts();
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", async () => {
				await this.refreshAllCounts();
				await this.updateDisplayedCounts();
			})
		);
	}

	private async refreshAllCounts() {
		this.savedData.cachedCounts = await this.fileHelper.getAllFileCounts();
		await this.saveSettings();
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

		containerEl.createEl("h2", { text: "Novel word count settings" });

		new Setting(containerEl)
			.setName("Data to show")
			.setDesc("Word count, page count, created date, or last updated date")
			.addDropdown((drop) =>
				drop
					.addOption(CountType.Word, "Word Count")
					.addOption(CountType.Page, "Page Count")
					.addOption(CountType.Character, "Character Count")
					.addOption(CountType.Created, "Created Date")
					.addOption(CountType.Modified, "Last Updated Date")
					.setValue(this.plugin.settings.countType)
					.onChange(async (value: CountType) => {
						this.plugin.settings.countType = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					})
			);

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
	}
}
