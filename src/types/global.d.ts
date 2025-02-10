import { FilterState } from './filter';
import { VideoFile, WatchFolder } from './store';

interface ThumbnailProgress {
  videoId: string;
  progress: number;
}

interface FileSystemAPI {
  readFile: (path: string) => Promise<Uint8Array>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
}

interface ElectronAPI extends FileSystemAPI {
  // ファイル関連
  selectFiles: () => Promise<VideoFile[]>;
  selectFolder: () => Promise<WatchFolder | null>;
  getUserDataPath: () => Promise<string>;
  openVideo: (path: string) => Promise<boolean>;
  toggleFavorite: (videoId: string) => Promise<boolean>;
  getTags: () => Promise<Tag[]>;
  addTag: (name: string, color: string) => Promise<Tag>;
  removeTag: (id: string) => Promise<boolean>;
  updateVideoTags: (videoId: string, tagIds: string[]) => Promise<boolean>;
  notifyTagsUpdated: () => void;
  notifyFilterChanged: (filter: FilterState) => Promise<void>;
  onFilterChanged: (callback: (filter: FilterState) => void) => () => void;
  getStatistics: () => Promise<Statistics>;
  addWatchFolder: (folderPath: string) => Promise<WatchFolder | null>;
  onWatchFoldersUpdated: (callback: () => void) => () => void;

  // データ操作
  getVideos: () => Promise<VideoFile[]>;
  getWatchFolders: () => Promise<WatchFolder[]>;
  removeVideo: (id: string) => Promise<void>;
  removeWatchFolder: (id: string) => Promise<void>;
  updateVideoMetadata: (
    id: string,
    metadata: VideoFile['metadata'],
    thumbnails: string[]
  ) => Promise<void>;
  retryThumbnails: (id: string) => Promise<void>;
  incrementPlayCount: (videoId: string) => Promise<boolean>;

  // イベント
  onThumbnailProgress: (
    callback: (data: ThumbnailProgress) => void
  ) => () => void;
  onVideosUpdated: (callback: () => void) => () => void;

  resetStore: () => Promise<boolean>;
  getAppVersion: () => Promise<string>;

  // デバッグ
  debugStore: () => Promise<{
    path: string;
    content: any;
  } | null>;

  onMenuSelectFiles: (callback: () => void) => () => void;
  onMenuSelectFolder: (callback: () => void) => () => void;
  onMenuOpenStorePath: (callback: () => void) => () => void;
  onMenuShowVersion: (callback: () => void) => () => void;

  requestInitialTheme: () => Promise<boolean>;
}

interface Statistics {
  totalVideos: number;
  totalDuration: number;
  totalSize: number;
  totalPlayCount: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}