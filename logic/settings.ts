import type NovelWordCountPlugin from "main";
import {
	App,
	PluginSettingTab,
	Setting,
	TextComponent,
	debounce,
} from "obsidian";

export enum CountType {
	None = "none",
	Word = "word",
	Page = "page",
	PageDecimal = "pagedecimal",
	ReadTime = "readtime",
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

export const COUNT_TYPE_DISPLAY_STRINGS: { [countType: string]: string } = {
	[CountType.None]: "None",
	[CountType.Word]: "Word Count",
	[CountType.Page]: "Page Count",
	[CountType.PageDecimal]: "Page Count (decimal)",
	[CountType.ReadTime]: "Reading Time",
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

export const COUNT_TYPE_DESCRIPTIONS: { [countType: string]: string } = {
	[CountType.None]: "Hidden.",
	[CountType.Word]: "Total words.",
	[CountType.Page]: "Total pages, rounded up.",
	[CountType.PageDecimal]:
		"Total pages, precise to 2 digits after the decimal.",
	[CountType.ReadTime]: "Estimated time to read the note.",
	[CountType.PercentGoal]:
		"Set a word goal by adding the 'word-goal' property to a note.",
	[CountType.Note]: "Total notes.",
	[CountType.Character]:
		"Total characters (letters, symbols, numbers, and spaces).",
	[CountType.Link]: "Total links to other notes.",
	[CountType.Embed]: "Total embedded images, files, and notes.",
	[CountType.Alias]: "The first alias property of each note.",
	[CountType.Created]:
		"Creation date. (On folders: earliest creation date of any note.)",
	[CountType.Modified]:
		"Date of last edit. (On folders: latest edit date of any note.)",
	[CountType.FileSize]: "Total size on hard drive.",
};

export const UNFORMATTABLE_COUNT_TYPES = [
	CountType.None,
	CountType.Alias,
	CountType.FileSize,
	CountType.ReadTime,
];
export const COUNT_TYPE_DEFAULT_SHORT_SUFFIXES: {
	[countType: string]: string;
} = {
	[CountType.Word]: "w",
	[CountType.Page]: "p",
	[CountType.PageDecimal]: "p",
	[CountType.PercentGoal]: "%",
	[CountType.Note]: "n",
	[CountType.Character]: "ch",
	[CountType.Link]: "x",
	[CountType.Embed]: "em",
	[CountType.Created]: "/c",
	[CountType.Modified]: "/u",
};

export function getDescription(countType: CountType): string {
	return `[${COUNT_TYPE_DISPLAY_STRINGS[countType]}] ${COUNT_TYPE_DESCRIPTIONS[countType]}`;
}

export const COUNT_TYPES = [
	CountType.None,
	CountType.Word,
	CountType.Page,
	CountType.PageDecimal,
	CountType.ReadTime,
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

export const ALIGNMENT_TYPES = [
	AlignmentType.Inline,
	AlignmentType.Right,
	AlignmentType.Below,
];

export enum CharacterCountType {
	StringLength = "AllCharacters",
	ExcludeWhitespace = "ExcludeWhitespace",
}

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
	// FORMATTING
	useAdvancedFormatting: boolean;
	// NOTES
	countType: CountType;
	countTypeSuffix: string;
	countType2: CountType;
	countType2Suffix: string;
	countType3: CountType;
	countType3Suffix: string;
	pipeSeparator: string;
	abbreviateDescriptions: boolean;
	alignment: AlignmentType;
	// FOLDERS
	showSameCountsOnFolders: boolean;
	folderCountType: CountType;
	folderCountTypeSuffix: string;
	folderCountType2: CountType;
	folderCountType2Suffix: string;
	folderCountType3: CountType;
	folderCountType3Suffix: string;
	folderPipeSeparator: string;
	folderAbbreviateDescriptions: boolean;
	folderAlignment: AlignmentType;
	// ADVANCED
	showAdvanced: boolean;
	wordsPerMinute: number;
	charsPerMinute: number;
	wordsPerPage: number;
	charsPerPage: number;
	charsPerPageIncludesWhitespace: boolean;
	characterCountType: CharacterCountType;
	wordCountType: WordCountType;
	pageCountType: PageCountType;
	includeDirectories: string;
	excludeComments: boolean;
	excludeCodeBlocks: boolean;
	debugMode: boolean;
}

export const DEFAULT_SETTINGS: NovelWordCountSettings = {
	// FORMATTING
	useAdvancedFormatting: false,
	// NOTES
	countType: CountType.Word,
	countTypeSuffix: "w",
	countType2: CountType.None,
	countType2Suffix: "",
	countType3: CountType.None,
	countType3Suffix: "",
	pipeSeparator: "|",
	abbreviateDescriptions: false,
	alignment: AlignmentType.Inline,
	// FOLDERS
	showSameCountsOnFolders: true,
	folderCountType: CountType.Word,
	folderCountTypeSuffix: "w",
	folderCountType2: CountType.None,
	folderCountType2Suffix: "",
	folderCountType3: CountType.None,
	folderCountType3Suffix: "",
	folderPipeSeparator: "|",
	folderAbbreviateDescriptions: false,
	folderAlignment: AlignmentType.Inline,
	// ADVANCED
	showAdvanced: false,
	wordsPerMinute: 265,
	charsPerMinute: 500,
	wordsPerPage: 300,
	charsPerPage: 1500,
	charsPerPageIncludesWhitespace: false,
	characterCountType: CharacterCountType.StringLength,
	wordCountType: WordCountType.SpaceDelimited,
	pageCountType: PageCountType.ByWords,
	includeDirectories: "",
	excludeComments: false,
	excludeCodeBlocks: false,
	debugMode: false,
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

		this.renderNoteSettings(containerEl);
		this.renderFolderSettings(containerEl);
		this.renderAdvancedSettings(containerEl);
		this.renderReanalyzeButton(containerEl);
	}

	//
	// NOTES
	//

	private renderNoteSettings(containerEl: HTMLElement): void {
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
			.setDesc("Use advanced formatting")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useAdvancedFormatting)
					.onChange(async (value) => {
						this.plugin.settings.useAdvancedFormatting = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
						this.display();
					})
			);

