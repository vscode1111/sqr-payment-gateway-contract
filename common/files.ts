import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs';
import { readFileSync, writeFileSync } from 'fs';
import { readdir, rm } from 'fs/promises';
import path from 'path';

const LINE_SEPARATOR = '\n';
const TAB_SEPARATOR = '\t';

export interface ReplaceRule {
  pattern: RegExp;
  text: string;
}

export function replaceText(filePath: string, rule: ReplaceRule) {
  const { pattern, text } = rule;
  const content = readFileSync(filePath, 'utf-8');
  if (pattern.test(content)) {
    console.log('replaced > ', pattern, filePath);
    const updated = content.replace(pattern, text);
    writeFileSync(filePath, updated);
  }
}

export function replaceTexts(filePath: string, rules: ReplaceRule[]) {
  rules.forEach((rule) => replaceText(filePath, rule));
}

export function convertArrayToContent(array: string[]): string {
  let content = '';
  for (let i = 0; i < array.length; i++) {
    if (i !== array.length - 1) {
      content += array[i] + LINE_SEPARATOR;
    } else {
      content += array[i];
    }
  }
  return content;
}

export function convertContentToArray(content: string): string[] {
  return content.split(LINE_SEPARATOR);
}

export function convertArray2DToContent(array: string[][]): string {
  let content = '';
  let line = '';
  for (let i = 0; i < array.length; i++) {
    const lineArray = array[i];
    line = '';

    for (let j = 0; j < lineArray.length; j++) {
      const word = lineArray[j];
      if (j !== lineArray.length - 1) {
        line += word + TAB_SEPARATOR;
      } else {
        line += word;
      }
    }

    if (i !== array.length - 1) {
      content += line + LINE_SEPARATOR;
    } else {
      content += line;
    }
  }
  return content;
}

export function convertContentToArray2D(content: string): string[][] {
  const result: string[][] = [];

  const lines = content.split(LINE_SEPARATOR);

  lines.forEach((line) => {
    result.push(line.split(TAB_SEPARATOR));
  });

  return result;
}

export function eraseDirectorySync(directoryPath: string, pattern: RegExp) {
  let count = 0;
  function eraseDirectoryInner(directoryPath: string, pattern: RegExp, level = 6) {
    const files = readdirSync(directoryPath, { withFileTypes: true });
    files.forEach(async (file) => {
      const filePath = path.join(directoryPath, file.name);
      if (file.isDirectory()) {
        count++;
        if (pattern.test(file.name)) {
          rmSync(filePath, { recursive: true });
        } else {
          if (level != 0) {
            eraseDirectoryInner(filePath, pattern, level - 1);
          }
        }
      }
    });
  }
  eraseDirectoryInner(directoryPath, pattern);
  return count;
}

export async function eraseDirectory(directoryPath: string, patterns: RegExp[]) {
  console.log(`${directoryPath} start cleaning...`);
  let count = 0;
  async function eraseDirectoryInner(directoryPath: string, pattern: RegExp, level = 6) {
    const files = await readdir(directoryPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(directoryPath, file.name);
      if (file.isDirectory()) {
        count++;
        if (pattern.test(file.name)) {
          await rm(filePath, { recursive: true });
          console.log(`${filePath} was removed (lvl: ${level})`);
        } else {
          if (level != 0) {
            await eraseDirectoryInner(filePath, pattern, level - 1);
          }
        }
      }
    }
  }
  for (const pattern of patterns) {
    console.log(`find pattern ${pattern} ...`);
    await eraseDirectoryInner(directoryPath, pattern);
  }
  return count;
}

export async function getSortedFiles(directoryPath: string) {
  const files = await readdir(directoryPath, { withFileTypes: true });
  files.sort(
    (a, b) =>
      statSync(path.join(directoryPath, b.name)).mtime.getTime() -
      statSync(path.join(directoryPath, a.name)).mtime.getTime(),
  );
  return files;
}

export async function getActualFile(directoryPath: string) {
  const files = await readdir(directoryPath, { withFileTypes: true });
  if (files.length > 0) {
    files.sort(
      (a, b) =>
        statSync(path.join(directoryPath, b.name)).mtime.getTime() -
        statSync(path.join(directoryPath, a.name)).mtime.getTime(),
    );
    return files[0];
  }
  return undefined;
}

export async function eraseObsoleteFiles(directoryPath: string, limit: number) {
  const files = await getSortedFiles(directoryPath);
  for (let i = limit; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(directoryPath, file.name);
    await rm(filePath, { recursive: true });
  }
}

export async function remove(path: string) {
  if (existsSync(path)) {
    await rm(path, { recursive: true });
  }
}

export function getParentDirectory(targetFile: string) {
  return path.dirname(targetFile);
}

export function checkFilePathSync(filePath: string) {
  if (!existsSync(filePath)) {
    mkdirSync(filePath, { recursive: true });
  }
}
