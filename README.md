## Novel word count plugin

![A screenshot showing slightly transparent word counts next to every document, folder, and vault in the File Explorer pane.](readme-screenshot-1.png)

This plugin displays statistics of your choice next to every file, folder, and vault in the File Explorer pane. It updates in real time as you write.

### Settings

**Data to show.** Choose word count, page count, character count, note count, created date, or last updated date. You can choose up to three data types to display side by side.

**Abbreviate descriptions.** Enable to show shortened counts:

- "3,250 words" => "3,250w"
- "30 pages" => "30p"
- "23,800 characters" => "23,800ch"
- "12 notes" => "12n"
- "Created 1/22/2022" => "1/22/2022/c"
- "Updated 1/22/2022" => "1/22/2022/u"

**Alignment.** Choose where data is displayed relative to file/folder names: Inline, Right-aligned, or Below. All alignments work well with vanilla Obsidian, but Inline has the greatest compatibility with custom themes and plugins.

**Page count method.** Choose whether pages are counted by number of words (default: 300) or number of characters (default: 1500). You can change the number of words/characters used.

**Reanalyze all documents.** Triggers a recount of all documents in the vault. Useful if you've made changes outside of Obsidian. (A hotkey binding is available for this command.)

**Debug mode.** Enables debugging output to the developer console, which may be useful if you need to report an issue.

### Safety

Novel Word Count is fully compatible with Obsidian 1.0.

This plugin treats your vault as read-only. It never modifies, deletes, or renames any file or folder. It uses cached reads of all files for better performance.

Obsidian's API does not provide contractual access to the File Explorer pane, so this plugin uses duck typing to find it. This is technically undocumented, so future updates of Obsidian could break functionality. If and when that happens, this plugin is designed to fail gracefully. Any cached word counts will still appear in the File Explorer but they won't update when you write; in this unlikely scenario you may wish to disable the plugin until it can be updated.

This plugin's effect on the File Explorer DOM is extremely minimal. It adds a `[data-novel-word-count-plugin]` attribute to each node (vault, folder, or file), then defines CSS `::after` pseudo-elements that display the contents of the attribute. For Inline alignment (the default), the existing elements are not modified in any other way and the structure is not changed. For Right-aligned and Below alignments, file/folder styles are modified as well. These modifications are only active when the plugin is turned on.

### Development

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

### Installing the plugin automatically

Search "novel word count" in the community plugin browser, or use [this link](https://obsidian.md/plugins?id=novel-word-count).

### Installing the plugin manually

Visit the [Releases page](https://github.com/isaaclyman/novel-word-count-obsidian/releases). Download `main.js`, `styles.css`, and `manifest.json` to your vault at `VaultFolder/.obsidian/plugins/novel-word-count/`.