import { TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { DebugHelper } from "./debug";

export interface CountData {
	pageCount: number;
	wordCount: number;
	characterCount: number;
	createdDate: number;
	modifiedDate: number;
}

export type CountsByFile = {
	[path: string]: CountData;
};

export class FileHelper {
	private debugHelper = new DebugHelper();

	constructor(private vault: Vault) {}

	public async getAllFileCounts(): Promise<CountsByFile> {
		const debugEnd = this.debugHelper.debugStart('getAllFileCounts')

		const files = this.vault.getMarkdownFiles();
		const counts: CountsByFile = {};

		for (const file of files) {
			const contents = await this.vault.cachedRead(file);
			const wordCount = this.countWords(contents);
			this.setCounts(counts, file, wordCount, contents);
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
				total.wordCount += childCount.wordCount;
				total.pageCount += childCount.pageCount;
				total.characterCount += childCount.characterCount;
				total.createdDate = total.createdDate === 0 ? childCount.createdDate : Math.min(total.createdDate, childCount.createdDate);
				total.modifiedDate = Math.max(total.modifiedDate, childCount.modifiedDate);
				return total;
			},
			{
				wordCount: 0,
				pageCount: 0,
				characterCount: 0,
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
			this.debugHelper.debug('updateFileCounts called on instance of TFolder')
			Object.assign(counts, this.getAllFileCounts());
			return;
		}

		if (abstractFile instanceof TFile) {
			const contents = await this.vault.cachedRead(abstractFile);
			const wordCount = this.countWords(contents);
			this.setCounts(counts, abstractFile, wordCount, contents);
		}
	}

	private countWords(content: string): number {
		return (content.match(/[^\s]+/g) || []).length;
	}

	private setCounts(
		counts: CountsByFile,
		file: TFile,
		wordCount: number,
		content: string
	): void {
		counts[file.path] = {
			wordCount: wordCount,
			pageCount: Math.ceil(wordCount / 300),
			characterCount: content.length,
			createdDate: file.stat.ctime,
			modifiedDate: file.stat.mtime,
		};
	}
}
