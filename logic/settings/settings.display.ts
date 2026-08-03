import { $CountType } from "./settings.enum";

export const COUNT_TYPE_DISPLAY_STRINGS: { [countType: string]: string } = {
	[$CountType.None]: "None",
	[$CountType.Word]: "Word Count",
	[$CountType.Page]: "Page Count",
	[$CountType.PageDecimal]: "Page Count (decimal)",
	[$CountType.Linebreak]: "Line Break Count",
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
	[$CountType.Linebreak]: "Newlines (¶), including empty lines.",
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
		"Track progress since last Obsidian startup, plugin init, settings change, or recount",
};

export function getDescription(countType: $CountType): string {
	return `[${COUNT_TYPE_DISPLAY_STRINGS[countType]}] ${COUNT_TYPE_DESCRIPTIONS[countType]}`;
}

export const COUNT_TYPE_DEFAULT_SHORT_SUFFIXES: {
	[countType: string]: string;
} = {
	[$CountType.Word]: "w",
	[$CountType.Page]: "p",
	[$CountType.PageDecimal]: "p",
	[$CountType.Linebreak]: "¶",
	[$CountType.PercentGoal]: "%",
	[$CountType.Note]: "n",
	[$CountType.Character]: "ch",
	[$CountType.Link]: "x",
	[$CountType.Embed]: "em",
	[$CountType.Created]: "/c",
	[$CountType.Modified]: "/u",
	[$CountType.FrontmatterKey]: "",
	[$CountType.TrackSession]: "/s",
};
