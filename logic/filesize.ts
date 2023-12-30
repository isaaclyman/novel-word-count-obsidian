import { NumberFormatFileSize } from "./locale_format";

interface FormatThreshold {
  suffix: string;
  suffixLong: string;
  divisor: number;
}

const formatThresholds: FormatThreshold[] = [{
  suffix: 'B',
  suffixLong: ' B',
  divisor: 1,
},{
  suffix: 'kB',
  suffixLong: ' kB',
  divisor: 1_000,
},{
  suffix: 'MB',
  suffixLong: ' MB',
  divisor: 1_000_000,
},{
  suffix: 'GB',
  suffixLong: ' GB',
  divisor: 1_000_000_000,
},{
  suffix: 'TB',
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
        return `${NumberFormatFileSize.format(units)}${suffix}`;
      }
    }

    return `?B`;
  }
}