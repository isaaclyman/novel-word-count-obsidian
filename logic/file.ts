import type NovelWordCountPlugin from "main";
import {
	App,
	CachedMetadata,
	TAbstractFile,
	TFile,
	TFolder,
	Vault,
	getAllTags,
	parseFrontMatterAliases,
} from "obsidian";
import { DebugHelper } from "./debug";
import {
	NovelWordCountSettings,
	PageCountType,
	WordCountType,
} from "./settings";
import { CancellationToken } from "./cancellation";

export interface CountData {
	isCountable: boolean;
	isDirectory: boolean;
	noteCount: number;
	pageCount: number;
	wordCount: number;
	wordCountTowardGoal: number;
	wordGoal: number | null;
	characterCount: number;
	nonWhitespaceCharacterCount: number;
	linkCount: number;
	embedCount: number;
	aliases: string[] | null;
	sizeInBytes: number;
	createdDate: number;
	modifiedDate: number;
}

export type CountsByFile = {
	[path: string]: CountData;
};

export class FileHelper {
	private debugHelper = new DebugHelper();
	private get settings(): NovelWordCountSettings {
		return this.plugin.settings;
	}
	private get vault(): Vault {
		return this.app.vault;
	}

	constructor(private app: App, private plugin: NovelWordCountPlugin) {}

	public async getAllFileCounts(
		cancellationToken: CancellationToken
	): Promise<CountsByFile> {
		const debugEnd = this.debugHelper.debugStart("getAllFileCounts");

		const files = this.vault.getFiles();
		const counts: CountsByFile = {};

		for (const file of files) {
			if (cancellationToken.isCancelled) {
				break;
			}

			this.setCounts(counts, file, this.settings.wordCountType);
		}

		debugEnd();
		return counts;
	}

	public getCachedDataForPath(counts: CountsByFile, path: string): CountData {
		if (counts.hasOwnProperty(path)) {
			return counts[path];
		}

		const childPaths = this.getChildPaths(counts, path);

		const directoryDefault: CountData = {
			isCountable: false,
			isDirectory: true,
			noteCount: 0,
			wordCount: 0,
			wordCountTowardGoal: 0,
			wordGoal: 0,
			pageCount: 0,
			characterCount: 0,
			nonWhitespaceCharacterCount: 0,
			linkCount: 0,
			embedCount: 0,
			aliases: null,
			createdDate: 0,
			modifiedDate: 0,
			sizeInBytes: 0,
		};

		return childPaths.reduce((total, childPath): CountData => {
			const childCount = this.getCachedDataForPath(counts, childPath);
			return {
				isCountable: total.isCountable || childCount.isCountable,
				isDirectory: true,
				noteCount: total.noteCount + childCount.noteCount,
				linkCount: total.linkCount + childCount.linkCount,
				embedCount: total.embedCount + childCount.embedCount,
				aliases: [],
				wordCount: total.wordCount + childCount.wordCount,
				wordCountTowardGoal:
					total.wordCountTowardGoal + childCount.wordCountTowardGoal,
				wordGoal: total.wordGoal + childCount.wordGoal,
				pageCount: total.pageCount + childCount.pageCount,
				characterCount: total.characterCount + childCount.characterCount,
				nonWhitespaceCharacterCount:
					total.nonWhitespaceCharacterCount +
					childCount.nonWhitespaceCharacterCount,
				createdDate: total.createdDate === 0
					? childCount.createdDate
					: Math.min(total.createdDate, childCount.createdDate),
				modifiedDate: Math.max(
					total.modifiedDate,
					childCount.modifiedDate
				),
				sizeInBytes: total.sizeInBytes + childCount.sizeInBytes,
			};
		}, directoryDefault);
	}

	public setDebugMode(debug: boolean): void {
		this.debugHelper.setDebugMode(debug);
	}

	public removeFileCounts(
		path: string,
		counts: CountsByFile
	): void {
		this.removeCounts(counts, path);

		for (const childPath of this.getChildPaths(counts, path)) {
			this.removeCounts(counts, childPath);
		}
	}

	public async updateFileCounts(
		abstractFile: TAbstractFile,
		counts: CountsByFile,
		cancellationToken: CancellationToken
	): Promise<void> {
		if (abstractFile instanceof TFolder) {
			for (const child of abstractFile.children) {
				this.updateFileCounts(child, counts, cancellationToken);
			}
			return;
		}

		if (abstractFile instanceof TFile) {
			this.setCounts(counts, abstractFile, this.settings.wordCountType);
		}
	}

	private countEmbeds(metadata?: CachedMetadata): number {
		return metadata?.embeds?.length ?? 0;
	}

	private countLinks(metadata?: CachedMetadata): number {
		return metadata?.links?.length ?? 0;
	}

	private countNonWhitespaceCharacters(content: string): number {
		return (content.replace(/\s+/g, "") || []).length;
	}

