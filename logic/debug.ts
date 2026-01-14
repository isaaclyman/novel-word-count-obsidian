export class DebugHelper {
  private debugMode = false;
	private idCounter = 0;

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

		const qualifiedName = `novel-word-count|${name} (${++this.idCounter})`
		console.time(qualifiedName);
		return () => console.timeEnd(qualifiedName);
	}
}
