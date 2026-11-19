import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileDown, FileUp, FileText, ArrowLeft, History, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { gerarRelatorioHistorico, gerarRelatorioEstoque } from '../utils/pdfReport'
import toast from 'react-hot-toast'

const CAMPO_LABELS = {
  nome: 'Nome', tipo: 'Tipo', quantidade: 'Quantidade',
  dataEntrada: 'Data de Entrada', codigoBarras: 'Código de Barras',
  observacao: 'Observação',
}

function DiffRow({ antes, depois }) {
  const campos = ['nome','tipo','quantidade','dataEntrada','codigoBarras','observacao']
  const alterados = campos.filter(c => String(antes?.[c] ?? '') !== String(depois?.[c] ?? ''))
  if (!alterados.length) return <span style={{ color: '#aaa', fontSize: '0.78rem' }}>Sem alterações identificadas</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
      {alterados.map(c => (
        <div key={c} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', alignItems: 'center' }}>
          <span style={{ minWidth: 120, color: '#666', fontWeight: 600 }}>{CAMPO_LABELS[c] || c}:</span>
          <span style={{
            background: 'rgba(192,57,43,0.1)', color: '#c0392b',
            padding: '1px 8px', borderRadius: 4, textDecoration: 'line-through',
          }}>
            {String(antes?.[c] ?? '—')}
          </span>
          <span style={{ color: '#aaa' }}>→</span>
          <span style={{
            background: 'rgba(39,174,96,0.1)', color: '#27ae60',
            padding: '1px 8px', borderRadius: 4,
          }}>
            {String(depois?.[c] ?? '—')}
          </span>
        </div>
      ))}
    </div>
  )
}

