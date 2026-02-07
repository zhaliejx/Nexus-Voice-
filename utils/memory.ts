const STORAGE_KEY = 'nexus_core_memory';

export interface MemoryItem {
  key: string;
  value: string;
  timestamp: number;
}

export const MemoryManager = {
  getAll: (): Record<string, string> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  set: (key: string, value: string) => {
    const memory = MemoryManager.getAll();
    memory[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    return `Memory stored: [${key}] = ${value}`;
  },

  get: (key: string) => {
    const memory = MemoryManager.getAll();
    return memory[key] || "No record found.";
  },

  delete: (key: string) => {
    const memory = MemoryManager.getAll();
    if (memory[key]) {
      delete memory[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
      return `Memory deleted: [${key}]`;
    }
    return "Key not found.";
  },
  
  clear: () => {
      localStorage.removeItem(STORAGE_KEY);
      return "Memory core wiped.";
  }
};