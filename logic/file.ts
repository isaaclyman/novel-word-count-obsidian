import NovelWordCountPlugin from "main";
import {
	App,
	TAbstractFile,
	TFile,
	TFolder,
	Vault,
	getAllTags,
} from "obsidian";
import { DebugHelper } from "./debug";
import {
	NovelWordCountSettings,
	PageCountType,
	WordCountType,
} from "./settings";

export interface CountData {
	isDirectory: boolean;
	noteCount: number;
	pageCount: number;
	wordCount: number;
	sizeInBytes: number;
	characterCount: number;
	nonWhitespaceCharacterCount: number;
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
		wordCountType: WordCountType
	): Promise<CountsByFile> {
		const debugEnd = this.debugHelper.debugStart("getAllFileCounts");

		const files = this.vault.getMarkdownFiles();
		const counts: CountsByFile = {};

		for (const file of files) {
			const contents = await this.vault.cachedRead(file);
			this.setCounts(counts, file, contents, wordCountType);
		}

		debugEnd();
		return counts;
	}

	public getCountDataForPath(counts: CountsByFile, path: string): CountData {
		if (counts.hasOwnProperty(path)) {
			return counts[path];
		}

		const childPaths = Object.keys(counts).filter(
			(countPath) => path === "/" || countPath.startsWith(path + "/")
		);

		return childPaths.reduce(
			(total, childPath) => {
				const childCount = this.getCountDataForPath(counts, childPath);
				total.isDirectory = true;
				total.noteCount += childCount.noteCount;
				total.wordCount += childCount.wordCount;
				total.pageCount += childCount.pageCount;
				total.characterCount += childCount.characterCount;
				total.nonWhitespaceCharacterCount +=
					childCount.nonWhitespaceCharacterCount;
				total.createdDate =
					total.createdDate === 0
						? childCount.createdDate
						: Math.min(total.createdDate, childCount.createdDate);
				total.modifiedDate = Math.max(
					total.modifiedDate,
					childCount.modifiedDate
				);
				total.sizeInBytes += childCount.sizeInBytes;
				return total;
			},
			{
				isDirectory: true,
				noteCount: 0,
				wordCount: 0,
				pageCount: 0,
				characterCount: 0,
				nonWhitespaceCharacterCount: 0,
				createdDate: 0,
				modifiedDate: 0,
				sizeInBytes: 0,
			} as CountData
		);
	}

	public setDebugMode(debug: boolean): void {
		this.debugHelper.setDebugMode(debug);
	}

	public async updateFileCounts(
		abstractFile: TAbstractFile,
		counts: CountsByFile,
		wordCountType: WordCountType
	): Promise<void> {
		if (abstractFile instanceof TFolder) {
			this.debugHelper.debug("updateFileCounts called on instance of TFolder");
			Object.assign(counts, this.getAllFileCounts(wordCountType));
			return;
		}

		if (abstractFile instanceof TFile) {
			const contents = await this.vault.cachedRead(abstractFile);
			this.setCounts(counts, abstractFile, contents, wordCountType);
		}
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

	private countNonWhitespaceCharacters(content: string): number {
		return (content.replace(/\s+/g, "") || []).length;
	}

	private setCounts(
		counts: CountsByFile,
		file: TFile,
		content: string,
		wordCountType: WordCountType
	): void {
		counts[file.path] = {
			isDirectory: false,
			noteCount: 1,
			wordCount: 0,
			pageCount: 0,
			characterCount: 0,
			nonWhitespaceCharacterCount: 0,
			createdDate: file.stat.ctime,
			modifiedDate: file.stat.mtime,
			sizeInBytes: file.stat.size,
		};

		if (!this.shouldCountFile(file)) {
			return;
		}

		const wordCount = this.countWords(content, wordCountType);
		const nonWhitespaceCharacterCount =
			this.countNonWhitespaceCharacters(content);

		let pageCount = 0;
		if (this.settings.pageCountType === PageCountType.ByWords) {
			const wordsPerPage = Number(this.settings.wordsPerPage);
			const wordsPerPageValid = !isNaN(wordsPerPage) && wordsPerPage > 0;
			pageCount = wordCount / (wordsPerPageValid ? wordsPerPage : 300);
		} else if (this.settings.pageCountType === PageCountType.ByChars) {
			const charsPerPage = Number(this.settings.charsPerPage);
			const charsPerPageValid = !isNaN(charsPerPage) && charsPerPage > 0;
			pageCount =
				nonWhitespaceCharacterCount / (charsPerPageValid ? charsPerPage : 1500);
		}

		Object.assign(counts[file.path], {
			wordCount,
			pageCount,
			characterCount: content.length,
			nonWhitespaceCharacterCount,
		});
	}

	private shouldCountFile(file: TFile): boolean {
		const metadata = this.app.metadataCache.getFileCache(file);
		const tags = getAllTags(metadata);
		return !tags.includes("#excalidraw");
	}
}
