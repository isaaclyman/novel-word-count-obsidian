import type NovelWordCountPlugin from "main";
import { CountData, TargetNode } from "./file";
import {
	CharacterCountType,
	$CountType,
	NovelWordCountSettings,
	CountTypeConfiguration,
	$SessionCountType,
} from "./settings";
import { FileSizeHelper } from "./filesize";
import { ReadTimeHelper } from "./readtime";
import { NumberFormatDecimal, NumberFormatDefault } from "./locale_format";
import { moment } from "obsidian";

interface CountTypeWithOverrides extends CountTypeConfiguration {
	$countType: $CountType;
}

export class NodeLabelHelper {
	private fileSizeHelper = new FileSizeHelper();
	private readTimeHelper = new ReadTimeHelper();

	private get settings(): NovelWordCountSettings {
		return this.plugin.settings;
	}

	constructor(private plugin: NovelWordCountPlugin) {}

	getNodeLabel(counts: CountData): string {
		let countTypes: CountTypeWithOverrides[];
		let abbreviateDescriptions: boolean;
		let separator: string;

		const noteCountTypes = [
			this.getCountTypeWithSuffix(
				this.settings.countType,
				this.settings.countConfig,
			),
			this.getCountTypeWithSuffix(
				this.settings.countType2,
				this.settings.countConfig2,
			),
			this.getCountTypeWithSuffix(
				this.settings.countType3,
				this.settings.countConfig3,
			),
		];
		const noteAbbreviateDescriptions = this.settings.abbreviateDescriptions;
		const noteSeparator = this.settings.useAdvancedFormatting
			? this.settings.pipeSeparator
			: "|";

		switch (counts.targetNodeType) {
			case TargetNode.Root:
				if (this.settings.showSameCountsOnRoot) {
					countTypes = noteCountTypes;
					abbreviateDescriptions = noteAbbreviateDescriptions;
					separator = noteSeparator;
					break;
				}

				countTypes = [
					this.getCountTypeWithSuffix(
						this.settings.rootCountType,
						this.settings.rootCountConfig,
					),
					this.getCountTypeWithSuffix(
						this.settings.rootCountType2,
						this.settings.rootCountConfig2,
					),
					this.getCountTypeWithSuffix(
						this.settings.rootCountType3,
						this.settings.rootCountConfig3,
					),
				];
				abbreviateDescriptions = this.settings.rootAbbreviateDescriptions;
				separator = this.settings.useAdvancedFormatting ? this.settings.rootPipeSeparator : noteSeparator;

				break;
			case TargetNode.Directory:
				if (this.settings.showSameCountsOnFolders) {
					countTypes = noteCountTypes;
					abbreviateDescriptions = noteAbbreviateDescriptions;
					separator = noteSeparator;
					break;
				}

				countTypes = [
					this.getCountTypeWithSuffix(
						this.settings.folderCountType,
						this.settings.folderCountConfig,
					),
					this.getCountTypeWithSuffix(
						this.settings.folderCountType2,
						this.settings.folderCountConfig2,
					),
					this.getCountTypeWithSuffix(
						this.settings.folderCountType3,
						this.settings.folderCountConfig3,
					),
				];
				abbreviateDescriptions = this.settings.folderAbbreviateDescriptions;
				separator = this.settings.useAdvancedFormatting ? this.settings.folderPipeSeparator : noteSeparator;

				break;
			default:
				countTypes = noteCountTypes;
				abbreviateDescriptions = noteAbbreviateDescriptions;
				separator = noteSeparator;
				break;
		}

		return countTypes
			.filter((ct) => ct.$countType !== $CountType.None)
			.map((ct) =>
				this.getDataTypeLabel(
					counts,
					ct,
					abbreviateDescriptions,
				)
			)
			.filter((display) => display !== null)
			.join(` ${separator} `);
	}

	private getCountTypeWithSuffix(
		$countType: $CountType,
		countConfig: CountTypeConfiguration,
	): CountTypeWithOverrides {
		return {
			$countType,
			customSuffix: this.settings.useAdvancedFormatting ? countConfig.customSuffix : null,
			frontmatterKey: countConfig.frontmatterKey,
			$sessionCountType: countConfig.$sessionCountType
		};
	}

	private getBasicCountString(config: {
		count: string;
		noun: string;
		abbreviatedNoun: string;
		abbreviateDescriptions: boolean;
		customSuffix: string | null;
	}): string {
		const defaultSuffix = config.abbreviateDescriptions
			? config.abbreviatedNoun
			: ` ${config.noun}${config.count == "1" ? "" : "s"}`;
		const suffix = config.customSuffix ?? defaultSuffix;

		return `${config.count}${suffix}`;
	}

	private readonly unconditionalCountTypes: $CountType[] = [
		$CountType.Created,
		$CountType.FileSize,
		$CountType.Modified,
	];

