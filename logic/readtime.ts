export class ReadTimeHelper {
  formatReadTime(minutes: number, shouldAbbreviate: boolean): string {
    const final = shouldAbbreviate ? '' : ' read';

    if ((minutes * 60) < 1) {
      return `0m${final}`
    }

    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s${final}`;
    }

    if (minutes < 60) {
      return `${Math.round(minutes)}m${final}`;
    }

    const hours = Math.floor(minutes / 60).toLocaleString();
    const remainder = Math.floor(minutes) % 60;
    return remainder === 0 ? `${hours}h${final}` : `${hours}h${remainder}m${final}`;
  }
}