		// NOTE - DATA TYPE 1

		this.renderCountTypeSetting(containerEl, {
			name: "1st data type to show",
			oldCountType: this.plugin.settings.countType,
			setNewCountType: (value) => {
				this.plugin.settings.countType = value;
				this.plugin.settings.countTypeSuffix =
					COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[this.plugin.settings.countType];
			},
		});

		this.renderCustomFormatSetting(containerEl, {
			countType: this.plugin.settings.countType,
			oldSuffix: this.plugin.settings.countTypeSuffix,
			setNewSuffix: (value) => (this.plugin.settings.countTypeSuffix = value),
		});

		// NOTE - DATA TYPE 2

		this.renderCountTypeSetting(containerEl, {
			name: "2nd data type to show",
			oldCountType: this.plugin.settings.countType2,
			setNewCountType: (value) => {
				this.plugin.settings.countType2 = value;
				this.plugin.settings.countType2Suffix =
					COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[this.plugin.settings.countType2];
			},
		});

		this.renderCustomFormatSetting(containerEl, {
			countType: this.plugin.settings.countType2,
			oldSuffix: this.plugin.settings.countType2Suffix,
			setNewSuffix: (value) => (this.plugin.settings.countType2Suffix = value),
		});

		// NOTE - DATA TYPE 3

		this.renderCountTypeSetting(containerEl, {
			name: "3rd data type to show",
			oldCountType: this.plugin.settings.countType3,
			setNewCountType: (value) => {
				this.plugin.settings.countType3 = value;
				this.plugin.settings.countType3Suffix =
					COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[this.plugin.settings.countType3];
			},
		});

		this.renderCustomFormatSetting(containerEl, {
			countType: this.plugin.settings.countType3,
			oldSuffix: this.plugin.settings.countType3Suffix,
			setNewSuffix: (value) => (this.plugin.settings.countType3Suffix = value),
		});

