export interface VideoFile {
    id: string;
    path: string;
    filename: string;
    added: number;
    fileSize: number;
    duration?: number;
  }
  
  export interface WatchFolder {
    id: string;
    path: string;
    added: number;
  }
  
  export interface StoreSchema {
    videos: VideoFile[];
    watchFolders: WatchFolder[];
  }