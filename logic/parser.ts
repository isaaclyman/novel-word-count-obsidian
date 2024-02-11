export interface MarkdownParseResult {
	charCount: number;
	nonWhitespaceCharCount: number;
	spaceDelimitedWordCount: number;
	cjkWordCount: number;
}

const whitespaceRx = /\s/;
const wordRegex = /[a-zA-Z0-9]/;
const cjkRegex =
	/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u;

export function countMarkdown(content: string): MarkdownParseResult {
	const result: MarkdownParseResult = {
		charCount: 0,
		nonWhitespaceCharCount: 0,
		spaceDelimitedWordCount: 0,
		cjkWordCount: 0,
	};

	let currentWordIsAllSymbols = true;
	let cursor = 0;

	while (cursor < content.length) {
		let char = content[cursor];

		/*
      LOOKAHEAD: SKIP BLOCK COMMENTS
    */

		if (
			char === "%" &&
			cursor + 1 < content.length &&
			content[cursor + 1] === "%"
		) {
			cursor += 2;

			while (cursor < content.length) {
				char = content[cursor];

				if (
					char === "%" &&
					cursor + 1 < content.length &&
					content[cursor + 1] === "%"
				) {
					cursor += 2;
					char = content[cursor];
					break;
				}

				cursor++;
			}

			continue;
		}

		/*
      LOOKAHEAD: SKIP CODE BLOCKS
    */

		if (
			char === "`" &&
			cursor + 2 < content.length &&
			content[cursor + 1] === "`" &&
			content[cursor + 2] === "`"
		) {
			cursor += 3;

			while (cursor < content.length) {
				char = content[cursor];

				if (
					char === "`" &&
					cursor + 2 < content.length &&
					content[cursor + 1] === "`" &&
					content[cursor + 2] === "`"
				) {
					cursor += 3;
					char = content[cursor];
					break;
				}

				cursor++;
			}

			continue;
		}

		/*
      COUNT WORDS AND CHARS
    */

		result.charCount++;

		if (whitespaceRx.test(char)) {
			// Multiple whitespace doesn't increment anything.
			if (cursor - 1 >= 0 && whitespaceRx.test(content[cursor - 1])) {
				cursor++;
				continue;
			}

			// Any words with letters/numbers increment the space-delimited
			//  word count.
			if (!currentWordIsAllSymbols) {
				result.spaceDelimitedWordCount++;
			}

			// Always begin with the assumption that the word is entirely symbols.
			currentWordIsAllSymbols = true;
		} else {
			result.nonWhitespaceCharCount++;
		}

		if (cjkRegex.test(char)) {
			// Every CJK char encountered increments the CJK word count.
			result.cjkWordCount++;

			// Also, each CJK char is a word boundary.
			if (!currentWordIsAllSymbols) {
				result.spaceDelimitedWordCount++;
			}

			currentWordIsAllSymbols = true;
		}

		if (wordRegex.test(char)) {
			// Any Latin letters or Arabic numerals make the word count as
			//  space-delimited.
			currentWordIsAllSymbols = false;
		}

		cursor++;
	}

	// Treat EOF like a whitespace character
	if (
		cursor - 1 >= 0 &&
		!whitespaceRx.test(content[cursor - 1]) &&
		!currentWordIsAllSymbols
	) {
		result.spaceDelimitedWordCount++;
	}

	return result;
}
