/**
 * Déclaration de types pour le module fileSystem
 */

export interface FileSystemImplementation {
  fileExists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<boolean>;
  writeFile(path: string, content: string): Promise<boolean>;
  appendFile(path: string, content: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  readDir(path: string): Promise<string[]>;
}

export function initializeFileSystem(nativeImplementation: Partial<FileSystemImplementation>): void;

export const fileSystem: FileSystemImplementation; 