		// NOTE - SEPARATOR
		if (this.plugin.settings.useAdvancedFormatting) {
			new Setting(containerEl).setName("Data type separator").addText((text) =>
				text
					.setValue(this.plugin.settings.pipeSeparator)
					.onChange(async (value) => {
						this.plugin.settings.pipeSeparator = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					})
			);
		}

		// NOTE - ABBREVIATE DESCRIPTIONS

		if (!this.plugin.settings.useAdvancedFormatting) {
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
		}

		// NOTE - ALIGNMENT

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
	}

	private renderFolderSettings(containerEl: HTMLElement): void {
		containerEl.createEl("hr");

		// SHOW SAME DATA ON FOLDERS

		new Setting(containerEl)
			.setHeading()
			.setName("Folders: Same data as Notes")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showSameCountsOnFolders)
					.onChange(async (value) => {
						this.plugin.settings.showSameCountsOnFolders = value;
						await this.plugin.saveSettings();
						this.display();

						await this.plugin.updateDisplayedCounts();
					})
			);

		if (!this.plugin.settings.showSameCountsOnFolders) {
			// FOLDER - DATA TYPE 1

			this.renderCountTypeSetting(containerEl, {
				name: "1st data type to show",
				oldCountType: this.plugin.settings.folderCountType,
				setNewCountType: (value) => {
					this.plugin.settings.folderCountType = value;
					this.plugin.settings.folderCountTypeSuffix =
						COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[
							this.plugin.settings.folderCountType
						];
				},
			});

			this.renderCustomFormatSetting(containerEl, {
				countType: this.plugin.settings.folderCountType,
				oldSuffix: this.plugin.settings.folderCountTypeSuffix,
				setNewSuffix: (value) =>
					(this.plugin.settings.folderCountTypeSuffix = value),
			});

			// FOLDER - DATA TYPE 2

			this.renderCountTypeSetting(containerEl, {
				name: "2nd data type to show",
				oldCountType: this.plugin.settings.folderCountType2,
				setNewCountType: (value) => {
					this.plugin.settings.folderCountType2 = value;
					this.plugin.settings.folderCountType2Suffix =
						COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[
							this.plugin.settings.folderCountType2
						];
				},
			});

			this.renderCustomFormatSetting(containerEl, {
				countType: this.plugin.settings.folderCountType2,
				oldSuffix: this.plugin.settings.folderCountType2Suffix,
				setNewSuffix: (value) =>
					(this.plugin.settings.folderCountType2Suffix = value),
			});

			// FOLDER - DATA TYPE 3

			this.renderCountTypeSetting(containerEl, {
				name: "3rd data type to show",
				oldCountType: this.plugin.settings.folderCountType3,
				setNewCountType: (value) => {
					this.plugin.settings.folderCountType3 = value;
					this.plugin.settings.folderCountType3Suffix =
						COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[
							this.plugin.settings.folderCountType3
						];
				},
			});

			this.renderCustomFormatSetting(containerEl, {
				countType: this.plugin.settings.folderCountType3,
				oldSuffix: this.plugin.settings.folderCountType3Suffix,
				setNewSuffix: (value) =>
					(this.plugin.settings.folderCountType3Suffix = value),
			});

			// FOLDER - SEPARATOR
			if (this.plugin.settings.useAdvancedFormatting) {
				new Setting(containerEl)
					.setName("Data type separator")
					.addText((text) =>
						text
							.setValue(this.plugin.settings.folderPipeSeparator)
							.onChange(async (value) => {
								this.plugin.settings.folderPipeSeparator = value;
								await this.plugin.saveSettings();
								await this.plugin.updateDisplayedCounts();
							})
					);
			}

			// FOLDER - ABBREVIATE DESCRIPTIONS

			if (!this.plugin.settings.useAdvancedFormatting) {
				new Setting(containerEl)
					.setName("Abbreviate descriptions")
					.addToggle((toggle) =>
						toggle
							.setValue(this.plugin.settings.folderAbbreviateDescriptions)
							.onChange(async (value) => {
								this.plugin.settings.folderAbbreviateDescriptions = value;
								await this.plugin.saveSettings();
								await this.plugin.updateDisplayedCounts();
							})
					);
			}

			// FOLDER - ALIGNMENT

			new Setting(containerEl).setName("Alignment").addDropdown((drop) => {
				drop
					.addOption(AlignmentType.Inline, "Inline")
					.addOption(AlignmentType.Right, "Right-aligned")
					.addOption(AlignmentType.Below, "Below")
					.setValue(this.plugin.settings.folderAlignment)
					.onChange(async (value: AlignmentType) => {
						this.plugin.settings.folderAlignment = value;
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					});
			});
		}
	}

	private renderAdvancedSettings(containerEl: HTMLElement): void {
		containerEl.createEl("hr");

		new Setting(containerEl)
			.setHeading()
			.setName("Show advanced options")
			.setDesc("Language compatibility and fine-tuning")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showAdvanced)
					.onChange(async (value) => {
						this.plugin.settings.showAdvanced = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (this.plugin.settings.showAdvanced) {
			// INCLUDE DIRECTORIES

			new Setting(containerEl)
				.setName("Include directories")
				.setDesc(
					"Only include specific directories. Defaults to all directories. Can be used to exclude directories from displaying counts."
				)
				.addText((txt) => {
					txt
						.setPlaceholder("")
						.setValue(this.plugin.settings.includeDirectories.toString())
						.onChange(async (value) => {
							this.plugin.settings.includeDirectories = value;
							await this.plugin.saveSettings();
							await this.plugin.initialize();
						});
				});

			// EXCLUDE COMMENTS

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
							await this.plugin.saveSettings();
							await this.plugin.initialize();
						})
				);

			// EXCLUDE CODE BLOCKS

			new Setting(containerEl)
				.setName("Exclude code blocks")
				.setDesc(
					"Exclude ```code blocks``` (e.g. DataView snippets) from all counts. May affect performance on large vaults."
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.excludeCodeBlocks)
						.onChange(async (value) => {
							this.plugin.settings.excludeCodeBlocks = value;
							await this.plugin.saveSettings();
							await this.plugin.initialize();
						})
				);

			// CHARACTER COUNT METHOD

			new Setting(containerEl)
				.setName("Character count method")
				.setDesc("For language compatibility")
				.addDropdown((drop) => {
					drop
						.addOption(CharacterCountType.StringLength, "All characters")
						.addOption(
							CharacterCountType.ExcludeWhitespace,
							"Exclude whitespace"
						)
						.setValue(this.plugin.settings.characterCountType)
						.onChange(async (value: CharacterCountType) => {
							this.plugin.settings.characterCountType = value;
							await this.plugin.saveSettings();
							await this.plugin.initialize();
						});
				});

			// WORD COUNT METHOD

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
							await this.plugin.saveSettings();
							this.display();

							await this.plugin.initialize();
						});
				});

			// PAGE COUNT METHOD

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
							this.display();

							await this.plugin.updateDisplayedCounts();
						});
				});

			// READING TIME

			if (
				[WordCountType.SpaceDelimited, WordCountType.AutoDetect].includes(
					this.plugin.settings.wordCountType
				)
			) {
				const wordsPerMinuteChanged = async (
					txt: TextComponent,
					value: string
				) => {
					const asNumber = Number(value);
					const isValid = !isNaN(asNumber) && asNumber > 0;

					txt.inputEl.style.borderColor = isValid ? null : "red";

					this.plugin.settings.wordsPerMinute = isValid ? Number(value) : 265;
					await this.plugin.saveSettings();
					await this.plugin.initialize();
				};
				new Setting(containerEl)
					.setName("Words per minute")
					.setDesc(
						"Used to calculate Reading Time. 265 is the average speed of an English-speaking adult."
					)
					.addText((txt) => {
						txt
							.setPlaceholder("265")
							.setValue(this.plugin.settings.wordsPerMinute.toString())
							.onChange(debounce(wordsPerMinuteChanged.bind(this, txt), 1000));
					});
			}

			if (
				[WordCountType.CJK, WordCountType.AutoDetect].includes(
					this.plugin.settings.wordCountType
				)
			) {
				const charsPerMinuteChanged = async (
					txt: TextComponent,
					value: string
				) => {
					const asNumber = Number(value);
					const isValid = !isNaN(asNumber) && asNumber > 0;

					txt.inputEl.style.borderColor = isValid ? null : "red";

					this.plugin.settings.charsPerMinute = isValid ? Number(value) : 500;
					await this.plugin.saveSettings();
					await this.plugin.initialize();
				};
				new Setting(containerEl)
					.setName("Characters per minute")
					.setDesc(
						"Used to calculate Reading Time. 500 is the average speed for CJK texts."
					)
					.addText((txt) => {
						txt
							.setPlaceholder("500")
							.setValue(this.plugin.settings.charsPerMinute.toString())
							.onChange(debounce(charsPerMinuteChanged.bind(this, txt), 1000));
					});
			}

			// WORDS PER PAGE

			if (this.plugin.settings.pageCountType === PageCountType.ByWords) {
				const wordsPerPageChanged = async (
					txt: TextComponent,
					value: string
				) => {
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

			// INCLUDE WHITESPACE IN PAGE COUNT

			if (this.plugin.settings.pageCountType === PageCountType.ByChars) {
				new Setting(containerEl)
					.setName("Include whitespace characters in page count")
					.addToggle((toggle) =>
						toggle
							.setValue(this.plugin.settings.charsPerPageIncludesWhitespace)
							.onChange(async (value) => {
								this.plugin.settings.charsPerPageIncludesWhitespace = value;
								await this.plugin.saveSettings();
								this.display();

								await this.plugin.initialize();
							})
					);

				// CHARACTERS PER PAGE

				const charsPerPageChanged = async (
					txt: TextComponent,
					value: string
				) => {
					const asNumber = Number(value);
					const isValid = !isNaN(asNumber) && asNumber > 0;

					txt.inputEl.style.borderColor = isValid ? null : "red";

					const defaultCharsPerPage = 1500;
					this.plugin.settings.charsPerPage = isValid
						? Number(value)
						: defaultCharsPerPage;
					await this.plugin.saveSettings();
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

			// DEBUG MODE

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

	private renderReanalyzeButton(containerEl: HTMLElement): void {
		containerEl.createEl("hr");

		// REANALYZE

		new Setting(containerEl)
			.setHeading()
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

	private renderCountTypeSetting(
		containerEl: HTMLElement,
		config: {
			name: string;
			oldCountType: CountType;
			setNewCountType: (newCountType: CountType) => void;
		}
	): void {
		new Setting(containerEl)
			.setName(config.name)
			.setDesc(getDescription(config.oldCountType))
			.addDropdown((drop) => {
				for (const countType of COUNT_TYPES) {
					drop.addOption(countType, COUNT_TYPE_DISPLAY_STRINGS[countType]);
				}

				drop
					.setValue(config.oldCountType)
					.onChange(async (value: CountType) => {
						config.setNewCountType(value);
						await this.plugin.saveSettings();
						this.display();

						await this.plugin.updateDisplayedCounts();
					});
			});
	}

	private renderCustomFormatSetting(
		containerEl: HTMLElement,
		config: {
			countType: CountType;
			oldSuffix: string;
			setNewSuffix: (newSuffix: string) => void;
		}
	): void {
		if (
			!this.plugin.settings.useAdvancedFormatting ||
			config.countType === CountType.None
		) {
			return;
		}

		if (UNFORMATTABLE_COUNT_TYPES.includes(config.countType)) {
			new Setting(containerEl).setDesc(
				`[${COUNT_TYPE_DISPLAY_STRINGS[config.countType]}] can't be formatted.`
			);
		} else {
			new Setting(containerEl)
				.setDesc(
					`[${COUNT_TYPE_DISPLAY_STRINGS[config.countType]}] Custom suffix`
				)
				.addText((text) =>
					text.setValue(config.oldSuffix).onChange(async (value) => {
						config.setNewSuffix(value);
						await this.plugin.saveSettings();
						await this.plugin.updateDisplayedCounts();
					})
				);
		}
	}
}
