import { VideoFile, WatchFolder } from './store';

declare global {
  interface Window {
    electronAPI: {
      selectFiles: () => Promise<VideoFile[]>;
      selectFolder: () => Promise<WatchFolder | null>;
      getVideos: () => Promise<VideoFile[]>;
      getWatchFolders: () => Promise<WatchFolder[]>;
      removeVideo: (id: string) => Promise<void>;
      removeWatchFolder: (id: string) => Promise<void>;
    }
  }
}