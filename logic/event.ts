import type NovelWordCountPlugin from "main";
import { App, TFolder, WorkspaceLeaf, debounce } from "obsidian";
import { CancellationTokenSource } from "./cancellation";
import { DebugHelper } from "./debug";
import { FileHelper } from "./file";

export class EventHelper {
	private cancellationSources: CancellationTokenSource[] = [];

	constructor(
		private plugin: NovelWordCountPlugin,
		private app: App,
		private debugHelper: DebugHelper,
		private fileHelper: FileHelper
	) {}

	public async handleEvents(): Promise<void> {
		this.plugin.registerEvent(
			this.app.metadataCache.on("changed", async (file) => {
				this.debugHelper.debug(
					"[changed] metadataCache hook fired, recounting file",
					file.path
				);
				const countToken = this.registerNewCountToken();
				await this.fileHelper.updateFileCounts(
					file,
					this.plugin.savedData.cachedCounts,
					countToken.token
				);
				this.cancelToken(countToken);
				await this.plugin.updateDisplayedCounts(file);
				await this.plugin.saveSettings();
			})
		);

		this.plugin.registerEvent(
			this.app.vault.on("create", async (file) => {
				this.debugHelper.debug(
					"[create] vault hook fired, analyzing file",
					file.path
				);
				const countToken = this.registerNewCountToken();
				await this.fileHelper.updateFileCounts(
					file,
					this.plugin.savedData.cachedCounts,
					countToken.token
				);
				this.cancelToken(countToken);
				await this.plugin.updateDisplayedCounts(file);
				await this.plugin.saveSettings();
			})
		);

		this.plugin.registerEvent(
			this.app.vault.on("delete", async (file) => {
				this.debugHelper.debug(
					"[delete] vault hook fired, forgetting file",
					file.path
				);
				this.fileHelper.removeFileCounts(
					file.path,
					this.plugin.savedData.cachedCounts
				);
				await this.plugin.updateDisplayedCounts(file);
				await this.plugin.saveSettings();
			})
		);

		this.plugin.registerEvent(
			this.app.vault.on("rename", async (file, oldPath) => {
        if (file instanceof TFolder) {
          // When a folder is renamed, all of its child folders/files are renamed as well.
          return;
        }

				this.debugHelper.debug(
					"[rename] vault hook fired, recounting file",
					file.path
				);
				this.fileHelper.removeFileCounts(
					oldPath,
					this.plugin.savedData.cachedCounts
				);
				const countToken = this.registerNewCountToken();
				await this.fileHelper.updateFileCounts(
					file,
					this.plugin.savedData.cachedCounts,
					countToken.token
				);
				this.cancelToken(countToken);
				await this.plugin.updateDisplayedCounts(file);
				await this.plugin.saveSettings();
			})
		);

		const reshowCountsIfNeeded = async (hookName: string) => {
			this.debugHelper.debug(`[${hookName}] hook fired`);

			const fileExplorerLeaf = await this.plugin.getFileExplorerLeaf();
			if (this.isContainerTouched(fileExplorerLeaf)) {
				this.debugHelper.debug(
					"container already touched, skipping display update"
				);
				return;
			}

			this.debugHelper.debug("container is clean, updating display");
			await this.plugin.updateDisplayedCounts();
		};

		this.plugin.registerEvent(
			this.app.workspace.on(
				"layout-change",
				debounce(reshowCountsIfNeeded.bind(this, "layout-change"), 1000)
			)
		);
	}

	private isContainerTouched(leaf: WorkspaceLeaf): boolean {
		const container = leaf.view.containerEl;
		return container.className.includes("novel-word-count--");
	}

	public async refreshAllCounts() {
		this.cancelAllCountTokens();
		const countToken = this.registerNewCountToken();

		this.debugHelper.debug("refreshAllCounts");
		this.plugin.savedData.cachedCounts = await this.fileHelper.getAllFileCounts(
			countToken.token
		);
		this.cancelToken(countToken);
		await this.plugin.saveSettings();
	}

	/*
    CANCELLATION HANDLING
  */

	private registerNewCountToken(): CancellationTokenSource {
		const cancellationSource = new CancellationTokenSource();
		this.cancellationSources.push(cancellationSource);
		return cancellationSource;
	}

	private cancelToken(source: CancellationTokenSource): void {
		source.cancel();
		if (this.cancellationSources.includes(source)) {
			this.cancellationSources.splice(
				this.cancellationSources.indexOf(source),
				1
			);
		}
	}

	private cancelAllCountTokens(): void {
		for (const source of this.cancellationSources) {
			source.cancel();
		}
		this.cancellationSources = [];
	}
}
