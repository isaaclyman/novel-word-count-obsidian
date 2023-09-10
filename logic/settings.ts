import type NovelWordCountPlugin from "main";
import { App, PluginSettingTab, Setting, TextComponent, debounce } from "obsidian";

export enum CountType {
	None = "none",
	Word = "word",
	Page = "page",
	PageDecimal = "pagedecimal",
	PercentGoal = "percentgoal",
	Note = "note",
	Character = "character",
	Link = "link",
	Embed = "embed",
	Alias = "alias",
	Created = "created",
	Modified = "modified",
	FileSize = "filesize",
}

export const countTypeDisplayStrings: { [countType: string]: string } = {
	[CountType.None]: "None",
	[CountType.Word]: "Word Count",
	[CountType.Page]: "Page Count",
	[CountType.PageDecimal]: "Page Count (decimal)",
	[CountType.PercentGoal]: "% of Word Goal",
	[CountType.Note]: "Note Count",
	[CountType.Character]: "Character Count",
	[CountType.Link]: "Link Count",
	[CountType.Embed]: "Embed Count",
	[CountType.Alias]: "First Alias",
	[CountType.Created]: "Created Date",
	[CountType.Modified]: "Last Updated Date",
	[CountType.FileSize]: "File Size",
};

export const countTypeDescriptions: { [countType: string]: string } = {
	[CountType.None]: "Hidden.",
	[CountType.Word]: "Total words.",
	[CountType.Page]: "Total pages, rounded up.",
	[CountType.PageDecimal]: "Total pages, precise to 2 digits after the decimal.",
	[CountType.PercentGoal]: "Set a word goal by adding the 'word-goal' property to a note.",
	[CountType.Note]: "Total notes.",
	[CountType.Character]: "Total characters (letters, symbols, numbers, and spaces).",
	[CountType.Link]: "Total links to other notes.",
	[CountType.Embed]: "Total embedded images, files, and notes.",
	[CountType.Alias]: "The first alias property of each note.",
	[CountType.Created]: "Creation date. (On folders: earliest creation date of any note.)",
	[CountType.Modified]: "Date of last edit. (On folders: latest edit date of any note.)",
	[CountType.FileSize]: "Total size on hard drive.",
}

export function getDescription(countType: CountType): string {
	return `[${countTypeDisplayStrings[countType]}] ${countTypeDescriptions[countType]}`;
}

export const countTypes = [
	CountType.None,
	CountType.Word,
	CountType.Page,
	CountType.PageDecimal,
	CountType.PercentGoal,
	CountType.Note,
	CountType.Character,
	CountType.Link,
	CountType.Embed,
	CountType.Alias,
	CountType.Created,
	CountType.Modified,
	CountType.FileSize,
];

export enum AlignmentType {
	Inline = "inline",
	Right = "right",
	Below = "below",
}

export const alignmentTypes = [
	AlignmentType.Inline,
	AlignmentType.Right,
	AlignmentType.Below,
];

export enum WordCountType {
	SpaceDelimited = "SpaceDelimited",
	CJK = "CJK",
	AutoDetect = "AutoDetect",
}

export enum PageCountType {
	ByWords = "ByWords",
	ByChars = "ByChars",
}

export interface NovelWordCountSettings {
	countType: CountType;
	countType2: CountType;
	countType3: CountType;
	showSameCountsOnFolders: boolean;
	folderCountType: CountType;
	folderCountType2: CountType;
	folderCountType3: CountType;
	abbreviateDescriptions: boolean;
	alignment: AlignmentType;
	debugMode: boolean;
	wordsPerPage: number;
	charsPerPage: number;
	charsPerPageIncludesWhitespace: boolean;
	wordCountType: WordCountType;
	pageCountType: PageCountType;
	excludeComments: boolean;
}

export const DEFAULT_SETTINGS: NovelWordCountSettings = {
	countType: CountType.Word,
	countType2: CountType.None,
	countType3: CountType.None,
	showSameCountsOnFolders: true,
	folderCountType: CountType.Word,
	folderCountType2: CountType.None,
	folderCountType3: CountType.None,
	abbreviateDescriptions: false,
	alignment: AlignmentType.Inline,
	debugMode: false,
	wordsPerPage: 300,
	charsPerPage: 1500,
	charsPerPageIncludesWhitespace: false,
	wordCountType: WordCountType.SpaceDelimited,
	pageCountType: PageCountType.ByWords,
	excludeComments: false,
};


