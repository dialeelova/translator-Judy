const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('snip', {
  onImage: (cb) => ipcRenderer.on('snip:image', (e, url) => cb(url)),
  done: (rect) => ipcRenderer.send('snip:done', rect)
})
