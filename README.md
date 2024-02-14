# Novel Word Count for Obsidian

![A screenshot showing slightly transparent word counts next to every document, folder, and vault in the File Explorer pane.](readme-screenshot-2.png)

This plugin displays statistics of your choice next to every file, folder, and vault in the File Explorer pane. It updates in real time as you write.

### Settings

**Data to show.** You can choose up to three data types to display side by side. Choose from the following:

| Data Type | Description | Notes |
| --------- | ----------- | ----- |
| **Word count** | Total words. | By default, a "word" is any sequence of non-whitespace characters. To change this, see Advanced > Word Count Method. |
| **Page count** | Total pages, rounded up. | By default, a page is 300 words. To change this, see Advanced > Page Count Method. |
| **Page count (decimal)** | Total pages, precise to 2 digits after the decimal. | Any settings that would apply to Page Count also apply to Page Count (decimal). |
| **Reading Time** | Estimated time to read each note. | By default, this is calculated at 265 words per minute (European languages) or 500 characters per minute (CJK). To change this, see Advanced > Words per minute/Characters per minute. |
| **% of Word Goal** | Percent of word goal for each note. | See [*Setting goals*](#setting-goals) below. |
| **Character count** | Total characters (letters, symbols, and numbers). | By default, whitespace characters are included. To change this, see Advanced > Character Count Method. |
| **Note count** | Total notes. | Many people prefer to show this information on folders only; to do so, untoggle "Show same data on folders" and configure it as a data type there. |
| **Link count** | Total [links](https://help.obsidian.md/Getting+started/Link+notes) to other notes. | Only internal links are counted; Obsidian doesn't count links to web pages. |
| **Embed count** | Total [embedded](https://help.obsidian.md/Linking+notes+and+files/Embedding+files) images, files, and notes. | |
| **First alias** | The first [alias](https://help.obsidian.md/Linking+notes+and+files/Aliases) of each note. | If a note has no alias, nothing is shown. Since folders don't have aliases, they also show nothing. |
| **Created date** | The date the note was created. | On a folder, this shows the earliest creation date of all notes in the folder. |
| **Last updated date** | The date the note was last updated. | On a folder, this shows the latest edit date of all notes in the folder. |
| **File size** | Total size on your hard drive. | |

**Abbreviate descriptions.** Enable to show shortened counts:

| Full description | Abbreviated |
| ---------------- | ----------- |
| 3,250 words | 3,250w |
| 30 pages | 30p |
| 45% of 2,000 | 45% |
| 23,800 characters | 23,800ch |
| 12 notes | 12n |
| 25s read | 25s |
| 5m read | 5m |
| 2h5m read | 2h5m |
| 3 links | 3x |
| 5 embeds | 5em |
| alias: july +3 | july |
| Created 1/22/2022 | 1/22/2022/c |
| Updated 1/22/2022 | 1/22/2022/u |
| 13.39 KB | 13.39kb |

*NOTE:* You can set your own suffixes (or hide suffixes entirely) for most count types by enabling the "Use advanced formatting" toggle.

**Alignment.** Choose where data is displayed relative to file/folder names: Inline, Right-aligned, or Below. All alignments work well with vanilla Obsidian, but Inline has the greatest compatibility with custom themes and plugins.

**Show same data on folders.** By default, the same data types are shown on notes and folders. You can toggle this setting off to choose different data types to show on folders only.

**Include file/folder names.** Only counts the text of notes with paths matching the indicated terms. This setting is case-sensitive and comma-separated. Any term starting with `!` will be _excluded_ instead of included. At least one file must be matched or the setting will be ignored. _For example:_ If you set this to `Included, CountMe`, it will match folders called `Included`, `Included Folder`, `CountMe Please`, `My Included CountMe`, etc., and notes called `Included.md`, `CountMe Note.md`, etc., but _not_ folders or notes called `included` or `countme` or `somethingelse`. If there are no folders or notes in your vault with the terms `Included` or `CountMe`, the setting will be ignored and all notes will be counted. If you set this to `!Excluded, CountMe`, it will match folders and files with the term `CountMe` _unless_ they also contain the term `Excluded`.

**Exclude comments.** Excludes any content surrounded by `%%` [comment marks](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#Comments) `%%` or `<!--` HTML comment tags `-->` from character count, word count, and page count. This may slow down performance on very large notes or vaults.

**Exclude code blocks.** Excludes any content surrounded by `` ``` `` backticks from character count, word count, and page count. Includes DataView snippets. This may slow down performance on very large notes or vaults.

**Exclude non-visible portions of links.** Excludes (from all counts) any portions of links you wouldn't see in Reading View. For external links (e.g. `[see example](https://uri)`), this excludes the URI. For internal links that have an alias (e.g. `[[note name|alias]]`), this excludes the note name.

**Character count method.** Choose whether to count all characters or exclude whitespace (spaces and line breaks).

**Word count method.** _This setting has been removed._ In the latest version of the plugin, space-delimited and CJK counts are combined. Notes in any language should be counted correctly, including mixed-language notes.

**Page count method.** Choose whether pages are counted by number of words (default: 300) or number of characters (default: 1500). You can change the number of words/characters used.

**Words per minute/CJK characters per minute.** Sets the number of words (default: 265) and CJK characters (default: 500) per minute. Reading time is calculated as \[word count divided by words per minute\] plus \[CJK character count divided by characters per minute\].

**Words per page/Characters per page.** Sets the number of words or characters per page, depending on the selected _Page count method._

**Reanalyze all documents.** Triggers a recount of all documents in the vault. Useful if you've made changes outside of Obsidian. (A hotkey binding is available for this command.)

**Debug mode.** Enables debugging output to the developer console, which may be useful if you need to report an issue.

### Setting goals

To set a word goal for a note, add the `word-goal` property:

<img src="property-wordgoal.png" alt="Obsidian properties with a single property 'word-goal' set to 100" height="150px">

Comma separators are not allowed—the value must be numbers only.

On folders, the total number of words _for all notes with a goal_ is compared to the sum of all word goals.

### Excluding notes

To exclude a note from all counts _except_ note count, created date, last updated date, and file size, add the `exclude-from-word-count` [tag](https://help.obsidian.md/Editing+and+formatting/Tags) to the [properties](https://help.obsidian.md/Editing+and+formatting/Properties).

<img src="property-exclude.png" alt="Obsidian properties with a single property 'tags' containing one chip with text 'exclude-from-word-count'" height="150px">

(The plugin will recognize the tag in any case and with or without hyphens/underscores, so you can follow your preferred tagging syntax, e.g. `ExcludeFromWordCount`, `Exclude_from_word_count`, and so on.)

Alternately, you can set the `wordcount` property to `false`. This property must always be lowercase and may not contain hyphens or underscores.

For another way to include/exclude certain notes, see the "Include file/folder names" setting description.

<img src="property-wordcount.png" alt="Obsidian properties with a single property 'wordcount' set to an empty checkbox" height="150px">

### Safety

Novel Word Count is fully compatible with Obsidian 1.4+.

This plugin treats your vault as read-only. It never modifies, deletes, or renames any file or folder. It uses cached reads of all files for better performance.

Obsidian's API does not provide contractual access to the File Explorer pane, so this plugin uses duck typing to find it. This is technically undocumented, so there is a possibility that major updates of Obsidian will temporarily cause errors. If and when that happens, this plugin is designed to fail gracefully. In this unlikely scenario you may wish to disable the plugin until it can be updated.

This plugin's effect on the File Explorer DOM is extremely minimal, consisting of a custom HTML attribute and a few CSS rules. Style modifications are only active when the plugin is turned on.

Novel Word Count does not transmit any data over the Internet. All data is stored locally.

### Installing the plugin

Search "novel word count" in the community plugin browser, or use [this link](https://obsidian.md/plugins?id=novel-word-count).

### Shout-outs

- For an expanded version of Obsidian's built-in Word Count feature, which shows data for the current note in the Editor pane, check out [Better Word Count](https://obsidian.md/plugins?id=better-word-count) by [@lukeleppan](https://github.com/lukeleppan/).
- For more features and improved graphic design around word goals, check out [Writing Goals](https://obsidian.md/plugins?id=writing-goals) by [@lynchjames](https://github.com/lynchjames).

## For Developers

### Development setup

- Clone this repo.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.
- `npm run dev-style` to start stylesheet compilation in watch mode.

### Creating a new release

- Run `npm run build` to make sure main.js and styles.css are up to date.
- Commit changes.
- Run `npm version {major|minor|patch}` to update the manifest and package.json.
- Push commits to the remote.
- Create a new release and tag in GitHub, both named after the version number e.g. `2.4.1` without a "v". Attach the files main.js, styles.css, and manifest.json.

### Running the plugin locally

Visit the [Releases page](https://github.com/isaaclyman/novel-word-count-obsidian/releases). Download `main.js`, `styles.css`, and `manifest.json` to your vault at `VaultFolder/.obsidian/plugins/novel-word-count/`.