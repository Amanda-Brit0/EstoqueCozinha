const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const os = require('os')

// Carrega variáveis do arquivo .env (na raiz da pasta Cozinha) se existir
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  for (const linha of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match) {
      const chave = match[1]
      const valor = match[2].replace(/^["']|["']$/g, '')
      if (!process.env[chave]) process.env[chave] = valor
    }
  }
}

const isDev = !app.isPackaged

// ─── Diretório de dados (ao lado do .exe no SSD) ──────────────────────────
const dataDir = isDev
  ? path.join(__dirname, '..', 'dados')
  : path.join(path.dirname(process.execPath), 'dados')

const FILES = {
  estoque:        path.join(dataDir, 'estoque.json'),
  historico:      path.join(dataDir, 'historico.json'),
  excluidos:      path.join(dataDir, 'excluidos.json'),
  catalogo:       path.join(dataDir, 'catalogo.json'),
  catalogoBase:   path.join(dataDir, 'catalogo-base.json'),
}

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
}

function read(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { return fallback }
}

function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
}

// ─── IP local da rede interna (prioriza 192.168. e 10.) ──────────────────
function getIpLocal() {
  const ifaces = os.networkInterfaces()
  const candidatos = []

  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family !== 'IPv4' || iface.internal) continue
      candidatos.push({ ip: iface.address, nome: name })
    }
  }

  // prioridade 1: 192.168.x.x
  const rede192 = candidatos.find(c => c.ip.startsWith('192.168.'))
  if (rede192) return rede192.ip

  // prioridade 2: 10.x.x.x
  const rede10 = candidatos.find(c => c.ip.startsWith('10.'))
  if (rede10) return rede10.ip

  // prioridade 3: 172.16-31.x.x
  const rede172 = candidatos.find(c => {
    const partes = c.ip.split('.')
    return partes[0] === '172' && parseInt(partes[1]) >= 16 && parseInt(partes[1]) <= 31
  })
  if (rede172) return rede172.ip

  // fallback: qualquer IP não-interno
  if (candidatos.length > 0) return candidatos[0].ip

  return '127.0.0.1'
}

// ─── Servidor HTTP para o gerente (porta 3000) ────────────────────────────
function iniciarServidorGerente() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (req.url === '/api/estoque') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(read(FILES.estoque)))
      return
    }

    if (req.url === '/api/historico') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(read(FILES.historico)))
      return
    }

    if (req.url === '/' || req.url === '/index.html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      const itens = read(FILES.estoque)
      res.end(gerarHtmlGerente(itens))
      return
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain')
    res.end('Not found')
  })

  server.listen(3000, '0.0.0.0', () => {
    console.log(`Servidor gerente: http://${getIpLocal()}:3000`)
  })
}

