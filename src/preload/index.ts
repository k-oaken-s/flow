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
  openVideo: (path: string) => Promise<void>;
  
  // ファイルシステム操作
  readFile: (filePath: string) => Promise<Uint8Array>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
  mkdir: (dirPath: string) => Promise<void>;
  unlink: (filePath: string) => Promise<void>;
  exists: (filePath: string) => Promise<boolean>;

  // イベント
  onThumbnailProgress: (callback: (data: { videoId: string; progress: number }) => void) => () => void;
  onVideosUpdated: (callback: () => void) => () => void;

  // デバッグ
  debugStore: () => Promise<{ path: string; content: any } | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  // 既存のメソッド
  selectFiles: () => ipcRenderer.invoke('select-files'),
  getVideos: () => ipcRenderer.invoke('get-videos'),
  removeVideo: (id: string) => ipcRenderer.invoke('remove-video', id),
  retryThumbnails: (id: string) => ipcRenderer.invoke('retry-thumbnails', id),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  updateVideoMetadata: (id: string, metadata: any, thumbnails: string[]) => 
    ipcRenderer.invoke('update-video-metadata', id, metadata, thumbnails),

  // イベントリスナー
  onVideosUpdated: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('videos-updated', subscription);
    return () => {
      ipcRenderer.removeListener('videos-updated', subscription);
    };
  },
  onThumbnailProgress: (callback: (data: { videoId: string, progress: number }) => void) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on('thumbnail-progress', subscription);
    return () => {
      ipcRenderer.removeListener('thumbnail-progress', subscription);
    };
  },
  openVideo: (path: string) => ipcRenderer.invoke('open-video', path),

  // ファイルシステム操作
  mkdir: (path: string) => ipcRenderer.invoke('mkdir', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, data: Uint8Array) => ipcRenderer.invoke('write-file', path, data),
  exists: (path: string) => ipcRenderer.invoke('exists', path),

  // デバッグ
  debugStore: () => ipcRenderer.invoke('debug-store'),
});