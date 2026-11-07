const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('judy', {
  minimize: () => ipcRenderer.send('win:minimize'),
  close: () => ipcRenderer.send('win:close')
})