export class NovelWordCountSettingTab extends PluginSettingTab {
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
		mainHeader.createEl("div", { text: "Notes" });
		mainHeader.createEl("div", {
			text: "You can display up to three data types side by side.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("1st data type to show")
			.setDesc(getDescription(this.plugin.settings.countType))
			.addDropdown((drop) => {
				for (const countType of countTypes) {
					drop.addOption(countType, countTypeDisplayStrings[countType]);
				}

				drop
					.setValue(this.plugin.settings.countType)
					.onChange(async (value: CountType) => {
						this.plugin.settings.countType = value;
						this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();

						this.display();
					});
			});

		new Setting(containerEl)
			.setName("2nd data type to show")
			.setDesc(getDescription(this.plugin.settings.countType2))
			.addDropdown((drop) => {
				for (const countType of countTypes) {
					drop.addOption(countType, countTypeDisplayStrings[countType]);
				}

				drop
					.setValue(this.plugin.settings.countType2)
					.onChange(async (value: CountType) => {
						this.plugin.settings.countType2 = value;
						this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();

						this.display();
					});
			});

		new Setting(containerEl)
			.setName("3rd data type to show")
			.setDesc(getDescription(this.plugin.settings.countType3))
			.addDropdown((drop) => {
				for (const countType of countTypes) {
					drop.addOption(countType, countTypeDisplayStrings[countType]);
				}

				drop
					.setValue(this.plugin.settings.countType3)
					.onChange(async (value: CountType) => {
						this.plugin.settings.countType3 = value;
						this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();

						this.display();
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
						this.plugin.saveSettings();
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
						this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					});
			});

		/*
		 *  FOLDER COUNTS
		 */

		containerEl
			.createEl("div", { text: "Folders" })
			.addClasses(["setting-item", "setting-item-heading"]);

		new Setting(containerEl)
			.setName("Show same data on folders")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showSameCountsOnFolders)
					.onChange(async (value) => {
						this.plugin.settings.showSameCountsOnFolders = value;
						this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();

						this.display();
					})
			);

		if (!this.plugin.settings.showSameCountsOnFolders) {
			new Setting(containerEl)
				.setName("1st data type to show")
				.addDropdown((drop) => {
					for (const countType of countTypes) {
						drop.addOption(countType, countTypeDisplayStrings[countType]);
					}

					drop
						.setValue(this.plugin.settings.folderCountType)
						.onChange(async (value: CountType) => {
							this.plugin.settings.folderCountType = value;
							this.plugin.saveSettings();
							await this.plugin.updateDisplayedCounts();
						});
				});

			new Setting(containerEl)
				.setName("2nd data type to show")
				.addDropdown((drop) => {
					for (const countType of countTypes) {
						drop.addOption(countType, countTypeDisplayStrings[countType]);
					}

					drop
						.setValue(this.plugin.settings.folderCountType2)
						.onChange(async (value: CountType) => {
							this.plugin.settings.folderCountType2 = value;
							this.plugin.saveSettings();
							await this.plugin.updateDisplayedCounts();
						});
				});

			new Setting(containerEl)
				.setName("3rd data type to show")
				.addDropdown((drop) => {
					for (const countType of countTypes) {
						drop.addOption(countType, countTypeDisplayStrings[countType]);
					}

					drop
						.setValue(this.plugin.settings.folderCountType3)
						.onChange(async (value: CountType) => {
							this.plugin.settings.folderCountType3 = value;
							this.plugin.saveSettings();
							await this.plugin.updateDisplayedCounts();
						});
				});
		}

		/*
		 *	ADVANCED
		 */

		containerEl
			.createEl("div", { text: "Advanced" })
			.addClasses(["setting-item", "setting-item-heading"]);

		new Setting(containerEl)
			.setName("Exclude comments")
			.setDesc(
				"Exclude %%Obsidian%% and <!--HTML--> comments from counts. May affect performance on large vaults."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.excludeComments)
					.onChange(async (value) => {
						this.plugin.settings.excludeComments = value;
						this.plugin.saveSettings();
						await this.plugin.initialize();
					})
			);

		new Setting(containerEl)
			.setName("Word count method")
			.setDesc("For language compatibility")
			.addDropdown((drop) => {
				drop
					.addOption(
						WordCountType.SpaceDelimited,
						"Space-delimited (European languages)"
					)
					.addOption(WordCountType.CJK, "Han/Kana/Hangul (CJK)")
					.addOption(WordCountType.AutoDetect, "Auto-detect by file")
					.setValue(this.plugin.settings.wordCountType)
					.onChange(async (value: WordCountType) => {
						this.plugin.settings.wordCountType = value;
						this.plugin.saveSettings();
						await this.plugin.initialize();
					});
			});

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
						this.plugin.saveSettings();
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
				this.plugin.saveSettings();
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
			new Setting(containerEl)
				.setName("Include whitespace characters in page count")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.charsPerPageIncludesWhitespace)
						.onChange(async (value) => {
							this.plugin.settings.charsPerPageIncludesWhitespace = value;
							this.plugin.saveSettings();
							await this.plugin.initialize();

							this.display();
						})
				);

			const charsPerPageChanged = async (txt: TextComponent, value: string) => {
				const asNumber = Number(value);
				const isValid = !isNaN(asNumber) && asNumber > 0;

				txt.inputEl.style.borderColor = isValid ? null : "red";

				const defaultCharsPerPage = 1500;
				this.plugin.settings.charsPerPage = isValid
					? Number(value)
					: defaultCharsPerPage;
				this.plugin.saveSettings();
				await this.plugin.initialize();
			};
			new Setting(containerEl)
				.setName("Characters per page")
				.setDesc(
					`Used for page count. ${
						this.plugin.settings.charsPerPageIncludesWhitespace
							? "2400 is common in Danish."
							: "1500 is common in German (Normseite)."
					}`
				)
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
						this.plugin.saveSettings();
					})
			);
	}
}