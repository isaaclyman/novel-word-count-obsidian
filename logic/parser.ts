export interface MarkdownParseConfig {
	excludeComments: boolean;
	excludeCodeBlocks: boolean;
}

export interface MarkdownParseResult {
	charCount: number;
	nonWhitespaceCharCount: number;
	spaceDelimitedWordCount: number;
	cjkWordCount: number;
}

const cjkRegex =
	/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const allSymbolsRegex = /[\p{S}\p{P}]/gu;

export function countMarkdown(
	content: string,
	config: MarkdownParseConfig
): MarkdownParseResult {
	content = removeNonCountedContent(content, config);

	let wordSequences = content
		.replace(cjkRegex, " ")
		.replace(allSymbolsRegex, "")
		.trim()
		.split(/\s+/);

	// There are more idiomatic ways to handle an empty string, but this is the fastest.
	if (wordSequences.length === 1 && wordSequences[0] === "") {
		wordSequences = [];
	}

	const result: MarkdownParseResult = {
		charCount: content.length,
		nonWhitespaceCharCount: countNonWhitespaceCharacters(content),
		spaceDelimitedWordCount: wordSequences.length,
		cjkWordCount: (content.match(cjkRegex) || []).length,
	};

	return result;
}

const whitespaceRegex = /\s/g;
export function countNonWhitespaceCharacters(content: string): number {
	return content.replace(whitespaceRegex, "").length;
}

export function removeNonCountedContent(
	content: string,
	config: MarkdownParseConfig
): string {
	if (config.excludeCodeBlocks) {
		content = content.replace(/(```.+?```)/gims, "");
	}

	if (config.excludeComments) {
		content = content.replace(/(%%.+?%%|<!--.+?-->)/gims, "");
	}

	return content;
}
