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
	[CountType.Link]: "Total outbound links.",
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
