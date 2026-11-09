const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('judy', {
  minimize: () => ipcRenderer.send('win:minimize'),
  close: () => ipcRenderer.send('win:close'),
  translate: (text, from, to) => ipcRenderer.invoke('translate', { text, from, to }),
  onCaptured: (cb) => {
    const handler = (event, payload) => cb(payload)
    ipcRenderer.on('captured', handler)
    return () => ipcRenderer.removeListener('captured', handler)
  }
})
