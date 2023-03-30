export class DebugHelper {
  private debugMode = false;

  public setDebugMode(debug: boolean): void {
    this.debugMode = debug;
  }

  public debug(...args: any[]): void {
		if (!this.debugMode) {
			return
		}

		console.log('novel-word-count:', ...args);
	}

	public error(message: any): void {
		if (!this.debugMode) {
			return;
		}

		console.error(message);
	}

	public debugStart(name: string): () => void {
		if (!this.debugMode) {
			return () => {}
		}

		var qualifiedName = `novel-word-count|${name}`
		console.time(qualifiedName);
		return () => console.timeEnd(qualifiedName);
	}
}
