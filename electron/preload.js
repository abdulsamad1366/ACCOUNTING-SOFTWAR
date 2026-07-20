const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveBackupFile: (content) => ipcRenderer.invoke('save-backup-file', content),
});
