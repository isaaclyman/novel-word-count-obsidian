import { FrontMatterCache } from "obsidian";

export type CountsByFile = {
  [path: string]: CountData;
};

export interface CountData {
  isCountable: boolean;
  targetNodeType: TargetNode;
  noteCount: number;
  pageCount: number;
  wordCount: number;
  wordCountTowardGoal: number;
  wordGoal: number | null;
  characterCount: number;
  nonWhitespaceCharacterCount: number;
  newlineCount: number;
  readingTimeInMinutes: number;
  linkCount: number;
  embedCount: number;
  aliases: string[] | null;
  sizeInBytes: number;
  createdDate: number;
  modifiedDate: number;
  frontmatter?: FrontMatterCache;
  sessionStart: SessionCountData;
}

export interface SessionCountData {
  noteCount: number;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  nonWhitespaceCharacterCount: number;
  newlineCount: number;
}

export enum TargetNode {
  Root = "root",
  Directory = "directory",
  File = "file",
}