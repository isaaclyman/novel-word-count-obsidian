import NovelWordCountPlugin from "main";
import { TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { DebugHelper } from "./debug";
import { NovelWordCountSettings, PageCountType } from "./settings";

export interface CountData {
	noteCount: number;
	pageCount: number;
	wordCount: number;
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

	constructor(private vault: Vault, private plugin: NovelWordCountPlugin) {}

	public async getAllFileCounts(): Promise<CountsByFile> {
		const debugEnd = this.debugHelper.debugStart("getAllFileCounts");

		const files = this.vault.getMarkdownFiles();
		const counts: CountsByFile = {};

		for (const file of files) {
			const contents = await this.vault.cachedRead(file);
			this.setCounts(counts, file, contents);
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
				return total;
			},
			{
				noteCount: 0,
				wordCount: 0,
				pageCount: 0,
				characterCount: 0,
				nonWhitespaceCharacterCount: 0,
				createdDate: 0,
				modifiedDate: 0,
			} as CountData
		);
	}

	public setDebugMode(debug: boolean): void {
		this.debugHelper.setDebugMode(debug);
	}

	public async updateFileCounts(
		abstractFile: TAbstractFile,
		counts: CountsByFile
	): Promise<void> {
		if (abstractFile instanceof TFolder) {
			this.debugHelper.debug("updateFileCounts called on instance of TFolder");
			Object.assign(counts, this.getAllFileCounts());
			return;
		}

		if (abstractFile instanceof TFile) {
			const contents = await this.vault.cachedRead(abstractFile);
			this.setCounts(counts, abstractFile, contents);
		}
	}

	private countWords(content: string): number {
		return (content.match(/[^\s]+/g) || []).length;
	}

	private countNonWhitespaceCharacters(content: string): number {
		return (content.replace(/\s+/g, "") || []).length;
	}

	private setCounts(counts: CountsByFile, file: TFile, content: string): void {
		const wordCount = this.countWords(content);
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

		counts[file.path] = {
			noteCount: 1,
			wordCount,
			pageCount,
			characterCount: content.length,
			nonWhitespaceCharacterCount,
			createdDate: file.stat.ctime,
			modifiedDate: file.stat.mtime,
		};
	}
}
