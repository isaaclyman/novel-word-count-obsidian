export interface MarkdownParseResult {
	charCount: number;
	nonWhitespaceCharCount: number;
	spaceDelimitedWordCount: number;
	cjkWordCount: number;
}

const cjkRegex =
	/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const allSymbolsRegex = /[\p{S}\p{P}]/gu;

export function countMarkdown(content: string): MarkdownParseResult {
	content = removeNonCountedContent(content);

	let wordSequences = content
		.replace(cjkRegex, " ")
		.replace(allSymbolsRegex, "")
		.trim()
		.split(/\s+/);
	
  // There are more idiomatic ways to handle an empty string, but this is the fastest.
  if (wordSequences.length === 1 && wordSequences[0] === '') {
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

function countNonWhitespaceCharacters(content: string): number {
	return content.replace(/\s/g, "").length;
}

function removeNonCountedContent(content: string): string {
	return content
		.replace(
			// Remove comments
			/(%%.+%%|<!--.+-->)/gims,
			""
		)
		.replace(
			// Remove code blocks
			/```.+```/gims,
			""
		);
}