function gerarHtmlGerente(itens) {
  const linhas = itens.map(i => `
    <tr>
      <td>${i.codigoBarras || i.codigo || ''}</td>
      <td><strong>${i.nome}</strong></td>
      <td>${i.tipo || ''}</td>
      <td>${i.dataEntrada ? new Date(i.dataEntrada).toLocaleDateString('pt-BR') : ''}</td>
      <td style="text-align:center;font-weight:700">${i.quantidade ?? i.qtd ?? ''}</td>
      <td>${i.unidade || ''}</td>
      <td>${i.observacao || ''}</td>
      <td>
        <span style="padding:2px 10px;border-radius:12px;font-size:.75rem;font-weight:600;
          background:${i.status === 'Editado' ? 'rgba(212,175,55,.2)' : 'rgba(74,222,128,.15)'};
          color:${i.status === 'Editado' ? '#D4AF37' : '#4ade80'}">
          ${i.status || 'Original'}
        </span>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Estoque — Casa Dom Macário</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Inter:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#1a0008;color:#f5f5f5;font-family:Inter,sans-serif;min-height:100vh}
  header{background:linear-gradient(135deg,#7B0D1E,#4a0812);padding:18px 32px;border-bottom:2px solid #D4AF37;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
  header h1{font-family:Cinzel,serif;color:#D4AF37;font-size:1.3rem}
  header p{color:#ccc;font-size:.82rem;margin-top:3px}
  .badge{background:#D4AF37;color:#1a0008;padding:2px 10px;border-radius:12px;font-size:.72rem;font-weight:700;margin-left:10px;vertical-align:middle}
  main{padding:24px 32px}
  .stats{display:flex;gap:14px;margin-bottom:22px;flex-wrap:wrap}
  .stat{background:#2d0010;border:1px solid #5c1a2a;border-radius:10px;padding:14px 22px}
  .stat-val{font-size:1.8rem;font-weight:700;color:#D4AF37}
  .stat-lbl{font-size:.78rem;color:#aaa;margin-top:3px}
  .search{width:100%;max-width:400px;background:#2a0010;color:#f5f5f5;border:1px solid #3d0015;border-radius:8px;padding:9px 14px;font-size:.9rem;outline:none;margin-bottom:16px}
  .search:focus{border-color:#D4AF37}
  table{width:100%;border-collapse:collapse;background:#1f000a;border-radius:12px;overflow:hidden}
  th{background:#3d0015;color:#D4AF37;padding:10px 14px;text-align:left;font-size:.76rem;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
  td{padding:9px 14px;border-bottom:1px solid #2d0010;font-size:.88rem;vertical-align:middle}
  tr:hover{background:#2a0010}
  .btn{background:#7B0D1E;color:#D4AF37;border:1px solid #D4AF37;padding:7px 18px;border-radius:8px;cursor:pointer;font-size:.82rem}
  .btn:hover{background:#D4AF37;color:#1a0008}
  footer{text-align:center;padding:18px;color:#444;font-size:.73rem;margin-top:28px}
  @media(max-width:700px){th:nth-child(4),td:nth-child(4),th:nth-child(6),td:nth-child(6),th:nth-child(7),td:nth-child(7){display:none}}
</style>
</head>
<body>
<header>
  <div>
    <h1>Fundação Lar de São Bento — Casa Dom Macário <span class="badge">SOMENTE LEITURA</span></h1>
    <p>Controle de Estoque · Cozinha · Atualizado: ${new Date().toLocaleString('pt-BR')}</p>
  </div>
  <button class="btn" onclick="location.reload()">↻ Atualizar</button>
</header>
<main>
  <div class="stats">
    <div class="stat"><div class="stat-val">${itens.length}</div><div class="stat-lbl">Total de Itens</div></div>
    <div class="stat"><div class="stat-val">${itens.filter(i=>i.status==='Editado').length}</div><div class="stat-lbl">Editados</div></div>
    <div class="stat"><div class="stat-val">${[...new Set(itens.map(i=>i.tipo).filter(Boolean))].length}</div><div class="stat-lbl">Categorias</div></div>
  </div>
  <input class="search" placeholder="Buscar por nome, código ou observação..." oninput="filtrar(this.value)" id="busca"/>
  <table id="tabela">
    <thead><tr>
      <th>Código</th><th>Nome</th><th>Tipo</th><th>Data Entrada</th><th>Qtd</th><th>Unidade</th><th>Observação</th><th>Status</th>
    </tr></thead>
    <tbody id="corpo">${linhas || '<tr><td colspan="8" style="text-align:center;padding:32px;color:#555">Nenhum item cadastrado ainda.</td></tr>'}</tbody>
  </table>
</main>
<footer>Fundação Lar de São Bento — Casa Dom Macário · Acesso somente leitura · porta 3000</footer>
<script>
  function filtrar(q){
    q=q.toLowerCase()
    document.querySelectorAll('#corpo tr').forEach(tr=>{
      tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none'
    })
  }
</script>
</body></html>`
}

// ─── Janela ───────────────────────────────────────────────────────────────
let win

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    icon: path.join(__dirname, '..', 'assets', 'logo.png'),
    title: 'Estoque Cozinha — Casa Dom Macário',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setMenuBarVisibility(false)

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  ensureDir()
  createWindow()
  iniciarServidorGerente()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC ──────────────────────────────────────────────────────────────────

ipcMain.handle('db:list', () => read(FILES.estoque))

ipcMain.handle('db:catalog-get', (_, barcode) => {
  // 1º busca no catálogo aprendido pelo uso
  const cat = read(FILES.catalogo, {})
  if (cat[barcode]) return cat[barcode]
  // 2º busca no catálogo-base offline (produtos brasileiros comuns)
  const base = read(FILES.catalogoBase, {})
  return base[barcode] ?? null
})

ipcMain.handle('db:insert-batch', (_, items) => {
  const estoque = read(FILES.estoque)
  const cat     = read(FILES.catalogo, {})
  const now     = new Date().toISOString()

  items.forEach(item => {
    const id = `CDM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    estoque.push({ ...item, id, status: 'Original', criadoEm: now })
    if (item.codigoBarras && item.nome) cat[item.codigoBarras] = item.nome
  })

  write(FILES.estoque, estoque)
  write(FILES.catalogo, cat)
  return { ok: true }
})

ipcMain.handle('db:update', (_, { id, changes }) => {
  const estoque   = read(FILES.estoque)
  const historico = read(FILES.historico)
  const idx = estoque.findIndex(i => i.id === id)
  if (idx === -1) return { ok: false, error: 'Item não encontrado' }

  const antes  = { ...estoque[idx] }
  const depois = { ...antes, ...changes, status: 'Editado', editadoEm: new Date().toISOString() }

  estoque[idx] = depois
  historico.push({ id, dataHora: new Date().toISOString(), tipo: 'edicao', antes, depois })

  write(FILES.estoque, estoque)
  write(FILES.historico, historico)
  return { ok: true }
})

ipcMain.handle('db:delete', (_, id) => {
  const estoque   = read(FILES.estoque)
  const excluidos = read(FILES.excluidos)
  const historico = read(FILES.historico)

  const idx = estoque.findIndex(i => i.id === id)
  if (idx === -1) return { ok: false }

  const item = { ...estoque[idx], excluidoEm: new Date().toISOString() }
  excluidos.push(item)
  estoque.splice(idx, 1)
  historico.push({ id, dataHora: new Date().toISOString(), tipo: 'exclusao', antes: item, depois: null })

  write(FILES.estoque, estoque)
  write(FILES.excluidos, excluidos)
  write(FILES.historico, historico)
  return { ok: true }
})

ipcMain.handle('db:history',  () => read(FILES.historico))
ipcMain.handle('db:deleted',  () => read(FILES.excluidos))
ipcMain.handle('app:data-dir', () => dataDir)
ipcMain.handle('app:get-ip', () => getIpLocal())

// Senha lida exclusivamente de variável de ambiente (.env local), nunca embutida no código
ipcMain.handle('auth:verify', (_, senha) => {
  const senhaCorreta = process.env.ADMIN_SENHA || process.env.VITE_ADMIN_SENHA
  return Boolean(senhaCorreta) && senha === senhaCorreta
})

ipcMain.handle('admin:export-backup', async () => {
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Exportar Backup',
    defaultPath: `backup-estoque-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (!filePath) return { ok: false }
  const backup = {
    estoque:     read(FILES.estoque),
    historico:   read(FILES.historico),
    excluidos:   read(FILES.excluidos),
    catalogo:    read(FILES.catalogo, {}),
    exportadoEm: new Date().toISOString(),
  }
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2))
  return { ok: true, filePath }
})

ipcMain.handle('admin:import-backup', async () => {
  const { filePaths } = await dialog.showOpenDialog(win, {
    title: 'Importar Backup',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (!filePaths?.[0]) return { ok: false }
  try {
    const b = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))
    if (b.estoque)   write(FILES.estoque,   b.estoque)
    if (b.historico) write(FILES.historico, b.historico)
    if (b.excluidos) write(FILES.excluidos, b.excluidos)
    if (b.catalogo)  write(FILES.catalogo,  b.catalogo)
    return { ok: true }
  } catch (e) { return { ok: false, error: e.message } }
})

// ─── Relatório semanal em PDF salvo em Desktop/RELATÓRIO ─────────────────
ipcMain.handle('admin:salvar-relatorio-semanal', async (_, { itens, nomeArquivo }) => {
  try {
    // Pasta Desktop\RELATÓRIO do usuário atual
    const desktop = app.getPath('desktop')
    const pastaRelatorio = path.join(desktop, 'RELATÓRIO')

    if (!fs.existsSync(pastaRelatorio)) {
      fs.mkdirSync(pastaRelatorio, { recursive: true })
    }

    const caminho = path.join(pastaRelatorio, nomeArquivo)

    // Gera o PDF usando jsPDF (via script inline no processo principal)
    const { jsPDF } = require('jspdf')
    require('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Cabeçalho
    doc.setFillColor(123, 13, 30)
    doc.rect(0, 0, 297, 20, 'F')
    doc.setTextColor(212, 175, 55)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Fundação Lar de São Bento — Casa Dom Macário', 148.5, 8, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Relatório Semanal de Estoque · Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 148.5, 15, { align: 'center' })

    // Tabela
    doc.autoTable({
      startY: 24,
      head: [['Código', 'Nome', 'Tipo', 'Dt. Entrada', 'Qtd', 'Dt. Validade', 'Observação', 'Status']],
      body: itens.map(i => [
        i.codigoBarras || '—',
        i.nome,
        i.tipo || '—',
        i.dataEntrada ? new Date(i.dataEntrada + 'T12:00').toLocaleDateString('pt-BR') : '—',
        i.quantidade ?? '—',
        i.dataValidade ? new Date(i.dataValidade + 'T12:00').toLocaleDateString('pt-BR') : '—',
        i.observacao || '—',
        i.status || 'Original',
      ]),
      headStyles: {
        fillColor: [123, 13, 30],
        textColor: [212, 175, 55],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [245, 240, 230] },
      styles: { cellPadding: 2.5, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 55 },
        2: { cellWidth: 24 },
        3: { cellWidth: 24 },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 24 },
        6: { cellWidth: 55 },
        7: { cellWidth: 20 },
      },
    })

    // Rodapé
    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(`Página ${p} de ${totalPages}`, 148.5, 205, { align: 'center' })
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    fs.writeFileSync(caminho, pdfBuffer)

    return { ok: true, caminho }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})