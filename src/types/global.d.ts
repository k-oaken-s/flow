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

  // イベント
  onThumbnailProgress: (
    callback: (data: ThumbnailProgress) => void
  ) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}