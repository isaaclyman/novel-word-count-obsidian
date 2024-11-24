import type NovelWordCountPlugin from "main";
import {
	App,
	PluginSettingTab,
	Setting,
	TextComponent,
	debounce,
} from "obsidian";
import {
	$CountType,
	$SessionCountType,
	AlignmentType,
	CharacterCountType,
	COUNT_TYPE_DEFAULT_SHORT_SUFFIXES,
	COUNT_TYPE_DISPLAY_STRINGS,
	COUNT_TYPES,
	getDescription,
	PageCountType,
	SESSION_COUNT_TYPES,
	UNFORMATTABLE_COUNT_TYPES,
} from "./settings";

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
		this.renderRootSettings(containerEl);
		this.renderAdvancedSettings(containerEl);
		this.renderReanalyzeButton(containerEl);
		this.renderDonationButton(containerEl);
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
				this.plugin.settings.countConfig.customSuffix =
					COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[this.plugin.settings.countType];
			},
		});

    this.renderSessionCountTypeSetting(containerEl, {
      parentCountType: this.plugin.settings.countType,
      oldCountType: this.plugin.settings.countConfig.$sessionCountType,
      setNewCountType: (value) => {
        this.plugin.settings.countConfig.$sessionCountType = value;
      },
    });

		this.renderFrontmatterKeySetting(containerEl, {
			countType: this.plugin.settings.countType,
			oldKey: this.plugin.settings.countConfig.frontmatterKey,
			setNewKey: (value) =>
				(this.plugin.settings.countConfig.frontmatterKey = value),
		});

		this.renderCustomFormatSetting(containerEl, {
			countType: this.plugin.settings.countType,
			oldSuffix: this.plugin.settings.countConfig.customSuffix,
			setNewSuffix: (value) =>
				(this.plugin.settings.countConfig.customSuffix = value),
		});

		// NOTE - DATA TYPE 2

		this.renderCountTypeSetting(containerEl, {
			name: "2nd data type to show",
			oldCountType: this.plugin.settings.countType2,
			setNewCountType: (value) => {
				this.plugin.settings.countType2 = value;
				this.plugin.settings.countConfig2.customSuffix =
					COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[this.plugin.settings.countType2];
			},
		});

    this.renderSessionCountTypeSetting(containerEl, {
      parentCountType: this.plugin.settings.countType2,
      oldCountType: this.plugin.settings.countConfig2.$sessionCountType,
      setNewCountType: (value) => {
        this.plugin.settings.countConfig2.$sessionCountType = value;
      },
    });

		this.renderFrontmatterKeySetting(containerEl, {
			countType: this.plugin.settings.countType2,
			oldKey: this.plugin.settings.countConfig2.frontmatterKey,
			setNewKey: (value) =>
				(this.plugin.settings.countConfig2.frontmatterKey = value),
		});

		this.renderCustomFormatSetting(containerEl, {
			countType: this.plugin.settings.countType2,
			oldSuffix: this.plugin.settings.countConfig2.customSuffix,
			setNewSuffix: (value) =>
				(this.plugin.settings.countConfig2.customSuffix = value),
		});

		// NOTE - DATA TYPE 3

		this.renderCountTypeSetting(containerEl, {
			name: "3rd data type to show",
			oldCountType: this.plugin.settings.countType3,
			setNewCountType: (value) => {
				this.plugin.settings.countType3 = value;
				this.plugin.settings.countConfig3.customSuffix =
					COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[this.plugin.settings.countType3];
			},
		});

    this.renderSessionCountTypeSetting(containerEl, {
      parentCountType: this.plugin.settings.countType3,
      oldCountType: this.plugin.settings.countConfig3.$sessionCountType,
      setNewCountType: (value) => {
        this.plugin.settings.countConfig3.$sessionCountType = value;
      },
    });

		this.renderFrontmatterKeySetting(containerEl, {
			countType: this.plugin.settings.countType3,
			oldKey: this.plugin.settings.countConfig3.frontmatterKey,
			setNewKey: (value) =>
				(this.plugin.settings.countConfig3.frontmatterKey = value),
		});

		this.renderCustomFormatSetting(containerEl, {
			countType: this.plugin.settings.countType3,
			oldSuffix: this.plugin.settings.countConfig3.customSuffix,
			setNewSuffix: (value) =>
				(this.plugin.settings.countConfig3.customSuffix = value),
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
		this.renderSeparator(containerEl);

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
					this.plugin.settings.folderCountConfig.customSuffix =
						COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[
							this.plugin.settings.folderCountType
						];
				},
			});

      this.renderSessionCountTypeSetting(containerEl, {
        parentCountType: this.plugin.settings.folderCountType,
        oldCountType: this.plugin.settings.folderCountConfig.$sessionCountType,
        setNewCountType: (value) => {
          this.plugin.settings.folderCountConfig.$sessionCountType = value;
        },
      });

			this.renderCustomFormatSetting(containerEl, {
				countType: this.plugin.settings.folderCountType,
				oldSuffix: this.plugin.settings.folderCountConfig.customSuffix,
				setNewSuffix: (value) =>
					(this.plugin.settings.folderCountConfig.customSuffix = value),
			});

			// FOLDER - DATA TYPE 2

			this.renderCountTypeSetting(containerEl, {
				name: "2nd data type to show",
				oldCountType: this.plugin.settings.folderCountType2,
				setNewCountType: (value) => {
					this.plugin.settings.folderCountType2 = value;
					this.plugin.settings.folderCountConfig2.customSuffix =
						COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[
							this.plugin.settings.folderCountType2
						];
				},
			});

      this.renderSessionCountTypeSetting(containerEl, {
        parentCountType: this.plugin.settings.folderCountType2,
        oldCountType: this.plugin.settings.folderCountConfig2.$sessionCountType,
        setNewCountType: (value) => {
          this.plugin.settings.folderCountConfig2.$sessionCountType = value;
        },
      });

			this.renderCustomFormatSetting(containerEl, {
				countType: this.plugin.settings.folderCountType2,
				oldSuffix: this.plugin.settings.folderCountConfig2.customSuffix,
				setNewSuffix: (value) =>
					(this.plugin.settings.folderCountConfig2.customSuffix = value),
			});

			// FOLDER - DATA TYPE 3

			this.renderCountTypeSetting(containerEl, {
				name: "3rd data type to show",
				oldCountType: this.plugin.settings.folderCountType3,
				setNewCountType: (value) => {
					this.plugin.settings.folderCountType3 = value;
					this.plugin.settings.folderCountConfig3.customSuffix =
						COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[
							this.plugin.settings.folderCountType3
						];
				},
			});

      this.renderSessionCountTypeSetting(containerEl, {
        parentCountType: this.plugin.settings.folderCountType3,
        oldCountType: this.plugin.settings.folderCountConfig3.$sessionCountType,
        setNewCountType: (value) => {
          this.plugin.settings.folderCountConfig3.$sessionCountType = value;
        },
      });

			this.renderCustomFormatSetting(containerEl, {
				countType: this.plugin.settings.folderCountType3,
				oldSuffix: this.plugin.settings.folderCountConfig3.customSuffix,
				setNewSuffix: (value) =>
					(this.plugin.settings.folderCountConfig3.customSuffix = value),
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

	private renderRootSettings(containerEl: HTMLElement): void {
		this.renderSeparator(containerEl);

		// SHOW SAME DATA ON ROOT

		new Setting(containerEl)
			.setHeading()
			.setName("Root: Same data as Notes")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showSameCountsOnRoot)
					.onChange(async (value) => {
						this.plugin.settings.showSameCountsOnRoot = value;
						await this.plugin.saveSettings();
						this.display();

						await this.plugin.updateDisplayedCounts();
					})
			);

		if (!this.plugin.settings.showSameCountsOnRoot) {
			// ROOT - DATA TYPE 1

			this.renderCountTypeSetting(containerEl, {
				name: "1st data type to show",
				oldCountType: this.plugin.settings.rootCountType,
				setNewCountType: (value) => {
					this.plugin.settings.rootCountType = value;
					this.plugin.settings.rootCountConfig.customSuffix =
						COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[
							this.plugin.settings.rootCountType
						];
				},
			});

      this.renderSessionCountTypeSetting(containerEl, {
        parentCountType: this.plugin.settings.rootCountType,
        oldCountType: this.plugin.settings.rootCountConfig.$sessionCountType,
        setNewCountType: (value) => {
          this.plugin.settings.rootCountConfig.$sessionCountType = value;
        },
      });

			this.renderCustomFormatSetting(containerEl, {
				countType: this.plugin.settings.rootCountType,
				oldSuffix: this.plugin.settings.rootCountConfig.customSuffix,
				setNewSuffix: (value) =>
					(this.plugin.settings.rootCountConfig.customSuffix = value),
			});

			// ROOT - DATA TYPE 2

			this.renderCountTypeSetting(containerEl, {
				name: "2nd data type to show",
				oldCountType: this.plugin.settings.rootCountType2,
				setNewCountType: (value) => {
					this.plugin.settings.rootCountType2 = value;
					this.plugin.settings.rootCountConfig2.customSuffix =
						COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[
							this.plugin.settings.rootCountType2
						];
				},
			});

      this.renderSessionCountTypeSetting(containerEl, {
        parentCountType: this.plugin.settings.rootCountType2,
        oldCountType: this.plugin.settings.rootCountConfig2.$sessionCountType,
        setNewCountType: (value) => {
          this.plugin.settings.rootCountConfig2.$sessionCountType = value;
        },
      });

			this.renderCustomFormatSetting(containerEl, {
				countType: this.plugin.settings.rootCountType2,
				oldSuffix: this.plugin.settings.rootCountConfig2.customSuffix,
				setNewSuffix: (value) =>
					(this.plugin.settings.rootCountConfig2.customSuffix = value),
			});

			// ROOT - DATA TYPE 3

			this.renderCountTypeSetting(containerEl, {
				name: "3rd data type to show",
				oldCountType: this.plugin.settings.rootCountType3,
				setNewCountType: (value) => {
					this.plugin.settings.rootCountType3 = value;
					this.plugin.settings.rootCountConfig3.customSuffix =
						COUNT_TYPE_DEFAULT_SHORT_SUFFIXES[
							this.plugin.settings.rootCountType3
						];
				},
			});

      this.renderSessionCountTypeSetting(containerEl, {
        parentCountType: this.plugin.settings.rootCountType3,
        oldCountType: this.plugin.settings.rootCountConfig3.$sessionCountType,
        setNewCountType: (value) => {
          this.plugin.settings.rootCountConfig3.$sessionCountType = value;
        },
      });

			this.renderCustomFormatSetting(containerEl, {
				countType: this.plugin.settings.rootCountType3,
				oldSuffix: this.plugin.settings.rootCountConfig3.customSuffix,
				setNewSuffix: (value) =>
					(this.plugin.settings.rootCountConfig3.customSuffix = value),
			});

			// ROOT - SEPARATOR
			if (this.plugin.settings.useAdvancedFormatting) {
				new Setting(containerEl)
					.setName("Data type separator")
					.addText((text) =>
						text
							.setValue(this.plugin.settings.rootPipeSeparator)
							.onChange(async (value) => {
								this.plugin.settings.rootPipeSeparator = value;
								await this.plugin.saveSettings();
								await this.plugin.updateDisplayedCounts();
							})
					);
			}

			// ROOT - ABBREVIATE DESCRIPTIONS

			if (!this.plugin.settings.useAdvancedFormatting) {
				new Setting(containerEl)
					.setName("Abbreviate descriptions")
					.addToggle((toggle) =>
						toggle
							.setValue(this.plugin.settings.rootAbbreviateDescriptions)
							.onChange(async (value) => {
								this.plugin.settings.rootAbbreviateDescriptions = value;
								await this.plugin.saveSettings();
								await this.plugin.updateDisplayedCounts();
							})
					);
			}
		}
	}

	private renderAdvancedSettings(containerEl: HTMLElement): void {
		this.renderSeparator(containerEl);

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
			// INCLUDE FILE/FOLDER NAMES

			const includePathsChanged = async (txt: TextComponent, value: string) => {
				this.plugin.settings.includeDirectories = value;
				await this.plugin.saveSettings();
				await this.plugin.initialize();
			};

			new Setting(containerEl)
				.setName("Include file/folder names")
				.setDesc(
					"Only count paths matching the indicated term(s). Case-sensitive, comma-separated. Defaults to all files. " +
						"Any term starting with ! will be excluded instead of included."
				)
				.addText((txt) => {
					txt
						.setPlaceholder("")
						.setValue(this.plugin.settings.includeDirectories)
						.onChange(debounce(includePathsChanged.bind(this, txt), 1000));
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

			new Setting(containerEl)
				.setName("Exclude non-visible portions of links")
				.setDesc(
					"For external links, exclude the URI from all counts. For internal links with aliases, only count the alias. " +
						"May affect performance on large vaults."
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.excludeNonVisibleLinkPortions)
						.onChange(async (value) => {
							this.plugin.settings.excludeNonVisibleLinkPortions = value;
							await this.plugin.saveSettings();
							await this.plugin.initialize();
						})
				);

			new Setting(containerEl)
				.setName("Exclude footnotes")
				.setDesc(
					"Exclude footnotes[^1] from counts. May affect performance on large vaults."
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.excludeFootnotes)
						.onChange(async (value) => {
							this.plugin.settings.excludeFootnotes = value;
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
				.setName("CJK characters per minute")
				.setDesc(
					"Used to calculate Reading Time. 500 is the average speed for CJK texts."
				)
				.addText((txt) => {
					txt
						.setPlaceholder("500")
						.setValue(this.plugin.settings.charsPerMinute.toString())
						.onChange(debounce(charsPerMinuteChanged.bind(this, txt), 1000));
				});

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
		this.renderSeparator(containerEl);

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

	private renderDonationButton(containerEl: HTMLElement): void {
		this.renderSeparator(containerEl);

		const label = containerEl.createEl("div", {
			cls: [
				"setting-item",
				"setting-item-heading",
				"novel-word-count-settings-header",
				"novel-word-count-donation-line",
			],
		});
		label.createEl("div", {
			text: "Enjoying this plugin? Want more features?",
		});
		const button = label.createEl("div");
		button.innerHTML = `<a href='https://ko-fi.com/J3J6OWA5C' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>`;
	}

	private renderCountTypeSetting(
		containerEl: HTMLElement,
		config: {
			name: string;
			oldCountType: $CountType;
			setNewCountType: (newCountType: $CountType) => void;
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
					.onChange(async (value: $CountType) => {
						config.setNewCountType(value);
						await this.plugin.saveSettings();
						this.display();

						await this.plugin.updateDisplayedCounts();
					});
			});
	}

  private renderSessionCountTypeSetting(
    containerEl: HTMLElement,
    config: {
      parentCountType: $CountType,
      oldCountType: $SessionCountType;
      setNewCountType: (newCountType: $SessionCountType) => void;
    }
  ): void {
    if (config.parentCountType !== $CountType.TrackSession) {
      return;
    }
    
    new Setting(containerEl)
      .setDesc("[Track Session] Session count type")
      .addDropdown((drop) => {
        for (const countType of SESSION_COUNT_TYPES) {
          drop.addOption(countType, COUNT_TYPE_DISPLAY_STRINGS[countType]);
        }

        drop
          .setValue(config.oldCountType)
          .onChange(async (value: $SessionCountType) => {
            config.setNewCountType(value);
            await this.plugin.saveSettings();
            this.display();

            await this.plugin.updateDisplayedCounts();
          })
      })
  }

	private renderCustomFormatSetting(
		containerEl: HTMLElement,
		config: {
			countType: $CountType;
			oldSuffix: string;
			setNewSuffix: (newSuffix: string) => void;
		}
	): void {
		if (
			!this.plugin.settings.useAdvancedFormatting ||
			config.countType === $CountType.None
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

	private renderFrontmatterKeySetting(
		containerEl: HTMLElement,
		config: {
			countType: $CountType;
			oldKey: string;
			setNewKey: (newKey: string) => void;
		}
	): void {
		if (config.countType !== $CountType.FrontmatterKey) {
			return;
		}

		new Setting(containerEl)
			.setDesc(
				`[${COUNT_TYPE_DISPLAY_STRINGS[$CountType.FrontmatterKey]}] Key name`
			)
			.addText((text) =>
				text.setValue(config.oldKey).onChange(async (value) => {
					config.setNewKey(value);
					await this.plugin.saveSettings();
					await this.plugin.updateDisplayedCounts();
				})
			);
	}

	private renderSeparator(containerEl: HTMLElement) {
		containerEl.createEl("hr", {
			cls: "novel-word-count-hr",
		});
	}
}
