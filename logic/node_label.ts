import type NovelWordCountPlugin from "main";
import { CountData, TargetNode } from "./file";
import {
	CharacterCountType,
	$CountType,
	NovelWordCountSettings,
} from "./settings";
import { FileSizeHelper } from "./filesize";
import { ReadTimeHelper } from "./readtime";
import { NumberFormatDecimal, NumberFormatDefault } from "./locale_format";
import { moment } from "obsidian";

interface CountTypeWithSuffix {
	countType: $CountType;
	overrideSuffix: string | null;
	frontmatterKey?: string;
}

export class NodeLabelHelper {
	private fileSizeHelper = new FileSizeHelper();
	private readTimeHelper = new ReadTimeHelper();

	private get settings(): NovelWordCountSettings {
		return this.plugin.settings;
	}

	constructor(private plugin: NovelWordCountPlugin) {}

	getNodeLabel(counts: CountData): string {
		let countTypes: CountTypeWithSuffix[];
		let abbreviateDescriptions: boolean;
		let separator: string;

		const noteCountTypes = [
			this.getCountTypeWithSuffix(
				this.settings.countType,
				this.settings.countTypeSuffix,
				this.settings.frontmatterKey
			),
			this.getCountTypeWithSuffix(
				this.settings.countType2,
				this.settings.countType2Suffix,
				this.settings.frontmatterKey2
			),
			this.getCountTypeWithSuffix(
				this.settings.countType3,
				this.settings.countType3Suffix,
				this.settings.frontmatterKey3
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
						this.settings.rootCountTypeSuffix
					),
					this.getCountTypeWithSuffix(
						this.settings.rootCountType2,
						this.settings.rootCountType2Suffix
					),
					this.getCountTypeWithSuffix(
						this.settings.rootCountType3,
						this.settings.rootCountType3Suffix
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
						this.settings.folderCountTypeSuffix
					),
					this.getCountTypeWithSuffix(
						this.settings.folderCountType2,
						this.settings.folderCountType2Suffix
					),
					this.getCountTypeWithSuffix(
						this.settings.folderCountType3,
						this.settings.folderCountType3Suffix
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
			.filter((ct) => ct.countType !== $CountType.None)
			.map((ct) =>
				this.getDataTypeLabel(
					counts,
					ct.countType,
					abbreviateDescriptions,
					ct.overrideSuffix,
					ct.frontmatterKey
				)
			)
			.filter((display) => display !== null)
			.join(` ${separator} `);
	}

	private getCountTypeWithSuffix(
		countType: $CountType,
		customSuffix: string,
		frontmatterKey?: string
	): CountTypeWithSuffix {
		return {
			countType,
			overrideSuffix: this.settings.useAdvancedFormatting ? customSuffix : null,
			frontmatterKey,
		};
	}

	private getBasicCountString(config: {
		count: string;
		noun: string;
		abbreviatedNoun: string;
		abbreviateDescriptions: boolean;
		overrideSuffix: string | null;
	}): string {
		const defaultSuffix = config.abbreviateDescriptions
			? config.abbreviatedNoun
			: ` ${config.noun}${config.count == "1" ? "" : "s"}`;
		const suffix = config.overrideSuffix ?? defaultSuffix;

		return `${config.count}${suffix}`;
	}

	private readonly unconditionalCountTypes: $CountType[] = [
		$CountType.Created,
		$CountType.FileSize,
		$CountType.Modified,
	];

	private getDataTypeLabel(
		counts: CountData,
		countType: $CountType,
		abbreviateDescriptions: boolean,
		overrideSuffix: string | null,
		frontmatterKey?: string
	): string | null {
		if (!counts || typeof counts.wordCount !== "number") {
			return null;
		}

		if (
			!counts.isCountable &&
			!this.unconditionalCountTypes.includes(countType)
		) {
			return null;
		}

		switch (countType) {
			case $CountType.None:
				return null;
			case $CountType.Word:
				return this.getBasicCountString({
					count: NumberFormatDefault.format(Math.ceil(counts.wordCount)),
					noun: "word",
					abbreviatedNoun: "w",
					abbreviateDescriptions,
					overrideSuffix,
				});
			case $CountType.Page:
				return this.getBasicCountString({
					count: NumberFormatDefault.format(Math.ceil(counts.pageCount)),
					noun: "page",
					abbreviatedNoun: "p",
					abbreviateDescriptions,
					overrideSuffix,
				});
			case $CountType.PageDecimal:
				return this.getBasicCountString({
					count: NumberFormatDecimal.format(counts.pageCount),
					noun: "page",
					abbreviatedNoun: "p",
					abbreviateDescriptions,
					overrideSuffix,
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
				const suffix = overrideSuffix ?? defaultSuffix;

				return `${percent}${suffix}`;
			}
			case $CountType.Note:
				return this.getBasicCountString({
					count: NumberFormatDefault.format(counts.noteCount),
					noun: "note",
					abbreviatedNoun: "n",
					abbreviateDescriptions,
					overrideSuffix,
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
					overrideSuffix,
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
					overrideSuffix,
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
					overrideSuffix,
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

				const cDate = moment(counts.createdDate).format("YYYY/MM/DD");
				if (overrideSuffix !== null) {
					return `${cDate}${overrideSuffix}`;
				}

				return abbreviateDescriptions ? `${cDate}/c` : `Created ${cDate}`;
			}
			case $CountType.Modified: {
				if (counts.modifiedDate === 0) {
					return null;
				}

				const uDate = moment(counts.modifiedDate).format("YYYY/MM/DD");
				if (overrideSuffix !== null) {
					return `${uDate}${overrideSuffix}`;
				}

				return abbreviateDescriptions ? `${uDate}/u` : `Updated ${uDate}`;
			}
			case $CountType.FileSize:
				return this.fileSizeHelper.formatFileSize(
					counts.sizeInBytes,
					abbreviateDescriptions
				);
			case $CountType.FrontmatterKey: {
				if (!frontmatterKey) {
					return null;
				}
				const value = counts?.frontmatter?.[frontmatterKey];
				if (value === undefined || value === null) {
					return null;
				}
				if (overrideSuffix !== null) {
					return `${value}${overrideSuffix}`;
				}
				return value;
			}
		}

		return null;
	}
}
