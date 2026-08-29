import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface Store {
  [key: string]: unknown;
}

function getFilePath(name: string): string {
  return path.join(DATA_DIR, `${name}.json`);
}

function readStore<T = unknown>(name: string, defaultValue: T): T {
  const filePath = getFilePath(name);
  if (!fs.existsSync(filePath)) {
    writeStore(name, defaultValue);
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

function writeStore<T>(name: string, data: T): void {
  const filePath = getFilePath(name);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Simple ID generator
let idCounter = Date.now();
export function nextId(): number {
  return ++idCounter;
}

// Export store helpers
export { readStore, writeStore };
