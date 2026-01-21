/* eslint-disable @typescript-eslint/no-unused-vars */
import { CountData, CountsByFile } from "logic/file";

describe('getChildPaths benchmark', () => {
  const deeplyNested = ['/'].concat(Array.from(Array(1000).keys(), ix => `/${Math.ceil(ix / 100)}`.repeat(ix % 100)));
  const deepCounts = deeplyNested.reduce((obj, key) => {
    obj[key] = {} as CountData;
    return obj;
  }, {} as CountsByFile);

  function getChildPathsOriginal(counts: CountsByFile, path: string): string[] {
    const childPaths = Object.keys(counts).filter(
      (countPath) => path === "/" || countPath.startsWith(path + "/")
    );
    
    return childPaths;
  }

  function getChildPathsOptimized(counts: CountsByFile, path: string): string[] {
    if (path === '/') {
      return Object.keys(counts);
    }

    const childPaths = [];

    const toMatch = path + '/';
    for (const key in counts) {
      if (key.startsWith(toMatch)) {
        childPaths.push(key);
      }
    }
    
    return childPaths;
  }

  it('gets child paths using the original method', () => {
    const label = 'getChildPathsOriginal - 10k iterations';
    console.time(label);
    for (let it = 0; it < 10_000; it++) {
      const result = getChildPathsOriginal(deepCounts, `/${it % 100}/${it % 100}`);
    }
    console.timeEnd(label);
  });

  it('gets child paths using the new method', () => {
    const label = 'getChildPathsOptimized - 10k iterations';
    console.time(label);
    for (let it = 0; it < 10_000; it++) {
      const result = getChildPathsOptimized(deepCounts, `/${it % 100}/${it % 100}`);
    }
    console.timeEnd(label);
  });
});