import {
	$CountType,
	$SessionCountType,
	AlignmentType,
	CharacterCountType,
	PageCountType,
} from "./settings.enum";

export interface NovelWordCountSettings {
	// FORMATTING
	useAdvancedFormatting: boolean;
	// NOTES
	countType: $CountType;
	countConfig: CountTypeConfiguration;
	// countTypeSuffix: string;
	// frontmatterKey: string;
	countType2: $CountType;
	countConfig2: CountTypeConfiguration;
	// countType2Suffix: string;
	// frontmatterKey2: string;
	countType3: $CountType;
	countConfig3: CountTypeConfiguration;
	// countType3Suffix: string;
	// frontmatterKey3: string;
	pipeSeparator: string;
	abbreviateDescriptions: boolean;
	alignment: AlignmentType;
	// FOLDERS
	showSameCountsOnFolders: boolean;
	folderCountType: $CountType;
	folderCountConfig: CountTypeConfiguration;
	// folderCountTypeSuffix: string;
	folderCountType2: $CountType;
	folderCountConfig2: CountTypeConfiguration;
	// folderCountType2Suffix: string;
	folderCountType3: $CountType;
	folderCountConfig3: CountTypeConfiguration;
	// folderCountType3Suffix: string;
	folderPipeSeparator: string;
	folderAbbreviateDescriptions: boolean;
	folderAlignment: AlignmentType;
	// ROOT
	showSameCountsOnRoot: boolean;
	rootCountType: $CountType;
	rootCountConfig: CountTypeConfiguration;
	// rootCountTypeSuffix: string;
	rootCountType2: $CountType;
	rootCountConfig2: CountTypeConfiguration;
	// rootCountType2Suffix: string;
	rootCountType3: $CountType;
	rootCountConfig3: CountTypeConfiguration;
	// rootCountType3Suffix: string;
	rootPipeSeparator: string;
	rootAbbreviateDescriptions: boolean;
	// ADVANCED
	showAdvanced: boolean;
	labelOpacity: number;
	wordsPerMinute: number;
	charsPerMinute: number;
	wordsPerPage: number;
	charsPerPage: number;
	charsPerPageIncludesWhitespace: boolean;
	characterCountType: CharacterCountType;
	pageCountType: PageCountType;
	includeDirectories: string;
	excludeComments: boolean;
	excludeCodeBlocks: boolean;
	excludeNonVisibleLinkPortions: boolean;
	excludeFootnotes: boolean;
	momentDateFormat: string;
	debugMode: boolean;
	writeCountsToFile: boolean;
}

export const DEFAULT_SETTINGS: NovelWordCountSettings = {
	// FORMATTING
	useAdvancedFormatting: false,
	// NOTES
	countType: $CountType.Word,
	countConfig: {
		customSuffix: "w",
		$sessionCountType: $CountType.Word,
	},
	countType2: $CountType.None,
	countConfig2: {
		$sessionCountType: $CountType.Word,
	},
	countType3: $CountType.None,
	countConfig3: {
		$sessionCountType: $CountType.Word,
	},
	pipeSeparator: "|",
	abbreviateDescriptions: false,
	alignment: AlignmentType.Inline,
	// FOLDERS
	showSameCountsOnFolders: true,
	folderCountType: $CountType.Word,
	folderCountConfig: {
		customSuffix: "w",
		$sessionCountType: $CountType.Word,
	},
	folderCountType2: $CountType.None,
	folderCountConfig2: {
		$sessionCountType: $CountType.Word,
	},
	folderCountType3: $CountType.None,
	folderCountConfig3: {
		$sessionCountType: $CountType.Word,
	},
	folderPipeSeparator: "|",
	folderAbbreviateDescriptions: false,
	folderAlignment: AlignmentType.Inline,
	// ROOT
	showSameCountsOnRoot: true,
	rootCountType: $CountType.Word,
	rootCountConfig: {
		customSuffix: "w",
		$sessionCountType: $CountType.Word,
	},
	rootCountType2: $CountType.None,
	rootCountConfig2: {
		$sessionCountType: $CountType.Word,
	},
	rootCountType3: $CountType.None,
	rootCountConfig3: {
		$sessionCountType: $CountType.Word,
	},
	rootPipeSeparator: "|",
	rootAbbreviateDescriptions: false,
	// ADVANCED
	showAdvanced: false,
	labelOpacity: 0.75,
	wordsPerMinute: 265,
	charsPerMinute: 500,
	wordsPerPage: 300,
	charsPerPage: 1500,
	charsPerPageIncludesWhitespace: false,
	characterCountType: CharacterCountType.StringLength,
	pageCountType: PageCountType.ByWords,
	includeDirectories: "",
	excludeComments: false,
	excludeCodeBlocks: false,
	excludeNonVisibleLinkPortions: false,
	excludeFootnotes: false,
	momentDateFormat: "",
	debugMode: false,
	writeCountsToFile: false,
};

export type CountTypeConfiguration = Partial<{
	customSuffix: string;
	frontmatterKey: string;
	$sessionCountType: $SessionCountType;
}>;
