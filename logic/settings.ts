export enum $CountType {
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
	FrontmatterKey = "frontmatterKey",
	TrackSession = "tracksession",
}

export const COUNT_TYPES: $CountType[] = Object.values($CountType);

export type $SessionCountType = Extract<
	$CountType,
	| $CountType.Word
	| $CountType.Page
	| $CountType.PageDecimal
	| $CountType.Note
	| $CountType.Character
>;

export const SESSION_COUNT_TYPES: $SessionCountType[] = [
	$CountType.Word,
	$CountType.Page,
	$CountType.PageDecimal,
	$CountType.Note,
	$CountType.Character,
];

export type CountTypeConfiguration = Partial<{
	customSuffix: string;
	frontmatterKey: string;
	$sessionCountType: $SessionCountType;
}>;

export const COUNT_TYPE_DISPLAY_STRINGS: { [countType: string]: string } = {
	[$CountType.None]: "None",
	[$CountType.Word]: "Word Count",
	[$CountType.Page]: "Page Count",
	[$CountType.PageDecimal]: "Page Count (decimal)",
	[$CountType.ReadTime]: "Reading Time",
	[$CountType.PercentGoal]: "% of Word Goal",
	[$CountType.Note]: "Note Count",
	[$CountType.Character]: "Character Count",
	[$CountType.Link]: "Link Count",
	[$CountType.Embed]: "Embed Count",
	[$CountType.Alias]: "First Alias",
	[$CountType.Created]: "Created Date",
	[$CountType.Modified]: "Last Updated Date",
	[$CountType.FileSize]: "File Size",
	[$CountType.FrontmatterKey]: "Frontmatter Key",
	[$CountType.TrackSession]: "Track Session",
};

export const COUNT_TYPE_DESCRIPTIONS: { [countType: string]: string } = {
	[$CountType.None]: "Hidden.",
	[$CountType.Word]: "Total words.",
	[$CountType.Page]: "Total pages, rounded up.",
	[$CountType.PageDecimal]:
		"Total pages, precise to 2 digits after the decimal.",
	[$CountType.ReadTime]: "Estimated time to read the note.",
	[$CountType.PercentGoal]:
		"Set a word goal by adding the 'word-goal' property to a note.",
	[$CountType.Note]: "Total notes.",
	[$CountType.Character]:
		"Total characters (letters, symbols, numbers, and spaces).",
	[$CountType.Link]: "Total links to other notes.",
	[$CountType.Embed]: "Total embedded images, files, and notes.",
	[$CountType.Alias]: "The first alias property of each note.",
	[$CountType.Created]:
		"Creation date. (On folders: earliest creation date of any note.)",
	[$CountType.Modified]:
		"Date of last edit. (On folders: latest edit date of any note.)",
	[$CountType.FileSize]: "Total size on hard drive.",
	[$CountType.FrontmatterKey]: "Key in the frontmatter block.",
	[$CountType.TrackSession]:
		"Track progress since last Obsidian startup, plugin init, or reanalysis",
};

export const UNFORMATTABLE_COUNT_TYPES = [
	$CountType.None,
	$CountType.Alias,
	$CountType.FileSize,
	$CountType.ReadTime,
];

export const COUNT_TYPE_DEFAULT_SHORT_SUFFIXES: {
	[countType: string]: string;
} = {
	[$CountType.Word]: "w",
	[$CountType.Page]: "p",
	[$CountType.PageDecimal]: "p",
	[$CountType.PercentGoal]: "%",
	[$CountType.Note]: "n",
	[$CountType.Character]: "ch",
	[$CountType.Link]: "x",
	[$CountType.Embed]: "em",
	[$CountType.Created]: "/c",
	[$CountType.Modified]: "/u",
	[$CountType.FrontmatterKey]: "",
	[$CountType.TrackSession]: "/s"
};

export function getDescription(countType: $CountType): string {
	return `[${COUNT_TYPE_DISPLAY_STRINGS[countType]}] ${COUNT_TYPE_DESCRIPTIONS[countType]}`;
}

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

export enum PageCountType {
	ByWords = "ByWords",
	ByChars = "ByChars",
}

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
	debugMode: boolean;
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
	debugMode: false,
};
