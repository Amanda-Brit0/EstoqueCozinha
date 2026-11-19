import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Pencil, Trash2, FileText, RefreshCw, Calendar } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import EditModal from '../components/EditModal'
import { gerarRelatorioEstoque } from '../utils/pdfReport'
import toast from 'react-hot-toast'

const TIPOS = ['Todos os tipos', 'Alimentício', 'Higiene', 'Limpeza', 'Descartáveis', 'Outro']

// Retorna null, 'vencendo' (≤7 dias), 'vence-hoje' ou 'vencido'
function getValidadeStatus(dataValidade) {
  if (!dataValidade) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const val = new Date(dataValidade + 'T00:00:00')
  const diffMs = val - hoje
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDias < 0) return 'vencido'
  if (diffDias === 0) return 'vence-hoje'
  if (diffDias <= 7) return 'vencendo'
  return null
}

function BadgeValidade({ status }) {
  if (!status) return null
  const cfg = {
    'vencendo':   { label: 'Vencendo',   bg: 'rgba(217,119,6,0.15)',  color: '#b45309', border: 'rgba(217,119,6,0.4)' },
    'vence-hoje': { label: 'Vence hoje', bg: 'rgba(192,57,43,0.15)',  color: '#c0392b', border: 'rgba(192,57,43,0.4)' },
    'vencido':    { label: 'Vencido',    bg: 'rgba(127,29,29,0.18)',  color: '#7f1d1d', border: 'rgba(127,29,29,0.5)' },
  }[status]
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 10,
      fontSize: '0.72rem',
      fontWeight: 700,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

export default function Listagem() {
  const navigate = useNavigate()
  const { itens, isAdmin, refreshItens, removeItem } = useStore()
  const [busca, setBusca]       = useState('')
  const [tipo, setTipo]         = useState('Todos os tipos')
  const [data, setData]         = useState('')
  const [editItem, setEditItem] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  useEffect(() => { refreshItens() }, [])

  const filtrados = itens.filter(item => {
    const q = busca.toLowerCase()
    const matchBusca = !busca || [item.nome, item.id, item.observacao, item.codigoBarras]
      .some(v => v?.toLowerCase().includes(q))
    const matchTipo = tipo === 'Todos os tipos' || item.tipo === tipo
    const matchData = !data || item.dataEntrada?.slice(0,10) === data
    return matchBusca && matchTipo && matchData
  })

  const handleDelete = async (item) => {
    const ok = window.confirm(`Excluir "${item.nome}"? O item será arquivado e não poderá ser visto na listagem, mas ficará salvo para auditoria.`)
    if (!ok) return
    setLoading(true)
    const res = await removeItem(item.id)
    setLoading(false)
    if (res.ok) toast.success(`"${item.nome}" arquivado com sucesso.`)
    else toast.error('Erro ao arquivar item.')
  }

  // Gera PDF da semana atual e salva na pasta RELATÓRIO do Desktop
  const handleRelatoriSemanal = async () => {
    const hoje = new Date()
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 }) // domingo
    const fimSemana    = endOfWeek(hoje,   { weekStartsOn: 0 }) // sábado

    const itensSemana = itens.filter(item => {
      if (!item.dataEntrada) return false
      const dt = new Date(item.dataEntrada + 'T12:00')
      return dt >= inicioSemana && dt <= fimSemana
    })

    if (itensSemana.length === 0) {
      toast.error('Nenhum item cadastrado nesta semana.')
      return
    }

    setGerandoPdf(true)
    try {
      const nomeArquivo = `relatorio-semana-${format(inicioSemana, 'dd-MM-yyyy', { locale: ptBR })}.pdf`
      const res = await window.api.salvarRelatorioSemanal(itensSemana, nomeArquivo)
      if (res.ok) {
        toast.success(`Relatório salvo em:\n${res.caminho}`, { duration: 5000 })
      } else {
        toast.error(res.error || 'Erro ao salvar relatório.')
      }
    } catch (e) {
      toast.error('Erro ao gerar relatório.')
    }
    setGerandoPdf(false)
  }

  // Colunas: Código | Nome | Tipo | Dt.Entrada | Qtd | Validade | Obs | Status | Ações
  const gridCols = '0.9fr 2fr 0.9fr 1fr 0.6fr 1fr 1.5fr 0.9fr 1.1fr'

  return (
    <Layout title="Estoque Cozinha Dom Macário">
      <div style={{ marginBottom: 28 }}>
        <p style={{
          fontFamily: 'Cinzel, serif', color: '#7B0D1E',
          fontSize: '0.78rem', letterSpacing: '0.18em',
          textTransform: 'uppercase', marginBottom: 2,
        }}>
          Fundação Lar de São Bento
        </p>
        <h1 style={{
          fontFamily: 'Cinzel, serif', color: '#4A0810',
          fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, marginBottom: 16,
        }}>
          Casa Dom Macário
        </h1>
        <h2 style={{ color: '#7B0D1E', fontWeight: 700, fontSize: '1rem' }}>
          Itens em estoque
        </h2>
      </div>

      {/* Barra de filtros */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#a08060', pointerEvents: 'none',
          }} />
          <input
            className="input-field"
            placeholder="Buscar por nome, ID, código ou observação..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>

        <input
          className="input-field"
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          style={{ width: 170 }}
        />

        <select
          className="select-field"
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          style={{ width: 160 }}
        >
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>

        {/* Botão relatório semanal — visível para todos */}
        <motion.button
          className="btn-outline"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRelatoriSemanal}
          disabled={gerandoPdf}
          style={{ gap: 7 }}
        >
          <Calendar size={15} /> {gerandoPdf ? 'Gerando...' : 'Relatório da Semana'}
        </motion.button>

        {isAdmin && (
          <motion.button
            className="btn-outline"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => gerarRelatorioEstoque(filtrados)}
            style={{ gap: 7 }}
          >
            <FileText size={15} /> Exportar PDF
          </motion.button>
        )}

        {!isAdmin && (
          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/cadastro')}
          >
            <Plus size={16} /> Cadastro
          </motion.button>
        )}

        <motion.button
          whileHover={{ rotate: 180, scale: 1.1 }}
          transition={{ duration: 0.4 }}
          onClick={refreshItens}
          style={{
            background: 'none', border: 'none',
            color: '#7B0D1E', cursor: 'pointer', padding: 6,
          }}
        >
          <RefreshCw size={18} />
        </motion.button>
      </div>

      {/* Tabela */}
      <div style={{
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          background: 'linear-gradient(90deg, #7B0D1E, #9B1D2E)',
          padding: '12px 16px',
          gap: 8,
        }}>
          {['Código', 'Nome', 'Tipo', 'Dt. Entrada', 'Qtd', 'Validade', 'Observação', 'Status', 'Ações'].map(h => (
            <span key={h} style={{
              color: '#D4AF37', fontWeight: 700,
              fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>{h}</span>
          ))}
        </div>

        {/* Linhas */}
        <AnimatePresence>
          {filtrados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '60px 0', textAlign: 'center',
                color: '#a08060', fontStyle: 'italic', fontSize: '0.95rem',
              }}
            >
              Nenhum item encontrado.
            </motion.div>
          ) : (
            filtrados.map((item, idx) => {
              const validadeStatus = getValidadeStatus(item.dataValidade)
              const rowBg = validadeStatus === 'vencido' || validadeStatus === 'vence-hoje'
                ? 'rgba(192,57,43,0.08)'
                : validadeStatus === 'vencendo'
                ? 'rgba(217,119,6,0.07)'
                : (idx % 2 === 0 ? 'transparent' : 'rgba(242,237,228,0.3)')

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ delay: idx * 0.03 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: gridCols,
                    padding: '11px 16px',
                    gap: 8,
                    alignItems: 'center',
                    borderBottom: validadeStatus
                      ? `1px solid ${validadeStatus === 'vencendo' ? 'rgba(217,119,6,0.2)' : 'rgba(192,57,43,0.2)'}`
                      : '1px solid rgba(0,0,0,0.06)',
                    fontSize: '0.85rem',
                    background: rowBg,
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{ color: '#666', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                    {item.codigoBarras || '—'}
                  </span>
                  <span style={{ fontWeight: 600, color: '#2a0810' }}>{item.nome}</span>
                  <span style={{ color: '#555' }}>{item.tipo}</span>
                  <span style={{ color: '#555' }}>
                    {item.dataEntrada
                      ? format(new Date(item.dataEntrada + 'T12:00'), 'dd/MM/yyyy', { locale: ptBR })
                      : '—'}
                  </span>
                  <span style={{ fontWeight: 700, color: '#7B0D1E', textAlign: 'center' }}>
                    {item.quantidade}
                  </span>
                  {/* Coluna Validade */}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {item.dataValidade ? (
                      <>
                        <span style={{ color: validadeStatus ? (validadeStatus === 'vencendo' ? '#b45309' : '#c0392b') : '#555', fontSize: '0.82rem', fontWeight: validadeStatus ? 600 : 400 }}>
                          {format(new Date(item.dataValidade + 'T12:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        <BadgeValidade status={validadeStatus} />
                      </>
                    ) : (
                      <span style={{ color: '#ccc', fontSize: '0.78rem' }}>—</span>
                    )}
                  </span>
                  <span style={{
                    color: '#777', fontSize: '0.8rem',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.observacao || '—'}
                  </span>
                  <span className={item.status === 'Editado' ? 'badge-editado' : 'badge-original'}>
                    {item.status}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!isAdmin && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditItem(item)}
                          style={{
                            background: 'rgba(123,13,30,0.08)', border: 'none',
                            borderRadius: 6, padding: '5px 8px', cursor: 'pointer',
                            color: '#7B0D1E', display: 'flex', alignItems: 'center',
                          }}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(item)}
                          disabled={loading}
                          style={{
                            background: 'rgba(192,57,43,0.08)', border: 'none',
                            borderRadius: 6, padding: '5px 8px', cursor: 'pointer',
                            color: '#c0392b', display: 'flex', alignItems: 'center',
                          }}
                          title="Arquivar"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </>
                    )}
                    {isAdmin && (
                      <span style={{ color: '#bbb', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        somente leitura
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {filtrados.length > 0 && (
        <p style={{ marginTop: 12, color: '#888', fontSize: '0.8rem', textAlign: 'right' }}>
          {filtrados.length} item{filtrados.length !== 1 ? 's' : ''} exibido{filtrados.length !== 1 ? 's' : ''}
        </p>
      )}

      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} />}
    </Layout>
  )
}