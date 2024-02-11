import { countMarkdown } from "logic/parser";

describe("parseMarkdown", () => {
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

	describe("comments", () => {
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

		it("parses a file with an unterminated comment", () => {
			const content = `
This is a note with a comment.

%%
Here's the comment
without terminating marks`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(33);
			expect(result.nonWhitespaceCharCount).toBe(24);
			expect(result.spaceDelimitedWordCount).toBe(7);
			expect(result.cjkWordCount).toBe(0);
    });

    it("parses a file with a starting comment indicator at EOF", () => {
			const content = `
This is a note with a comment.

%%`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(33);
			expect(result.nonWhitespaceCharCount).toBe(24);
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

		it("parses a file with an unterminated code block", () => {
			const content = `
This is a note with a code block.

\`\`\`dataview
select * from blah blah blah`;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(36);
			expect(result.nonWhitespaceCharCount).toBe(26);
			expect(result.spaceDelimitedWordCount).toBe(8);
			expect(result.cjkWordCount).toBe(0);
    });

    it("parses a file with a starting code block indicator at EOF", () => {
			const content = `
This is a note with a code block.

\`\`\``;

			const result = countMarkdown(content);

			expect(result.charCount).toBe(36);
			expect(result.nonWhitespaceCharCount).toBe(26);
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
});
