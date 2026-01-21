import { CountsByFile } from "./count_data";

export interface DirectoryTrie {
	children: { [folderOrFileName: string]: DirectoryTrie };
}

// This is not used. A trie structure should be faster than an array of file paths,
//  but benchmarks have it performing 10x to 20x slower.
export class DirectoryTrieHelper {
	static buildTrie(counts: CountsByFile): DirectoryTrie {
		const root: DirectoryTrie = {children: {}};
		return Object.keys(counts).reduce((trie, fullPath) => {
			this.traverse(trie, fullPath, () => ({children: {}}));
			return trie;
		}, root);
	}

	static getAllLeaves = function*(rootTrie: DirectoryTrie, rootPrefix: string): Generator<string> {
		if (this.isLeaf(rootTrie)) {
			yield rootPrefix;
		}

		for (const key in rootTrie.children) {
			yield* this.getAllLeaves(rootTrie.children[key], this.join(rootPrefix, key));
		}
	}

	static getLeavesByPrefix(rootTrie: DirectoryTrie, prefix: string): string[] {
		const node = this.traverse(rootTrie, prefix);
		return [...this.getAllLeaves(node, prefix)];
	}

	static isRoot(prefix: string): boolean {
		return !prefix || prefix === "/";
	}

	public static traverse(
		rootTrie: DirectoryTrie,
		prefix: string,
		createMissing?: () => DirectoryTrie,
	): DirectoryTrie {
		const parts = prefix.split("/").filter((part) => !!part);
		let currentNode = rootTrie;

		for (const part of parts) {
			const match = currentNode.children[part];
			if (!match && createMissing) {
				currentNode = currentNode.children[part] = createMissing();
				continue;
			} else if (!match) {
				break;
			}
			currentNode = match;
		}
		return currentNode;
	}

	// PRIVATE

	private static isLeaf(node: DirectoryTrie): boolean {
		for (const key in node.children) {
			if (Object.prototype.hasOwnProperty.call(node.children, key)) {
				return false;
			}
		}

		return true;
	}

	private static join(prefix: string, childName: string): string {
		if (prefix.endsWith('/') || childName.startsWith('/')) {
			return prefix + childName;
		}

		return prefix + "/" + childName;
	}
}
