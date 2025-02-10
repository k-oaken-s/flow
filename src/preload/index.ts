import { contextBridge, ipcRenderer } from 'electron';
import { FilterState } from 'src/types/filter';

interface ElectronAPI {
  selectFiles: () => Promise<string[]>;
  selectFolder: () => Promise<string>;
  getUserDataPath: () => Promise<string>;
  getVideos: () => Promise<any[]>;
  getWatchFolders: () => Promise<any[]>;
  addWatchFolder: (folderPath: string) => Promise<void>;
  onWatchFoldersUpdated: (callback: () => void) => () => void;
  removeVideo: (id: string) => Promise<void>;
  removeWatchFolder: (id: string) => Promise<void>;
  updateVideoMetadata: (id: string, metadata: any, thumbnails: string[]) => Promise<void>;
  retryThumbnails: (id: string) => Promise<void>;
  openVideo: (path: string) => Promise<void>;
  incrementPlayCount: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addTag: (name: string) => Promise<void>;
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

  resetStore: () => Promise<boolean>;
  getAppVersion: () => Promise<string>;

  // デバッグ
  debugStore: () => Promise<{ path: string; content: any } | null>;

  openStorePath: () => Promise<void>;

  getVideo: (videoId: string) => Promise<any>;

  onMenuSelectFiles: (callback: () => void) => () => void;
  onMenuSelectFolder: (callback: () => void) => () => void;

  onMenuOpenTagManager: (callback: () => void) => () => void;

  onMenuResetData: (callback: () => void) => () => void;

  onMenuOpenStorePath: (callback: () => void) => () => void;

  onMenuShowVersion: (callback: () => void) => () => void;

  onMenuToggleTheme: (callback: (isDark: boolean) => void) => () => void;

  notifyThemeChanged: (isDark: boolean) => void;

  requestInitialTheme: () => Promise<void>;

  windowControl: (action: 'minimize' | 'maximize' | 'close') => void;

  regenerateThumbnails: () => Promise<void>;

  onMenuRegenerateThumbnails: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  getWatchFolders: () => ipcRenderer.invoke('get-watch-folders'),
  removeWatchFolder: (id: string) => ipcRenderer.invoke('remove-watch-folder', id),
  onWatchFoldersUpdated: (callback: () => void) => {
      const subscription = () => callback();
      ipcRenderer.on('watch-folders-updated', subscription);
      return () => {
          ipcRenderer.removeListener('watch-folders-updated', subscription);
      };
  },
  getVideos: () => ipcRenderer.invoke('get-videos'),
  removeVideo: (id: string) => ipcRenderer.invoke('remove-video', id),
  retryThumbnails: (id: string) => ipcRenderer.invoke('retry-thumbnails', id),
  addWatchFolder: (folderPath: string) => ipcRenderer.invoke('add-watch-folder', folderPath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  updateVideoMetadata: (id: string, metadata: any, thumbnails: string[]) => 
    ipcRenderer.invoke('update-video-metadata', id, metadata, thumbnails),
  openVideo: (path: string) => ipcRenderer.invoke('open-video', path),
  incrementPlayCount: (videoId: string) => ipcRenderer.invoke('increment-play-count', videoId),
  toggleFavorite: (videoId: string) => ipcRenderer.invoke('toggle-favorite', videoId),
  getTags: () => ipcRenderer.invoke('get-tags'),
  addTag: (name: string) => ipcRenderer.invoke('add-tag', name),
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

  resetStore: () => ipcRenderer.invoke('reset-store'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // デバッグ
  debugStore: () => ipcRenderer.invoke('debug-store'),

  openStorePath: () => ipcRenderer.invoke('open-store-path'),

  getVideo: (videoId: string) => ipcRenderer.invoke('get-video', videoId),

  onMenuSelectFiles: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-select-files', subscription);
    return () => {
      ipcRenderer.removeListener('menu-select-files', subscription);
    };
  },
  onMenuSelectFolder: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-select-folder', subscription);
    return () => {
      ipcRenderer.removeListener('menu-select-folder', subscription);
    };
  },

  onMenuOpenTagManager: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-open-tag-manager', subscription);
    return () => {
      ipcRenderer.removeListener('menu-open-tag-manager', subscription);
    };
  },

  onMenuResetData: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-reset-data', subscription);
    return () => {
      ipcRenderer.removeListener('menu-reset-data', subscription);
    };
  },

  onMenuOpenStorePath: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-open-store-path', subscription);
    return () => {
      ipcRenderer.removeListener('menu-open-store-path', subscription);
    };
  },

  onMenuShowVersion: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-show-version', subscription);
    return () => {
      ipcRenderer.removeListener('menu-show-version', subscription);
    };
  },

  onMenuToggleTheme: (callback: (isDark: boolean) => void) => {
    const subscription = (_: any, isDark: boolean) => callback(isDark);
    ipcRenderer.on('menu-toggle-theme', subscription);
    return () => {
      ipcRenderer.removeListener('menu-toggle-theme', subscription);
    };
  },

  notifyThemeChanged: (isDark: boolean) => {
    ipcRenderer.send('theme-changed', isDark);
  },

  requestInitialTheme: () => ipcRenderer.invoke('request-initial-theme'),

  windowControl: (action: 'minimize' | 'maximize' | 'close') => {
    ipcRenderer.send('window-control', action);
  },

  regenerateThumbnails: () => ipcRenderer.invoke('regenerate-thumbnails'),

  onMenuRegenerateThumbnails: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-regenerate-thumbnails', subscription);
    return () => {
      ipcRenderer.removeListener('menu-regenerate-thumbnails', subscription);
    };
  },
});