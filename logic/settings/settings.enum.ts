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

export enum $CountType {
	None = "none",
	Word = "word",
	Page = "page",
	PageDecimal = "pagedecimal",
	Linebreak = "linebreak",
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
	| $CountType.Linebreak
	| $CountType.Note
	| $CountType.Character
>;

export const SESSION_COUNT_TYPES: $SessionCountType[] = [
	$CountType.Word,
	$CountType.Page,
	$CountType.PageDecimal,
	$CountType.Linebreak,
	$CountType.Note,
	$CountType.Character,
];

export const UNFORMATTABLE_COUNT_TYPES = [
	$CountType.None,
	$CountType.Alias,
	$CountType.FileSize,
	$CountType.ReadTime,
];
