const CANCEL = Symbol('Cancel');

export class CancellationToken {
  private _isCancelled = false;

  get isCancelled() {
    return this._isCancelled;
  }

  [CANCEL]() {
    this._isCancelled = true;
  }
}

export class CancellationTokenSource {
  token = new CancellationToken();

  cancel() {
    this.token[CANCEL]();
  }
}