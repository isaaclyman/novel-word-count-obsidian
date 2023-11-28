import type NovelWordCountPlugin from "main";
import { CountData } from "./file";
import {
	CharacterCountType,
	CountType,
	NovelWordCountSettings,
} from "./settings";
import { FileSizeHelper } from "./filesize";
import { ReadTimeHelper } from "./readtime";

interface CountTypeWithSuffix {
	countType: CountType;
	overrideSuffix: string | null;
}

export class NodeLabelHelper {
	private fileSizeHelper = new FileSizeHelper();
	private readTimeHelper = new ReadTimeHelper();

	private get settings(): NovelWordCountSettings {
		return this.plugin.settings;
	}

	constructor(private plugin: NovelWordCountPlugin) {}

	getNodeLabel(counts: CountData): string {
		const countTypes: CountTypeWithSuffix[] =
			counts.isDirectory && !this.settings.showSameCountsOnFolders
				? [
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
				  ]
				: [
						this.getCountTypeWithSuffix(
							this.settings.countType,
							this.settings.countTypeSuffix
						),
						this.getCountTypeWithSuffix(
							this.settings.countType2,
							this.settings.countType2Suffix
						),
						this.getCountTypeWithSuffix(
							this.settings.countType3,
							this.settings.countType3Suffix
						),
				  ];

		const abbreviateDescriptions =
			counts.isDirectory && !this.settings.showSameCountsOnFolders
				? this.settings.folderAbbreviateDescriptions
				: this.settings.abbreviateDescriptions;

		const separator = !this.settings.useAdvancedFormatting
			? "|"
			: counts.isDirectory && !this.settings.showSameCountsOnFolders
			? this.settings.folderPipeSeparator
			: this.settings.pipeSeparator;

		return countTypes
			.filter((ct) => ct.countType !== CountType.None)
			.map((ct) =>
				this.getDataTypeLabel(counts, ct.countType, abbreviateDescriptions, ct.overrideSuffix)
			)
			.filter((display) => display !== null)
			.join(` ${separator} `);
	}

	private getCountTypeWithSuffix(
		countType: CountType,
		customSuffix: string
	): CountTypeWithSuffix {
		return {
			countType,
			overrideSuffix: this.settings.useAdvancedFormatting ? customSuffix : null,
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

	private readonly unconditionalCountTypes: CountType[] = [
		CountType.Created,
		CountType.FileSize,
		CountType.Modified,
	];

	private getDataTypeLabel(
		counts: CountData,
		countType: CountType,
    abbreviateDescriptions: boolean,
		overrideSuffix: string | null
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
			case CountType.None:
				return null;
			case CountType.Word:
				return this.getBasicCountString({
					count: Math.ceil(counts.wordCount).toLocaleString(),
					noun: "word",
					abbreviatedNoun: "w",
          abbreviateDescriptions,
					overrideSuffix,
				});
			case CountType.Page:
				return this.getBasicCountString({
					count: Math.ceil(counts.pageCount).toLocaleString(),
					noun: "page",
					abbreviatedNoun: "p",
          abbreviateDescriptions,
					overrideSuffix,
				});
			case CountType.PageDecimal:
				return this.getBasicCountString({
					count: counts.pageCount.toLocaleString(undefined, {
						minimumFractionDigits: 1,
						maximumFractionDigits: 2,
					}),
					noun: "page",
					abbreviatedNoun: "p",
          abbreviateDescriptions,
					overrideSuffix,
				});
			case CountType.PercentGoal:
				if (counts.wordGoal <= 0) {
					return null;
				}

				const fraction = counts.wordCountTowardGoal / counts.wordGoal;
				const percent = Math.round(fraction * 100).toLocaleString();
				const defaultSuffix = abbreviateDescriptions
					? "%"
					: `% of ${counts.wordGoal.toLocaleString()}`;
				const suffix = overrideSuffix ?? defaultSuffix;

				return `${percent}${suffix}`;
			case CountType.Note:
				return this.getBasicCountString({
					count: counts.noteCount.toLocaleString(),
					noun: "note",
					abbreviatedNoun: "n",
          abbreviateDescriptions,
					overrideSuffix,
				});
			case CountType.Character:
				const characterCount =
					this.settings.characterCountType ===
					CharacterCountType.ExcludeWhitespace
						? counts.nonWhitespaceCharacterCount
						: counts.characterCount;

				return this.getBasicCountString({
					count: characterCount.toLocaleString(),
					noun: "character",
					abbreviatedNoun: "ch",
          abbreviateDescriptions,
					overrideSuffix,
				});
			case CountType.ReadTime:
				return this.readTimeHelper.formatReadTime(
					counts.readingTimeInMinutes,
					abbreviateDescriptions
				);
			case CountType.Link:
				if (counts.linkCount === 0) {
					return null;
				}

        return this.getBasicCountString({
          count: counts.linkCount.toLocaleString(),
          noun: 'link',
          abbreviatedNoun: 'x',
          abbreviateDescriptions,
          overrideSuffix,
        });
			case CountType.Embed:
				if (counts.embedCount === 0) {
					return null;
				}

        return this.getBasicCountString({
          count: counts.embedCount.toLocaleString(),
          noun: 'embed',
          abbreviatedNoun: 'em',
          abbreviateDescriptions,
          overrideSuffix,
        });
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

        const cDate = new Date(counts.createdDate).toLocaleDateString();
        if (overrideSuffix !== null) {
          return `${cDate}${overrideSuffix}`;
        }

				return abbreviateDescriptions
					? `${cDate}/c`
					: `Created ${cDate}`;
			case CountType.Modified:
				if (counts.modifiedDate === 0) {
					return null;
				}

        const uDate = new Date(counts.modifiedDate).toLocaleDateString();
        if (overrideSuffix !== null) {
          return `${uDate}${overrideSuffix}`;
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
}
