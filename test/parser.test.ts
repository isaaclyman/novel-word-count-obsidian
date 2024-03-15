import { countMarkdown as countMarkdownOriginal } from "logic/parser";

const countMarkdown = (content: string) =>
	countMarkdownOriginal(content, {
		excludeCodeBlocks: true,
		excludeComments: true,
		excludeNonVisibleLinkPortions: true,
		excludeFootnotes: true,
	});

describe("parseMarkdown", () => {
	/*
    NORMAL CONTENT
  */

	describe("normal content", () => {
		it("parses an empty file", () => {
			const result = countMarkdown("");

			expect(result.charCount).toBe(0);
			expect(result.nonWhitespaceCharCount).toBe(0);
			expect(result.spaceDelimitedWordCount).toBe(0);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with one space", () => {
			const result = countMarkdown(" ");

			expect(result.charCount).toBe(1);
			expect(result.nonWhitespaceCharCount).toBe(0);
			expect(result.spaceDelimitedWordCount).toBe(0);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with one Latin character", () => {
			const result = countMarkdown("a");

			expect(result.charCount).toBe(1);
			expect(result.nonWhitespaceCharCount).toBe(1);
			expect(result.spaceDelimitedWordCount).toBe(1);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with one number", () => {
			const result = countMarkdown("1");

			expect(result.charCount).toBe(1);
			expect(result.nonWhitespaceCharCount).toBe(1);
			expect(result.spaceDelimitedWordCount).toBe(1);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with one Chinese character", () => {
			const result = countMarkdown("小");

			expect(result.charCount).toBe(1);
			expect(result.nonWhitespaceCharCount).toBe(1);
			expect(result.spaceDelimitedWordCount).toBe(0);
			expect(result.cjkWordCount).toBe(1);
		});

		it("parses a file with one symbol", () => {
			const result = countMarkdown(":");

			expect(result.charCount).toBe(1);
			expect(result.nonWhitespaceCharCount).toBe(1);
			expect(result.spaceDelimitedWordCount).toBe(0);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with English content", () => {
			const content = `
This is my first ?? note 10.

It has a small amount of content.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(64);
			expect(result.nonWhitespaceCharCount).toBe(49);
			expect(result.spaceDelimitedWordCount).toBe(13);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with CJK content", () => {
			const content = `
施拡団抜転健作社図民靖前壌碁社操。罰手活指包話200川最掲録50覚特万奈。

米電著技会復写聞CEO計大中終断出図幌阪戒。動心春多提実障識放水問明表部的。`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(78);
			expect(result.nonWhitespaceCharCount).toBe(75);
			expect(result.spaceDelimitedWordCount).toBe(3);
			expect(result.cjkWordCount).toBe(63);
		});

		it("parses a file with mixed-language content", () => {
			const content = `
This is my first note.

施拡団抜転健作社図民靖前壌碁社操。罰手活指包話川最掲録覚特万奈。

It has mixed-language content.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(89);
			expect(result.nonWhitespaceCharCount).toBe(77);
			expect(result.spaceDelimitedWordCount).toBe(9);
			expect(result.cjkWordCount).toBe(30);
		});
	});

	/*
    MARKDOWN COMMENTS
  */

	describe("markdown comments", () => {
		it("parses a file with one well-formed inline comment", () => {
			const content = `This is a note with an %%inline comment%% that shouldn't be counted.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(50);
			expect(result.nonWhitespaceCharCount).toBe(40);
			expect(result.spaceDelimitedWordCount).toBe(10);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with one well-formed block comment", () => {
			const content = `
This is a note with a comment.

%%
Here's the comment
don't count me
%%

The comment is over.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(55);
			expect(result.nonWhitespaceCharCount).toBe(41);
			expect(result.spaceDelimitedWordCount).toBe(11);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file that's entirely a comment", () => {
			const content = `%%
I'm just a comment
don't count me
%%`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(0);
			expect(result.nonWhitespaceCharCount).toBe(0);
			expect(result.spaceDelimitedWordCount).toBe(0);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with lone percent signs", () => {
			const content = `23% of the time, it's 80% effective.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(36);
			expect(result.nonWhitespaceCharCount).toBe(30);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with two side-by-side comments", () => {
			const content = `
This is a note with a comment.

%%
Here's the comment
don't count me
%%%%
Here's another comment
don't count me either
%%

The comment is over.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(55);
			expect(result.nonWhitespaceCharCount).toBe(41);
			expect(result.spaceDelimitedWordCount).toBe(11);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with two separated comments", () => {
			const content = `
This is a note with a comment.

%%
Here's the comment
don't count me
%%

word

%%
Here's another comment
don't count me either
%%

The comment is over.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(63);
			expect(result.nonWhitespaceCharCount).toBe(45);
			expect(result.spaceDelimitedWordCount).toBe(12);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with an unterminated comment", () => {
			const content = `
This is a note with a comment.

%%
Here's the comment
without terminating marks`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(80);
			expect(result.nonWhitespaceCharCount).toBe(65);
			expect(result.spaceDelimitedWordCount).toBe(13);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with a starting comment indicator at EOF", () => {
			const content = `
This is a note with a comment.

%%`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(35);
			expect(result.nonWhitespaceCharCount).toBe(26);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with a closing comment indicator at EOF", () => {
			const content = `
This is a note with a comment.

%%
Here's the comment
don't count me
%%`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(33);
			expect(result.nonWhitespaceCharCount).toBe(24);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
		});
	});

	/*
    HTML COMMENTS
  */

	describe("HTML comments", () => {
		it("parses a file with one well-formed inline comment", () => {
			const content = `This is a note with an <!--inline comment--> that shouldn't be counted.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(50);
			expect(result.nonWhitespaceCharCount).toBe(40);
			expect(result.spaceDelimitedWordCount).toBe(10);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with one well-formed block comment", () => {
			const content = `
This is a note with a comment.

<!--
Here's the comment
don't count me
-->

The comment is over.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(55);
			expect(result.nonWhitespaceCharCount).toBe(41);
			expect(result.spaceDelimitedWordCount).toBe(11);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file that's entirely a comment", () => {
			const content = `<!--
I'm just a comment
don't count me
-->`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(0);
			expect(result.nonWhitespaceCharCount).toBe(0);
			expect(result.spaceDelimitedWordCount).toBe(0);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with two side-by-side comments", () => {
			const content = `
This is a note with a comment.

<!--
Here's the comment
don't count me
--><!--
Here's another comment
don't count me either
-->

The comment is over.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(55);
			expect(result.nonWhitespaceCharCount).toBe(41);
			expect(result.spaceDelimitedWordCount).toBe(11);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with two separated comments", () => {
			const content = `
This is a note with a comment.

<!--
Here's the comment
don't count me
-->

word

<!--
Here's another comment
don't count me either
-->

The comment is over.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(63);
			expect(result.nonWhitespaceCharCount).toBe(45);
			expect(result.spaceDelimitedWordCount).toBe(12);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with an unterminated comment", () => {
			const content = `
This is a note with a comment.

<!--
Here's the comment
without terminating marks`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(82);
			expect(result.nonWhitespaceCharCount).toBe(67);
			expect(result.spaceDelimitedWordCount).toBe(13);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with a starting comment indicator at EOF", () => {
			const content = `
This is a note with a comment.

<!--`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(37);
			expect(result.nonWhitespaceCharCount).toBe(28);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with a closing comment indicator at EOF", () => {
			const content = `
This is a note with a comment.

<!--
Here's the comment
don't count me
-->`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(33);
			expect(result.nonWhitespaceCharCount).toBe(24);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
		});
	});

	describe("code blocks", () => {
		it("parses a file with inline code", () => {
			const content = `This is a note with \`inline code\` that should be counted.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(57);
			expect(result.nonWhitespaceCharCount).toBe(47);
			expect(result.spaceDelimitedWordCount).toBe(11);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with one well-formed code block", () => {
			const content = `
This is a note with a code block.

\`\`\`dataview
select * from blah blah blah
\`\`\`

The block is over.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(56);
			expect(result.nonWhitespaceCharCount).toBe(41);
			expect(result.spaceDelimitedWordCount).toBe(12);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file that's entirely a code block", () => {
			const content = `\`\`\`dataview
select * from blah blah blah
\`\`\``;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(0);
			expect(result.nonWhitespaceCharCount).toBe(0);
			expect(result.spaceDelimitedWordCount).toBe(0);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with two side-by-side code blocks", () => {
			const content = `
This is a note with a code block.

\`\`\`dataview
select * from blah blah blah
\`\`\`\`\`\`
select * from do re mi
\`\`\`

The block is over.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(56);
			expect(result.nonWhitespaceCharCount).toBe(41);
			expect(result.spaceDelimitedWordCount).toBe(12);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with two separated code blocks", () => {
			const content = `
This is a note with a code block.

\`\`\`dataview
select * from blah blah blah
\`\`\`

word

\`\`\`
select * from do re mi
\`\`\`

The block is over.`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(64);
			expect(result.nonWhitespaceCharCount).toBe(45);
			expect(result.spaceDelimitedWordCount).toBe(13);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with an unterminated code block", () => {
			const content = `
This is a note with a code block.

\`\`\`dataview
select * from blah blah blah`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(76);
			expect(result.nonWhitespaceCharCount).toBe(60);
			expect(result.spaceDelimitedWordCount).toBe(14);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with a starting code block indicator at EOF", () => {
			const content = `
This is a note with a code block.

\`\`\``;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(39);
			expect(result.nonWhitespaceCharCount).toBe(29);
			expect(result.spaceDelimitedWordCount).toBe(8);
			expect(result.cjkWordCount).toBe(0);
		});

		it("parses a file with a closing code block indicator at EOF", () => {
			const content = `
This is a note with a code block.

\`\`\`dataview
select * from blah blah blah
\`\`\``;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(36);
			expect(result.nonWhitespaceCharCount).toBe(26);
			expect(result.spaceDelimitedWordCount).toBe(8);
			expect(result.cjkWordCount).toBe(0);
		});
	});

	/*
    LINKS (INTERNAL + EXTERNAL)
  */

	describe("links", () => {
		it("ignores the link URI", () => {
			const content = `Here's a [ link ](https://example.com)`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(15);
			expect(result.nonWhitespaceCharCount).toBe(11);
			expect(result.spaceDelimitedWordCount).toBe(3);
			expect(result.cjkWordCount).toBe(0);
		});

		it("counts only the link alias", () => {
			const content = `Here's an [[another note somewhere|internal link]]`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(23);
			expect(result.nonWhitespaceCharCount).toBe(20);
			expect(result.spaceDelimitedWordCount).toBe(4);
			expect(result.cjkWordCount).toBe(0);
		});

		it("handles multiple links in a line", () => {
			const content = `Have a [link](https://example.com) or [two](https://example.com)`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(18);
			expect(result.nonWhitespaceCharCount).toBe(14);
			expect(result.spaceDelimitedWordCount).toBe(5);
			expect(result.cjkWordCount).toBe(0);
		});

		it("handles links inside of parentheses", () => {
			const content = `Have a link (or [two](https://example.com) or three)`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(29);
			expect(result.nonWhitespaceCharCount).toBe(23);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
		});

		it("handles an empty link followed by a later close paren", () => {
			const content = `Have a ([link]() or two)`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(20);
			expect(result.nonWhitespaceCharCount).toBe(16);
			expect(result.spaceDelimitedWordCount).toBe(5);
			expect(result.cjkWordCount).toBe(0);
		});

		it("handles an empty internal link followed later by a pipe and close brackets", () => {
			const content = `Have a [[]] or | operator or close brackets ]]`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(42);
			expect(result.nonWhitespaceCharCount).toBe(33);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
		});

		it("handles a line with every kind of link", () => {
			const content = `Start with [[]] then [[internal]] then [external](https://example.com) then [[]]`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(45);
			expect(result.nonWhitespaceCharCount).toBe(37);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
		});
	});

	describe("footnotes", () => {
		it("ignores numeric footnotes", () => {
			const content = `
Here's a footnote mark[^7]!

[^7]: This is the footnote itself
			`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(30);
			expect(result.nonWhitespaceCharCount).toBe(20);
			expect(result.spaceDelimitedWordCount).toBe(4);
			expect(result.cjkWordCount).toBe(0);
		});

		it("ignores string footnotes", () => {
			const content = `
Here's a footnote mark with a string[^some-string]!

[^some-string]: This is the footnote itself
			`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(44);
			expect(result.nonWhitespaceCharCount).toBe(31);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
		});

		it("ignores multiple footnotes", () => {
			const content = `
Here's a footnote mark[^7]!
Here's another *footnote mark[^8]*, and some content after.
Here's a footnote mark with a string[^some-string]!

[^7]: This is the footnote
[^8]: This is the other footnote
[^some-string]: This is the string footnote
			`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(126);
			expect(result.nonWhitespaceCharCount).toBe(99);
			expect(result.spaceDelimitedWordCount).toBe(19);
			expect(result.cjkWordCount).toBe(0);
		});
	});
});
