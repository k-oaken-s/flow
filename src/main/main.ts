import StoreManager from './store';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');  // 追加
const sharp = require('sharp'); 
const ffmpeg = require('fluent-ffmpeg');

let mainWindow = null;
let store;
let storeManager;

async function loadStore() {
  try {
    const Store = (await import('electron-store')).default;
    store = new Store({
      name: 'flow-data',
      defaults: {
        videos: [],
        watchFolders: [],
        settings: {
          thumbnails: {
            maxCount: 20,
            quality: 80,
            width: 320,
            height: 180
          }
        }
      }
    });

    // StoreManagerのインスタンス化と初期化
    storeManager = new StoreManager();
    await storeManager.initializeStore(); // この行を追加

    console.log('Store and StoreManager initialized successfully');
  } catch (error) {
    console.error('Error in loadStore:', error);
    throw error; // エラーを上位に伝播させる
  }
}


function createWindow() {
  console.log('Creating window...');
  
  const preloadPath = path.join(__dirname, '..', 'preload', 'index.js');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      devTools: true,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.webContents.openDevTools({ mode: 'detach' });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Load failure:', errorCode, errorDescription);
  });

  console.log('Preload script path:', preloadPath);

  const indexPath = path.join(__dirname, '..', 'index.html');
  console.log('Loading index from:', indexPath);

  mainWindow.loadFile(indexPath);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
  });
}

