const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getVideos: () => ipcRenderer.invoke('get-videos'),
  getWatchFolders: () => ipcRenderer.invoke('get-watch-folders'),
  removeVideo: (id) => ipcRenderer.invoke('remove-video', id),
  removeWatchFolder: (id) => ipcRenderer.invoke('remove-watch-folder', id)
})