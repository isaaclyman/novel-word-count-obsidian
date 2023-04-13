interface FormatThreshold {
  suffix: string;
  suffixLong: string;
  divisor: number;
}

const formatThresholds: FormatThreshold[] = [{
  suffix: 'b',
  suffixLong: ' B',
  divisor: 1,
},{
  suffix: 'kb',
  suffixLong: ' KB',
  divisor: 1_000,
},{
  suffix: 'mb',
  suffixLong: ' MB',
  divisor: 1_000_000,
},{
  suffix: 'gb',
  suffixLong: ' GB',
  divisor: 1_000_000_000,
},{
  suffix: 'tb',
  suffixLong: ' TB',
  divisor: 1_000_000_000_000,
}]

export class FileSizeHelper {
  formatFileSize(bytes: number, shouldAbbreviate: boolean): string {
    const largestThreshold = formatThresholds.last();
    for (const formatThreshold of formatThresholds) {
      if (bytes < (formatThreshold.divisor * 1_000) || formatThreshold === largestThreshold) {
        const units = bytes / formatThreshold.divisor;
        const suffix = shouldAbbreviate ? formatThreshold.suffix : formatThreshold.suffixLong;
        return `${this.round(units)}${suffix}`;
      }
    }

    return `?B`;
  }

  private round(value: number): string {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}