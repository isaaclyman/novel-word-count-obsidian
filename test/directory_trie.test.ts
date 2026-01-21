import { CountData, CountsByFile } from "logic/count_data";
import { DirectoryTrie, DirectoryTrieHelper } from "logic/directory_trie";

describe("DirectoryTrieHelper", () => {
	const paths = [
		"/",
		"/a",
		"/b",
		"/b/ba",
		"/c",
		"/c/ca",
		"/c/ca/caa",
		"/c/ca/cab",
		"/c/cb",
		"/c/cb/cba",
		"/c/cb/cbb",
	];
	const allLeaves = [
		"/a",
		"/b/ba",
		"/c/ca/caa",
		"/c/ca/cab",
		"/c/cb/cba",
		"/c/cb/cbb",
	];
	const rootTrie: DirectoryTrie = {
		children: {
			a: {
				children: {},
			},
			b: {
				children: {
					ba: {
						children: {},
					},
				},
			},
			c: {
				children: {
					ca: {
						children: {
							caa: { children: {} },
							cab: { children: {} },
						},
					},
					cb: {
						children: {
							cba: { children: {} },
							cbb: { children: {} },
						},
					},
				},
			},
		},
	};

	describe("buildTrie", () => {
		it("returns the reference trie from a complete list of paths", () => {
			const counts: CountsByFile = paths.reduce((obj, path) => {
				obj[path] = {} as CountData;
				return obj;
			}, {} as CountsByFile);
			const result = DirectoryTrieHelper.buildTrie(counts);
			expect(result).toEqual(rootTrie);
		});

		it("returns the reference trie from a list of leaf paths only", () => {
			const counts: CountsByFile = allLeaves.reduce((obj, path) => {
				obj[path] = {} as CountData;
				return obj;
			}, {} as CountsByFile);
			const result = DirectoryTrieHelper.buildTrie(counts);
			expect(result).toEqual(rootTrie);
		});
	});

	describe("getAllLeaves", () => {
		it("returns all leaves for the root node", () => {
			const leaves = DirectoryTrieHelper.getAllLeaves(rootTrie, "/");
			expect(leaves).toEqual(allLeaves);
		});

		it("returns leaves for a branch node", () => {
			const leaves = DirectoryTrieHelper.getAllLeaves(
				rootTrie.children["c"].children["cb"],
				"/c/cb",
			);
			expect(leaves).toEqual(["/c/cb/cba", "/c/cb/cbb"]);
		});

		it("returns a single item for a leaf node", () => {
			const leaves = DirectoryTrieHelper.getAllLeaves(
				rootTrie.children["c"].children["cb"].children["cbb"],
				"/c/cb/cbb",
			);
			expect(leaves).toEqual(["/c/cb/cbb"]);
		});
	});

	describe("getLeavesByPrefix", () => {
		it("returns all leaves when an empty string is passed", () => {
			const leaves = DirectoryTrieHelper.getLeavesByPrefix(rootTrie, "");
			expect(leaves).toEqual(allLeaves);
		});

		it("returns all leaves when a / is passed", () => {
			const leaves = DirectoryTrieHelper.getLeavesByPrefix(rootTrie, "/");
			expect(leaves).toEqual(allLeaves);
		});

		it("returns leaves for a branch path", () => {
			const leaves = DirectoryTrieHelper.getLeavesByPrefix(rootTrie, "/c");
			expect(leaves).toEqual([
				"/c/ca/caa",
				"/c/ca/cab",
				"/c/cb/cba",
				"/c/cb/cbb",
			]);
		});

		it("returns leaves for a leaf path", () => {
			const leaves = DirectoryTrieHelper.getLeavesByPrefix(rootTrie, "/b/ba");
			expect(leaves).toEqual(["/b/ba"]);
		});
	});

	describe("traverse", () => {
		it("returns the root node when an empty space is passed", () => {
			const node = DirectoryTrieHelper.traverse(rootTrie, "");
			expect(node).toBe(rootTrie);
		});

		it("returns the root node when a forward slash is passed", () => {
			const node = DirectoryTrieHelper.traverse(rootTrie, "/");
			expect(node).toBe(rootTrie);
		});

		it("returns a leaf node", () => {
			const node = DirectoryTrieHelper.traverse(rootTrie, "/b/ba");
			expect(node).toBe(rootTrie.children["b"].children["ba"]);
		});

		it("returns a branch node", () => {
			const node = DirectoryTrieHelper.traverse(rootTrie, "/c/ca");
			expect(node).toBe(rootTrie.children["c"].children["ca"]);
		});
	});
});