	private cjkRegex =
		/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}|[0-9]+/gu;

	private countWords(content: string, wordCountType: WordCountType): number {
		switch (wordCountType) {
			case WordCountType.CJK:
				return (content.match(this.cjkRegex) || []).length;
			case WordCountType.AutoDetect:
				const cjkLength = (content.match(this.cjkRegex) || []).length;
				const spaceDelimitedLength = (content.match(/[^\s]+/g) || []).length;
				return Math.max(cjkLength, spaceDelimitedLength);
			case WordCountType.SpaceDelimited:
			default:
				return (content.match(/[^\s]+/g) || []).length;
		}
	}

	private getChildPaths(counts: CountsByFile, path: string): string[] {
		const childPaths = Object.keys(counts).filter(
			(countPath) => path === "/" || countPath.startsWith(path + "/")
		);
		return childPaths;
	}

	private removeCounts(counts: CountsByFile, path: string): void {
		delete counts[path];
	}

	private async setCounts(
		counts: CountsByFile,
		file: TFile,
		wordCountType: WordCountType
	): Promise<void> {
		const metadata = this.app.metadataCache.getFileCache(file) as CachedMetadata | null;
		const shouldCountFile = this.shouldCountFile(file, metadata);

		counts[file.path] = {
			isCountable: shouldCountFile,
			isDirectory: false,
			noteCount: 1,
			wordCount: 0,
			wordCountTowardGoal: 0,
			wordGoal: 0,
			pageCount: 0,
			characterCount: 0,
			nonWhitespaceCharacterCount: 0,
			linkCount: 0,
			embedCount: 0,
			aliases: [],
			createdDate: file.stat.ctime,
			modifiedDate: file.stat.mtime,
			sizeInBytes: file.stat.size,
		};

		if (!shouldCountFile) {
			return;
		}

		const content = await this.vault.cachedRead(file);
		const meaningfulContent = this.getMeaningfulContent(content, metadata);
		const wordCount = this.countWords(meaningfulContent, wordCountType);
		const wordGoal: number = this.getWordGoal(metadata);
		const characterCount = meaningfulContent.length;
		const nonWhitespaceCharacterCount =
			this.countNonWhitespaceCharacters(meaningfulContent);

		let pageCount = 0;
		if (this.settings.pageCountType === PageCountType.ByWords) {
			const wordsPerPage = Number(this.settings.wordsPerPage);
			const wordsPerPageValid = !isNaN(wordsPerPage) && wordsPerPage > 0;
			pageCount = wordCount / (wordsPerPageValid ? wordsPerPage : 300);
		} else if (
			this.settings.pageCountType === PageCountType.ByChars &&
			!this.settings.charsPerPageIncludesWhitespace
		) {
			const charsPerPage = Number(this.settings.charsPerPage);
			const charsPerPageValid = !isNaN(charsPerPage) && charsPerPage > 0;
			pageCount =
				nonWhitespaceCharacterCount / (charsPerPageValid ? charsPerPage : 1500);
		} else if (
			this.settings.pageCountType === PageCountType.ByChars &&
			this.settings.charsPerPageIncludesWhitespace
		) {
			const charsPerPage = Number(this.settings.charsPerPage);
			const charsPerPageValid = !isNaN(charsPerPage) && charsPerPage > 0;
			pageCount = characterCount / (charsPerPageValid ? charsPerPage : 1500);
		}

		Object.assign(counts[file.path], {
			wordCount,
			wordCountTowardGoal: wordGoal !== null ? wordCount : 0,
			wordGoal,
			pageCount,
			characterCount,
			nonWhitespaceCharacterCount,
			linkCount: this.countLinks(metadata),
			embedCount: this.countEmbeds(metadata),
			aliases: parseFrontMatterAliases(metadata?.frontmatter),
		} as CountData);
	}

	private getWordGoal(metadata?: CachedMetadata): number | null {
		const goal = metadata && metadata.frontmatter && metadata.frontmatter["word-goal"];
		if (!goal || isNaN(Number(goal))) {
			return null;
		}

		return Number(goal);
	}

	private getMeaningfulContent(
		content: string,
		metadata?: CachedMetadata
	): string {
		let meaningfulContent = content;

		const hasFrontmatter = !!metadata && !!metadata.frontmatter;
		if (hasFrontmatter) {
			const frontmatterPos =
				(metadata as any).frontmatterPosition || metadata.frontmatter.position;
			meaningfulContent =
				frontmatterPos && frontmatterPos.start && frontmatterPos.end
					? meaningfulContent.slice(0, frontmatterPos.start.offset) +
					  meaningfulContent.slice(frontmatterPos.end.offset)
					: meaningfulContent;
		}

		if (this.settings.excludeComments) {
			const hasComments = meaningfulContent.includes("%%") || meaningfulContent.includes("<!--");
			if (hasComments) {
				meaningfulContent = meaningfulContent.replace(/(?:%%[\s\S]+?%%|<!--[\s\S]+?-->)/gmi, '');
			}
		}

		return meaningfulContent;
	}

	private readonly FileTypeAllowlist = new Set([
		"",
		// Markdown extensions
		"markdown",
		"md",
		"mdml",
		"mdown",
		"mdtext",
		"mdtxt",
		"mdwn",
		"mkd",
		"mkdn",
		// Text files
		"txt",
		"text",
		"rtf",
		// MD with embedded code
		"qmd",
		"rmd",
		// MD for screenwriters
		"fountain"
	]);

	private shouldCountFile(file: TFile, metadata?: CachedMetadata): boolean {
		if (!this.FileTypeAllowlist.has(file.extension.toLowerCase())) {
			return false;
		}

		if (!metadata) {
			return true;
		}

		if (
			metadata.frontmatter &&
			metadata.frontmatter.hasOwnProperty("wordcount") &&
			(metadata.frontmatter.wordcount === null ||
				metadata.frontmatter.wordcount === false ||
				metadata.frontmatter.wordcount === "false")
		) {
			return false;
		}

		const tags = getAllTags(metadata).map((tag) => tag.toLowerCase());
		if (
			tags.length &&
			(tags.includes("#excalidraw") ||
				tags
					.filter((tag) => tag.startsWith("#exclude"))
					.map((tag) => tag.replace(/[-_]/g, ""))
					.includes("#excludefromwordcount"))
		) {
			return false;
		}

		return true;
	}
}
