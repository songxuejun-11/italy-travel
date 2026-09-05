// Vercel Serverless Functions 使用内存存储
// 从 seed-data.json 加载初始数据

import seedDataRaw from './seed-data.json' with { type: 'json' };

interface Store {
  [key: string]: unknown[];
}

// 内存存储
const memoryStore: Store = { ...seedDataRaw };

function readStore<T = unknown>(name: string, defaultValue: T): T {
  if (memoryStore[name]) {
    return memoryStore[name] as T;
  }
  return defaultValue;
}

function writeStore<T>(name: string, data: T): void {
  memoryStore[name] = data as unknown[];
}

// Simple ID generator
let idCounter = Date.now();
export function nextId(): number {
  return ++idCounter;
}

// Export store helpers
export { readStore, writeStore };
