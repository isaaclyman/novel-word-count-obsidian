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
} from "./settings";
import { CancellationToken } from "./cancellation";
import { countMarkdown } from "./parser";

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
	readingTimeInMinutes: number;
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

	private pathIncludeMatchers: string[] = [];

	constructor(private app: App, private plugin: NovelWordCountPlugin) {}

	public async getAllFileCounts(
		cancellationToken: CancellationToken
	): Promise<CountsByFile> {
		const debugEnd = this.debugHelper.debugStart("getAllFileCounts");

		let files: TFile[] = this.vault.getFiles();
		if (
			typeof this.plugin.settings.includeDirectories === "string" &&
			this.plugin.settings.includeDirectories.trim() !== "*" &&
			this.plugin.settings.includeDirectories.trim() !== ""
		) {
			const includeMatchers = this.plugin.settings.includeDirectories
				.trim()
				.split(",")
				.map((matcher) => matcher.trim());
			const matchedFiles = files.filter((file) =>
				includeMatchers.some((matcher) => file.path.includes(matcher))
			);

			if (matchedFiles.length > 0) {
				this.pathIncludeMatchers = includeMatchers;
			} else {
				this.pathIncludeMatchers = [];
				this.debugHelper.debug(
					"No files matched by includeDirectories setting. Defaulting to all files."
				);
			}
		}

		const counts: CountsByFile = {};

		for (const file of files) {
			if (cancellationToken.isCancelled) {
				break;
			}

			this.setCounts(counts, file);
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
			readingTimeInMinutes: 0,
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
				readingTimeInMinutes:
					total.readingTimeInMinutes + childCount.readingTimeInMinutes,
				createdDate:
					total.createdDate === 0
						? childCount.createdDate
						: Math.min(total.createdDate, childCount.createdDate),
				modifiedDate: Math.max(total.modifiedDate, childCount.modifiedDate),
				sizeInBytes: total.sizeInBytes + childCount.sizeInBytes,
			};
		}, directoryDefault);
	}

	public setDebugMode(debug: boolean): void {
		this.debugHelper.setDebugMode(debug);
	}

	public removeFileCounts(path: string, counts: CountsByFile): void {
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
				await this.updateFileCounts(child, counts, cancellationToken);
			}
			return;
		}

		if (abstractFile instanceof TFile) {
			await this.setCounts(counts, abstractFile);
		}
	}

	private countEmbeds(metadata?: CachedMetadata): number {
		return metadata?.embeds?.length ?? 0;
	}

	private countLinks(metadata?: CachedMetadata): number {
		return metadata?.links?.length ?? 0;
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
		file: TFile
	): Promise<void> {
		const metadata = this.app.metadataCache.getFileCache(
			file
		) as CachedMetadata | null;
		const shouldCountFile = this.shouldCountFile(file, metadata);

		counts[file.path] = {
			isCountable: shouldCountFile,
			isDirectory: false,
			noteCount: 0,
			wordCount: 0,
			wordCountTowardGoal: 0,
			wordGoal: 0,
			pageCount: 0,
			characterCount: 0,
			nonWhitespaceCharacterCount: 0,
			readingTimeInMinutes: 0,
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
		const trimmedContent = this.trimFrontmatter(content, metadata);
		const countResult = countMarkdown(trimmedContent, {
			excludeCodeBlocks: this.settings.excludeCodeBlocks,
			excludeComments: this.settings.excludeComments,
		});
		const combinedWordCount = countResult.cjkWordCount + countResult.spaceDelimitedWordCount;
		const wordGoal: number = this.getWordGoal(metadata);

		const cjkReadingTime =
			countResult.cjkWordCount / (this.settings.charsPerMinute || 500);
		const spaceDelimitedReadingTime =
			countResult.spaceDelimitedWordCount /
			(this.settings.wordsPerMinute || 265);
		const readingTimeInMinutes = cjkReadingTime + spaceDelimitedReadingTime;

		let pageCount = 0;
		if (this.settings.pageCountType === PageCountType.ByWords) {
			const wordsPerPage = Number(this.settings.wordsPerPage);
			const wordsPerPageValid = !isNaN(wordsPerPage) && wordsPerPage > 0;
			pageCount = combinedWordCount / (wordsPerPageValid ? wordsPerPage : 300);
		} else if (
			this.settings.pageCountType === PageCountType.ByChars &&
			!this.settings.charsPerPageIncludesWhitespace
		) {
			const charsPerPage = Number(this.settings.charsPerPage);
			const charsPerPageValid = !isNaN(charsPerPage) && charsPerPage > 0;
			pageCount =
				countResult.nonWhitespaceCharCount / (charsPerPageValid ? charsPerPage : 1500);
		} else if (
			this.settings.pageCountType === PageCountType.ByChars &&
			this.settings.charsPerPageIncludesWhitespace
		) {
			const charsPerPage = Number(this.settings.charsPerPage);
			const charsPerPageValid = !isNaN(charsPerPage) && charsPerPage > 0;
			pageCount = countResult.charCount / (charsPerPageValid ? charsPerPage : 1500);
		}

		Object.assign(counts[file.path], {
			noteCount: 1,
			wordCount: combinedWordCount,
			wordCountTowardGoal: wordGoal !== null ? combinedWordCount : 0,
			wordGoal,
			pageCount,
			characterCount: countResult.charCount,
			nonWhitespaceCharacterCount: countResult.nonWhitespaceCharCount,
			readingTimeInMinutes,
			linkCount: this.countLinks(metadata),
			embedCount: this.countEmbeds(metadata),
			aliases: parseFrontMatterAliases(metadata?.frontmatter),
		} as CountData);
	}

	private getWordGoal(metadata?: CachedMetadata): number | null {
		const goal =
			metadata && metadata.frontmatter && metadata.frontmatter["word-goal"];
		if (!goal || isNaN(Number(goal))) {
			return null;
		}

		return Number(goal);
	}

	private trimFrontmatter(content: string, metadata?: CachedMetadata): string {
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
		"fountain",
	]);

	private shouldCountFile(file: TFile, metadata?: CachedMetadata): boolean {
		if (
			this.pathIncludeMatchers.length > 0 &&
			!this.pathIncludeMatchers.some((matcher) => file.path.includes(matcher))
		) {
			return false;
		}

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
