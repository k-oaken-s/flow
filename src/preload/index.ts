import { contextBridge, ipcRenderer } from 'electron';

interface ElectronAPI {
  selectFiles: () => Promise<string[]>;
  selectFolder: () => Promise<string>;
  getUserDataPath: () => Promise<string>;
  getVideos: () => Promise<any[]>;
  getWatchFolders: () => Promise<any[]>;
  removeVideo: (id: string) => Promise<void>;
  removeWatchFolder: (id: string) => Promise<void>;
  updateVideoMetadata: (id: string, metadata: any, thumbnails: string[]) => Promise<void>;
  retryThumbnails: (id: string) => Promise<void>;
  
  // ファイルシステム操作
  readFile: (filePath: string) => Promise<Uint8Array>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
  mkdir: (dirPath: string) => Promise<void>;
  unlink: (filePath: string) => Promise<void>;
  exists: (filePath: string) => Promise<boolean>;

  // イベント
  onThumbnailProgress: (callback: (data: { videoId: string; progress: number }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  // ファイルシステム操作
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, data: Uint8Array) => ipcRenderer.invoke('write-file', filePath, data),
  mkdir: (dirPath: string) => ipcRenderer.invoke('mkdir', dirPath),
  unlink: (filePath: string) => ipcRenderer.invoke('unlink', filePath),
  exists: (filePath: string) => ipcRenderer.invoke('file-exists', filePath),

  // ファイル関連
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  
  // データ操作
  getVideos: () => ipcRenderer.invoke('get-videos'),
  getWatchFolders: () => ipcRenderer.invoke('get-watch-folders'),
  removeVideo: (id: string) => ipcRenderer.invoke('remove-video', id),
  removeWatchFolder: (id: string) => ipcRenderer.invoke('remove-watch-folder', id),
  updateVideoMetadata: (
    id: string, 
    metadata: any, 
    thumbnails: string[]
  ) => ipcRenderer.invoke('update-video-metadata', id, metadata, thumbnails),
  retryThumbnails: (id: string) => ipcRenderer.invoke('retry-thumbnails', id),

  // イベント
  onThumbnailProgress: (callback: (data: { videoId: string; progress: number }) => void) => {
    const listener = (_: any, data: { videoId: string; progress: number }) => callback(data);
    ipcRenderer.on('thumbnail-progress', listener);
    return () => ipcRenderer.removeListener('thumbnail-progress', listener);
  }
});