	private getDataTypeLabel(
		counts: CountData,
		config: CountTypeWithOverrides,
		abbreviateDescriptions: boolean,
	): string | null {
		if (!counts || typeof counts.wordCount !== "number") {
			return null;
		}

		if (
			!counts.isCountable &&
			!this.unconditionalCountTypes.includes(config.$countType)
		) {
			return null;
		}

		switch (config.$countType) {
			case $CountType.None:
				return null;
			case $CountType.Word:
				return this.getBasicCountString({
					count: NumberFormatDefault.format(Math.ceil(counts.wordCount)),
					noun: "word",
					abbreviatedNoun: "w",
					abbreviateDescriptions,
					customSuffix: config.customSuffix,
				});
			case $CountType.Page:
				return this.getBasicCountString({
					count: NumberFormatDefault.format(Math.ceil(counts.pageCount)),
					noun: "page",
					abbreviatedNoun: "p",
					abbreviateDescriptions,
					customSuffix: config.customSuffix,
				});
			case $CountType.PageDecimal:
				return this.getBasicCountString({
					count: NumberFormatDecimal.format(counts.pageCount),
					noun: "page",
					abbreviatedNoun: "p",
					abbreviateDescriptions,
					customSuffix: config.customSuffix,
				});
			case $CountType.PercentGoal: {
				if (counts.wordGoal <= 0) {
					return null;
				}

				const fraction = counts.wordCountTowardGoal / counts.wordGoal;
				const percent = NumberFormatDefault.format(Math.round(fraction * 100));
				const defaultSuffix = abbreviateDescriptions
					? "%"
					: `% of ${NumberFormatDefault.format(counts.wordGoal)}`;
				const suffix = config.customSuffix ?? defaultSuffix;

				return `${percent}${suffix}`;
			}
			case $CountType.Note:
				return this.getBasicCountString({
					count: NumberFormatDefault.format(counts.noteCount),
					noun: "note",
					abbreviatedNoun: "n",
					abbreviateDescriptions,
					customSuffix: config.customSuffix,
				});
			case $CountType.Character: {
				const characterCount =
					this.settings.characterCountType ===
					CharacterCountType.ExcludeWhitespace
						? counts.nonWhitespaceCharacterCount
						: counts.characterCount;

				return this.getBasicCountString({
					count: NumberFormatDefault.format(characterCount),
					noun: "character",
					abbreviatedNoun: "ch",
					abbreviateDescriptions,
					customSuffix: config.customSuffix,
				});
			}
			case $CountType.ReadTime:
				return this.readTimeHelper.formatReadTime(
					counts.readingTimeInMinutes,
					abbreviateDescriptions
				);
			case $CountType.Link:
				if (counts.linkCount === 0) {
					return null;
				}

				return this.getBasicCountString({
					count: NumberFormatDefault.format(counts.linkCount),
					noun: "link",
					abbreviatedNoun: "x",
					abbreviateDescriptions,
					customSuffix: config.customSuffix,
				});
			case $CountType.Embed:
				if (counts.embedCount === 0) {
					return null;
				}

				return this.getBasicCountString({
					count: NumberFormatDefault.format(counts.embedCount),
					noun: "embed",
					abbreviatedNoun: "em",
					abbreviateDescriptions,
					customSuffix: config.customSuffix,
				});
			case $CountType.Alias:
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
			case $CountType.Created: {
				if (counts.createdDate === 0) {
					return null;
				}

				const cDate = moment(counts.createdDate).format(this.settings.momentDateFormat || "YYYY/MM/DD");
				if (config.customSuffix !== null) {
					return `${cDate}${config.customSuffix}`;
				}

				return abbreviateDescriptions ? `${cDate}/c` : `Created ${cDate}`;
			}
			case $CountType.Modified: {
				if (counts.modifiedDate === 0) {
					return null;
				}

				const uDate = moment(counts.modifiedDate).format(this.settings.momentDateFormat || "YYYY/MM/DD");
				if (config.customSuffix !== null) {
					return `${uDate}${config.customSuffix}`;
				}

				return abbreviateDescriptions ? `${uDate}/u` : `Updated ${uDate}`;
			}
			case $CountType.FileSize:
				return this.fileSizeHelper.formatFileSize(
					counts.sizeInBytes,
					abbreviateDescriptions
				);
			case $CountType.FrontmatterKey: {
				if (!config.frontmatterKey) {
					return null;
				}

				const value = counts?.frontmatter?.[config.frontmatterKey];
				if (value === undefined || value === null) {
					return null;
				}

				if (config.customSuffix !== null) {
					return `${value}${config.customSuffix}`;
				}

				return value;
			}
			case $CountType.TrackSession: {
				if (!config.$sessionCountType) {
					return null;
				}

				const quantity = this.getSessionQuantity(counts, config.$sessionCountType);

				if (config.customSuffix !== null) {
					return `${quantity}${config.customSuffix}`;
				}

				return abbreviateDescriptions ? `${quantity}/s` : `Session: ${quantity}`;
			}
		}

		return null;
	}

	private getSessionQuantity(counts: CountData, $countType: $SessionCountType): string {
		switch ($countType) {
			case $CountType.Word:
				return NumberFormatDefault.format(Math.ceil(counts.wordCount - counts.sessionStart.wordCount));
			case $CountType.Page:
				return NumberFormatDefault.format(Math.ceil(counts.pageCount - counts.sessionStart.pageCount));
			case $CountType.PageDecimal:
				return NumberFormatDecimal.format(counts.pageCount - counts.sessionStart.pageCount);
			case $CountType.Note:
				return NumberFormatDefault.format(counts.noteCount - counts.sessionStart.noteCount);
			case $CountType.Character: {
				const characterCount =
					this.settings.characterCountType ===
					CharacterCountType.ExcludeWhitespace
						? counts.nonWhitespaceCharacterCount
						: counts.characterCount;
				const startingCharacterCount =
					this.settings.characterCountType ===
					CharacterCountType.ExcludeWhitespace
						? counts.sessionStart.nonWhitespaceCharacterCount
						: counts.sessionStart.characterCount;

				return NumberFormatDefault.format(characterCount - startingCharacterCount);
			}
		}
	}
}
