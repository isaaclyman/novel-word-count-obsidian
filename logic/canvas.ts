import { TFile } from "obsidian";
import { CanvasData } from "obsidian/canvas";
import { DebugHelper } from "./debug";

export class CanvasHelper {
  constructor(private debug: DebugHelper) {}

  getCanvasText(file: TFile, content: string): string {
    try {
      const canvas: CanvasData = JSON.parse(content);
      const texts = canvas.nodes.map(node => node.text).filter(text => !!text);
      return texts.join('\n');
    } catch (ex) {
      this.debug.error(`Unable to parse canvas file [${file.name}]: ${ex}`);
      return '';
    }
  }
}
