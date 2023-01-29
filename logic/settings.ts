
export enum CountType {
	None = "none",
	Word = "word",
	Page = "page",
	PageDecimal = "pagedecimal",
	Note = "note",
	NoteFolderOnly = "notefolderonly",
	Character = "character",
	Created = "created",
	Modified = "modified",
}

export const countTypeDisplayStrings: { [countType: string]: string } = {
	[CountType.None]: "None",
	[CountType.Word]: "Word Count",
	[CountType.Page]: "Page Count",
	[CountType.PageDecimal]: "Page Count (decimal)",
	[CountType.Note]: "Note Count",
	[CountType.NoteFolderOnly]: "Note Count (folders only)",
	[CountType.Character]: "Character Count",
	[CountType.Created]: "Created Date",
	[CountType.Modified]: "Last Updated Date",
};

export const countTypes = [
	CountType.None,
	CountType.Word,
	CountType.Page,
	CountType.PageDecimal,
	CountType.Note,
	CountType.NoteFolderOnly,
	CountType.Character,
	CountType.Created,
	CountType.Modified,
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

export enum PageCountType {
  ByWords = 'ByWords',
  ByChars = 'ByChars'
}

export interface NovelWordCountSettings {
	countType: CountType;
	countType2: CountType;
	countType3: CountType;
	abbreviateDescriptions: boolean;
	alignment: AlignmentType;
	debugMode: boolean;
	wordsPerPage: number;
  charsPerPage: number;
  pageCountType: PageCountType;
}

export const DEFAULT_SETTINGS: NovelWordCountSettings = {
	countType: CountType.Word,
	countType2: CountType.None,
	countType3: CountType.None,
	abbreviateDescriptions: false,
	alignment: AlignmentType.Inline,
	debugMode: false,
	wordsPerPage: 300,
  charsPerPage: 1500,
  pageCountType: PageCountType.ByWords
};
