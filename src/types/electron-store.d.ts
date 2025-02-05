declare module 'electron-store' {
    type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
  
    interface Options<T> {
      name?: string;
      cwd?: string;
      defaults?: T;
    }
  
    class Store<T extends Record<string, any>> {
      constructor(options?: Options<T>);
      get<K extends keyof T>(key: K): T[K];
      set<K extends keyof T>(key: K, value: T[K]): void;
      set(obj: Partial<T>): void;
      has(key: keyof T): boolean;
      reset(...keys: Array<keyof T>): void;
      delete(key: keyof T): void;
      clear(): void;
    }
  
    export default Store;
  }