function setupIpcHandlers() {
  ipcMain.handle('select-files', async () => {
    if (!mainWindow) return [];
    
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv'] }]
      });
  
      if (!result.canceled && result.filePaths.length > 0) {
        console.log('Selected files:', result.filePaths);
        
        const newVideos = storeManager.addVideoEntries(result.filePaths);
        console.log('Added new videos:', newVideos);
        
        if (newVideos.length > 0) {
          // サムネイル生成を開始
          for (const video of newVideos) {
            console.log('Starting thumbnail generation for video:', video.id);
            
            // メインプロセスでサムネイル生成を実行
            const thumbnailDir = path.join(app.getPath('userData'), 'thumbnails', video.id);
            await fs.promises.mkdir(thumbnailDir, { recursive: true });
            
            try {
              const metadata = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(video.path, (err: any, metadata: any) => {
                  if (err) reject(err);
                  else resolve({
                    duration: metadata.format.duration,
                    width: metadata.streams[0].width,
                    height: metadata.streams[0].height,
                    codec: metadata.streams[0].codec_name,
                    bitrate: metadata.format.bit_rate
                  });
                });
              });
            
              const settings = storeManager.getSettings().thumbnails;
              const thumbnails = await generateThumbnails(video.id, video.path, thumbnailDir, settings);
            
              // 少なくとも1つのサムネイルが生成できた場合は成功とする
              if (thumbnails.length > 0) {
                storeManager.updateVideo(video.id, {
                  metadata,
                  thumbnails,
                  processingStatus: 'completed',
                  processingProgress: 100
                });
              } else {
                storeManager.updateVideo(video.id, {
                  processingStatus: 'error'
                });
              }
            } catch (error) {
              console.error('Error generating thumbnails:', error);
              storeManager.updateVideo(video.id, {
                processingStatus: 'error'
              });
            }
          }
  
          mainWindow?.webContents.send('videos-updated');
        }
  
        return newVideos;
      }
  
      return [];
    } catch (error) {
      console.error('Error in select-files handler:', error);
      throw error;
    }
  });
  
  async function generateThumbnails(
    videoId: string,
    videoPath: string,
    outputDir: string,
    options: { maxCount: number; quality: number; width: number; height: number }
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, async (err: any, metadata: any) => {
        if (err) {
          console.error('Error probing video:', err);
          reject(err);
          return;
        }
  
        const duration = metadata.format.duration;
        if (!duration) {
          console.error('No duration found in video metadata');
          reject(new Error('No duration found in video metadata'));
          return;
        }
  
        const thumbnails: string[] = [];
        const BATCH_SIZE = 4;
        let totalProcessed = 0;
  
        const timestamps = Array.from({ length: options.maxCount }, (_, i) => {
          return Math.max(0, Math.min(duration * (i / (options.maxCount - 1)), duration - 0.1));
        });
  
        const processBatch = async (startIndex: number, endIndex: number) => {
          const batchTimestamps = timestamps.slice(startIndex, endIndex);
          const batchPromises = batchTimestamps.map((timestamp, i) => {
            return new Promise<string>((resolveThumb, rejectThumb) => {
              const currentIndex = startIndex + i;
              const outputPath = path.join(outputDir, `thumb_${currentIndex}.jpg`);
              console.log(`Generating thumbnail ${currentIndex + 1}/${options.maxCount} at ${timestamp}s`);
  
              ffmpeg(videoPath)
                .screenshots({
                  timestamps: [timestamp],
                  filename: `thumb_${currentIndex}.jpg`,
                  folder: outputDir,
                  size: `${options.width}x${options.height}`,
                  fastSeek: true,
                })
                .on('end', () => {
                  totalProcessed++;
                  console.log(`Thumbnail ${currentIndex + 1}/${options.maxCount} generated successfully`);
                  mainWindow?.webContents.send('thumbnail-progress', {
                    videoId,
                    progress: (totalProcessed / options.maxCount) * 100
                  });
                  resolveThumb(outputPath);
                })
                .on('error', (err: Error) => {
                  console.error(`Error generating thumbnail ${currentIndex + 1}:`, err);
                  rejectThumb(err);
                });
            });
          });
  
          try {
            const results = await Promise.allSettled(batchPromises);
            results.forEach((result, i) => {
              if (result.status === 'fulfilled') {
                thumbnails[startIndex + i] = result.value;
              }
            });
          } catch (error) {
            console.error('Error in batch:', error);
          }
        };
  
        try {
          for (let i = 0; i < timestamps.length; i += BATCH_SIZE) {
            await processBatch(i, Math.min(i + BATCH_SIZE, timestamps.length));
            // バッチ間で少し待機
            await new Promise(r => setTimeout(r, 500));
          }
  
          // 空の要素を除去して結果を返す
          const validThumbnails = thumbnails.filter(t => t);
          if (validThumbnails.length > 0) {
            console.log(`Generated ${validThumbnails.length}/${options.maxCount} thumbnails successfully`);
            resolve(validThumbnails);
          } else {
            reject(new Error('No thumbnails were generated successfully'));
          }
        } catch (error) {
          console.error('Error in thumbnail generation:', error);
          const validThumbnails = thumbnails.filter(t => t);
          if (validThumbnails.length > 0) {
            console.log(`Partially succeeded: Generated ${validThumbnails.length}/${options.maxCount} thumbnails`);
            resolve(validThumbnails);
          } else {
            reject(error);
          }
        }
      });
    });
  }

  ipcMain.handle('get-user-data-path', () => app.getPath('userData'));

  ipcMain.handle('get-videos', () => {
    if (!storeManager) {
      console.error('StoreManager not initialized');
      return [];
    }
    return storeManager.getVideos();
  });

  ipcMain.handle('get-watch-folders', () => store.get('watchFolders'));

  ipcMain.handle('update-video-metadata', async (_, videoId, metadata, thumbnails) => {
    const videos = store.get('videos');
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex !== -1) {
      videos[videoIndex] = {
        ...videos[videoIndex],
        metadata,
        thumbnails,
        processingStatus: 'completed',
        processingProgress: 100
      };
      store.set('videos', videos);
    }
  });

  ipcMain.handle('remove-video', async (_, id) => {
    const videos = store.get('videos').filter(v => v.id !== id);
    store.set('videos', videos);
  });

  ipcMain.handle('retry-thumbnails', async (_, id) => {
    try {
      // サムネイル再生成の処理
    } catch (error) {
      console.error('Failed to retry thumbnails:', error);
    }
  });

  async function createThumbnail(videoPath: string, thumbnailPath: string) {
    try {
      await sharp(videoPath)
        .resize(320, 180)
        .toFile(thumbnailPath);
      console.log('Thumbnail created successfully');
    } catch (error) {
      console.error('Error creating thumbnail:', error);
    }
  }
  
  ipcMain.handle('add-video', async (event, videoPath: string) => {
    try {
      const thumbnailPath = path.join(path.dirname(videoPath), 'thumbnail.jpg');
      await createThumbnail(videoPath, thumbnailPath);
      store.set('videos', [...store.get('videos'), { videoPath, thumbnailPath }]);
      console.log('Added 1 new video');
    } catch (error) {
      console.error('Error adding video:', error);
    }
  });

  ipcMain.handle('debug-store', () => {
    try {
      const userDataPath = app.getPath('userData');
      const storePath = path.join(userDataPath, 'flow-data.json');
      console.log('Store file path:', storePath);
      
      // ファイルの内容を読み取り
      const content = fs.readFileSync(storePath, 'utf8');
      console.log('Store content:', JSON.parse(content));
      
      return {
        path: storePath,
        content: JSON.parse(content)
      };
    } catch (error) {
      console.error('Error reading store:', error);
      return null;
    }
  });
}

function setupFfmpeg() {
  try {
    const ffmpegPath = require('ffmpeg-static');
    const ffprobePath = require('ffprobe-static').path;
    
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    
    console.log('FFmpeg paths set successfully');
    console.log('FFmpeg path:', ffmpegPath);
    console.log('FFprobe path:', ffprobePath);
  } catch (error) {
    console.error('Error setting up FFmpeg:', error);
  }
}

app.whenReady().then(async () => {
  try {
    setupFfmpeg(); // FFmpegのセットアップを追加
    console.log('Initializing store...');
    await loadStore();
    
    console.log('Creating window...');
    createWindow();
    
    console.log('Setting up IPC handlers...');
    setupIpcHandlers();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

module.exports = {
  createWindow,
  setupIpcHandlers
};