function HistoricoCard({ registro, idx }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      style={{
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 10,
        marginBottom: 10,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: `1.5px solid ${registro.tipo === 'exclusao' ? 'rgba(192,57,43,0.25)' : 'rgba(123,13,30,0.1)'}`,
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', cursor: 'pointer',
        }}
        onClick={() => setOpen(v => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            padding: '2px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700,
            background: registro.tipo === 'exclusao' ? 'rgba(192,57,43,0.15)' : 'rgba(212,175,55,0.18)',
            color: registro.tipo === 'exclusao' ? '#c0392b' : '#8B6914',
          }}>
            {registro.tipo === 'exclusao' ? 'Exclusão' : 'Edição'}
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#2a0810' }}>
            {registro.antes?.nome || registro.id}
          </span>
          <span style={{ color: '#888', fontSize: '0.78rem' }}>
            {format(new Date(registro.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        <div style={{ color: '#aaa' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ padding: '0 18px 14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <p style={{ color: '#888', fontSize: '0.76rem', marginBottom: 6, marginTop: 10 }}>
              ID: <code style={{ background: '#f0e8d8', padding: '1px 6px', borderRadius: 4 }}>{registro.id}</code>
            </p>
            {registro.tipo === 'exclusao' ? (
              <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>
                Item arquivado. Permanece salvo para consulta na aba "Itens Arquivados".
              </p>
            ) : (
              <DiffRow antes={registro.antes} depois={registro.depois} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const { isAdmin, historico, excluidos, itens, exportBackup, importBackup, refreshHistorico } = useStore()
  const [aba, setAba] = useState('historico')

  // ── Filtro de ano para o PDF de estoque ──────────────────────────────────
  const anoAtual = new Date().getFullYear()
  const anosDisponiveis = ['Todos', ...Array.from(
    new Set(itens.map(i => i.dataEntrada ? new Date(i.dataEntrada + 'T12:00').getFullYear() : null).filter(Boolean))
  ).sort((a, b) => b - a)]
  const [anoFiltro, setAnoFiltro] = useState(String(anoAtual))

  useEffect(() => {
    if (!isAdmin) { navigate('/listagem'); return }
    refreshHistorico()
  }, [isAdmin])

  const handleExportBackup = async () => {
    const res = await exportBackup()
    if (res.ok) toast.success('Backup exportado com sucesso!')
    else if (res.ok === false) toast('Exportação cancelada.')
  }

  const handleImportBackup = async () => {
    const ok = window.confirm('Importar backup irá SUBSTITUIR todos os dados atuais. Continuar?')
    if (!ok) return
    const res = await importBackup()
    if (res.ok) toast.success('Backup importado!')
    else toast.error('Erro ao importar backup.')
  }

  const handlePdfEstoque = () => {
    const itensFiltrados = anoFiltro === 'Todos'
      ? itens
      : itens.filter(i => {
          if (!i.dataEntrada) return false
          return new Date(i.dataEntrada + 'T12:00').getFullYear() === Number(anoFiltro)
        })
    if (itensFiltrados.length === 0) {
      toast.error(`Nenhum item com data de entrada em ${anoFiltro}.`)
      return
    }
    gerarRelatorioEstoque(itensFiltrados)
  }

  const abas = [
    { id: 'historico', label: 'Histórico de alterações', icon: <History size={15} /> },
    { id: 'arquivados', label: 'Itens arquivados', icon: <Trash2 size={15} /> },
  ]

  return (
    <Layout title="Área Administrativa">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'Cinzel,serif', color: '#7B0D1E', fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Fundação Lar de São Bento
        </p>
        <h1 style={{ fontFamily: 'Cinzel,serif', color: '#4A0810', fontSize: '2rem', fontWeight: 700 }}>
          Casa Dom Macário
        </h1>
        <h2 style={{ color: '#7B0D1E', fontWeight: 700, fontSize: '1rem', marginTop: 8 }}>
          Administração — Somente leitura
        </h2>
      </div>

      {/* Ações admin */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <motion.button className="btn-outline" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/listagem')}>
          <ArrowLeft size={15} /> Ver estoque
        </motion.button>

        {/* Seletor de ano + botão PDF lado a lado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid #7B0D1E', borderRadius: 8, overflow: 'hidden' }}>
          <select
            value={anoFiltro}
            onChange={e => setAnoFiltro(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.85)',
              color: '#4A0810',
              border: 'none',
              borderRight: '1.5px solid #7B0D1E',
              padding: '7px 10px',
              fontWeight: 600,
              fontSize: '0.83rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {anosDisponiveis.map(a => (
              <option key={a} value={a}>{a === 'Todos' ? 'Todos os anos' : a}</option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handlePdfEstoque}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', color: '#7B0D1E',
              border: 'none', padding: '7px 14px',
              fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer',
            }}
          >
            <FileText size={15} /> PDF Estoque
          </motion.button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {abas.map(a => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px',
              background: aba === a.id
                ? 'linear-gradient(135deg,#7B0D1E,#9B1D2E)'
                : 'rgba(255,255,255,0.7)',
              color: aba === a.id ? '#D4AF37' : '#7B0D1E',
              border: `1.5px solid ${aba === a.id ? '#7B0D1E' : '#d0b89a'}`,
              borderRadius: 8, fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {a.icon} {a.label}
            <span style={{
              background: aba === a.id ? 'rgba(212,175,55,0.25)' : 'rgba(123,13,30,0.1)',
              color: aba === a.id ? '#D4AF37' : '#7B0D1E',
              borderRadius: 99, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 700,
            }}>
              {a.id === 'historico' ? historico.length : excluidos.length}
            </span>
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      <AnimatePresence mode="wait">
        {aba === 'historico' && (
          <motion.div key="historico"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {historico.length === 0 ? (
              <p style={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                Nenhuma alteração registrada ainda.
              </p>
            ) : (
              [...historico].reverse().map((h, i) => (
                <HistoricoCard key={`${h.id}-${h.dataHora}`} registro={h} idx={i} />
              ))
            )}
          </motion.div>
        )}

        {aba === 'arquivados' && (
          <motion.div key="arquivados"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {excluidos.length === 0 ? (
              <p style={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                Nenhum item arquivado.
              </p>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.9)', borderRadius: 12,
                overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1fr 1.1fr 0.7fr 1.5fr 1.3fr',
                  background: 'linear-gradient(90deg,#7B0D1E,#9B1D2E)',
                  padding: '10px 16px', gap: 8,
                }}>
                  {['Código','Nome','Tipo','Data Entrada','Qtd','Observação','Arquivado em'].map(h => (
                    <span key={h} style={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {excluidos.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr 1fr 1.1fr 0.7fr 1.5fr 1.3fr',
                      padding: '10px 16px', gap: 8,
                      alignItems: 'center', fontSize: '0.83rem',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(242,237,228,0.4)',
                      color: '#888',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}>{item.codigoBarras || '—'}</span>
                    <span style={{ fontWeight: 600, color: '#555', textDecoration: 'line-through' }}>{item.nome}</span>
                    <span>{item.tipo}</span>
                    <span>{item.dataEntrada ? format(new Date(item.dataEntrada + 'T12:00'), 'dd/MM/yyyy') : '—'}</span>
                    <span style={{ textAlign: 'center' }}>{item.quantidade}</span>
                    <span>{item.observacao || '—'}</span>
                    <span style={{ color: '#c0392b', fontSize: '0.76rem' }}>
                      {item.excluidoEm ? format(new Date(item.excluidoEm), 'dd/MM/yyyy HH:mm') : '—'}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}