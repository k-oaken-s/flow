import { contextBridge, ipcRenderer } from 'electron';
import { FilterState } from 'src/types/filter';

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
  incrementPlayCount: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addTag: (name: string, color: string) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  getTags: () => Promise<any[]>;
  updateVideoTags: (videoId: string, tagIds: string[]) => Promise<void>;
  notifyTagsUpdated: () => Promise<void>;
  onTagsUpdated: (callback: () => void) => () => void;
  notifyFilterChanged: (filter: FilterState) => Promise<void>;
  onFilterChanged: (callback: (filter: FilterState) => void) => () => void;
  getStatistics: () => Promise<any>;

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
  selectFiles: () => ipcRenderer.invoke('select-files'),
  getVideos: () => ipcRenderer.invoke('get-videos'),
  removeVideo: (id: string) => ipcRenderer.invoke('remove-video', id),
  retryThumbnails: (id: string) => ipcRenderer.invoke('retry-thumbnails', id),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  updateVideoMetadata: (id: string, metadata: any, thumbnails: string[]) => 
    ipcRenderer.invoke('update-video-metadata', id, metadata, thumbnails),
  openVideo: (path: string) => ipcRenderer.invoke('open-video', path),
  incrementPlayCount: (videoId: string) => ipcRenderer.invoke('increment-play-count', videoId),
  toggleFavorite: (videoId: string) => ipcRenderer.invoke('toggle-favorite', videoId),
  getTags: () => ipcRenderer.invoke('get-tags'),
  addTag: (name: string, color: string) => ipcRenderer.invoke('add-tag', name, color),
  removeTag: (id: string) => ipcRenderer.invoke('remove-tag', id),
  updateVideoTags: (videoId: string, tagIds: string[]) => 
      ipcRenderer.invoke('update-video-tags', videoId, tagIds),
  notifyTagsUpdated: () => ipcRenderer.invoke('notify-tags-updated'),
  onTagsUpdated: (callback: () => void) => {
      const subscription = () => callback();
      ipcRenderer.on('tags-updated', subscription);
      return () => {
          ipcRenderer.removeListener('tags-updated', subscription);
      };
  },
  notifyFilterChanged: (filter:  FilterState) => ipcRenderer.invoke('notify-filter-changed', filter), 
  onFilterChanged: (callback: (filter:  FilterState) => void) => {
    const subscription = (_: any, filter:  FilterState) => callback(filter);
    ipcRenderer.on('filter-changed', subscription);
    return () => {
        ipcRenderer.removeListener('filter-changed', subscription);
    };
},
getStatistics: () => ipcRenderer.invoke('get-statistics'),
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

  // ファイルシステム操作
  mkdir: (path: string) => ipcRenderer.invoke('mkdir', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, data: Uint8Array) => ipcRenderer.invoke('write-file', path, data),
  exists: (path: string) => ipcRenderer.invoke('exists', path),

  // デバッグ
  debugStore: () => ipcRenderer.invoke('debug-store'),
});