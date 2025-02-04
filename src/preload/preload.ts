import { contextBridge } from 'electron'

// レンダラープロセスに公開するAPI
contextBridge.exposeInMainWorld('flowAPI', {
  // ここに機能を追加していく
  appName: 'Flow'
})