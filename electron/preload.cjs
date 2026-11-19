const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  list:          ()            => ipcRenderer.invoke('db:list'),
  catalogGet:    (barcode)     => ipcRenderer.invoke('db:catalog-get', barcode),
  insertBatch:   (items)       => ipcRenderer.invoke('db:insert-batch', items),
  update:        (id, changes) => ipcRenderer.invoke('db:update', { id, changes }),
  remove:        (id)          => ipcRenderer.invoke('db:delete', id),
  history:       ()            => ipcRenderer.invoke('db:history'),
  deleted:       ()            => ipcRenderer.invoke('db:deleted'),
  verify:        (senha)       => ipcRenderer.invoke('auth:verify', senha),
  exportBackup:  ()            => ipcRenderer.invoke('admin:export-backup'),
  importBackup:  ()            => ipcRenderer.invoke('admin:import-backup'),
  dataDir:       ()            => ipcRenderer.invoke('app:data-dir'),
  getIp:         ()            => ipcRenderer.invoke('app:get-ip'),
  salvarRelatorioSemanal: (itens, nomeArquivo) => ipcRenderer.invoke('admin:salvar-relatorio-semanal', { itens, nomeArquivo }),
})