import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckCircle, ArrowLeft, Barcode } from 'lucide-react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'

const TIPOS = ['Alimentício', 'Higiene', 'Limpeza', 'Descartáveis', 'Outro']
const TODAY = new Date().toISOString().slice(0, 10)

function emptyRow() {
  return {
    _key:         Math.random().toString(36).slice(2),
    codigoBarras: '',
    nome:         '',
    tipo:         'Alimentício',
    dataEntrada:  TODAY,
    quantidade:   '',
    dataValidade: '',
    observacao:   '',
  }
}

export default function Cadastro() {
  const navigate = useNavigate()
  const { insertBatch } = useStore()
  const [rows, setRows]       = useState([emptyRow()])
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef({})

  const FIELD_ORDER = ['codigoBarras', 'nome', 'tipo', 'dataEntrada', 'quantidade', 'dataValidade', 'observacao']

  const focusNext = useCallback((rowKey, currentField) => {
    const idx = FIELD_ORDER.indexOf(currentField)
    if (idx < FIELD_ORDER.length - 1) {
      inputRefs.current[rowKey]?.[FIELD_ORDER[idx + 1]]?.focus()
    } else {
      setRows(prev => {
        const rowIdx = prev.findIndex(r => r._key === rowKey)
        let next = prev[rowIdx + 1]
        if (!next) {
          next = emptyRow()
          const updated = [...prev, next]
          setTimeout(() => inputRefs.current[next._key]?.codigoBarras?.focus(), 50)
          return updated
        }
        setTimeout(() => inputRefs.current[next._key]?.codigoBarras?.focus(), 20)
        return prev
      })
    }
  }, [])

  // Busca nome no catálogo ao sair do campo (onBlur) ou ao pressionar Enter
  // Se não achar, deixa em branco para preenchimento manual
  // O nome digitado manualmente fica salvo no catálogo para próximas vezes
  const handleBarcodeLeave = async (rowKey, barcode) => {
    if (!barcode.trim()) return
    const nome = await window.api.catalogGet(barcode)
    if (nome) {
      setRows(prev => prev.map(r => r._key === rowKey ? { ...r, nome } : r))
      toast.success(`"${nome}"`, { duration: 2000, icon: '✔' })
    }
    // Se não achou, foca no campo nome para preenchimento manual
    inputRefs.current[rowKey]?.nome?.focus()
  }

  const updateRow = (key, field, value) => {
    setRows(prev => prev.map(r => r._key === key ? { ...r, [field]: value } : r))
  }

  const addRow = () => {
    const r = emptyRow()
    setRows(prev => [...prev, r])
    setTimeout(() => inputRefs.current[r._key]?.codigoBarras?.focus(), 50)
  }

  const removeRow = (key) => {
    setRows(prev => prev.length === 1 ? [emptyRow()] : prev.filter(r => r._key !== key))
  }

  const handleSubmit = async () => {
    const valid = rows.filter(r => r.nome.trim())
    if (valid.length === 0) {
      toast.error('Adicione pelo menos um item com nome.')
      return
    }
    setLoading(true)
    const res = await insertBatch(valid.map(({ _key, ...r }) => r))
    setLoading(false)
    if (res.ok) {
      toast.success(`${valid.length} item${valid.length > 1 ? 's' : ''} cadastrado${valid.length > 1 ? 's' : ''}!`)
      navigate('/listagem')
    } else {
      toast.error('Erro ao cadastrar itens.')
    }
  }

  const setRef = (key, field) => el => {
    if (!inputRefs.current[key]) inputRefs.current[key] = {}
    inputRefs.current[key][field] = el
  }

  const thStyle = {
    color: '#D4AF37', fontWeight: 700,
    fontSize: '0.75rem', letterSpacing: '0.05em',
    textTransform: 'uppercase', padding: '10px 8px', textAlign: 'left',
  }

  const gridCols = '150px 1fr 120px 130px 70px 130px 1fr 40px'

  return (
    <Layout title="Cadastro de Itens">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'Cinzel,serif', color: '#7B0D1E', fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Fundação Lar de São Bento
        </p>
        <h1 style={{ fontFamily: 'Cinzel,serif', color: '#4A0810', fontSize: '2rem', fontWeight: 700 }}>
          Casa Dom Macário
        </h1>
        <h2 style={{ color: '#7B0D1E', fontWeight: 700, fontSize: '1rem', marginTop: 8 }}>
          Cadastro de itens (planilha)
        </h2>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        marginBottom: 20,
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          background: 'linear-gradient(90deg,#7B0D1E,#9B1D2E)',
          gap: 4, padding: '0 8px',
        }}>
          {['Cód. Barras', 'Nome', 'Tipo', 'Dt. Entrada', 'Qtd', 'Dt. Validade', 'Observações', ''].map(h => (
            <span key={h} style={thStyle}>{h}</span>
          ))}
        </div>

        {/* Linhas */}
        <AnimatePresence initial={false}>
          {rows.map((row, idx) => (
            <motion.div
              key={row._key}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: 4, padding: '6px 8px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                alignItems: 'center',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(242,237,228,0.4)',
              }}
            >
              {/* Código de Barras */}
              <div style={{ position: 'relative' }}>
                <Barcode size={13} style={{
                  position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                  color: '#aaa', pointerEvents: 'none',
                }} />
                <input
                  ref={setRef(row._key, 'codigoBarras')}
                  className="input-field"
                  style={{ paddingLeft: 26, fontSize: '0.82rem', padding: '7px 7px 7px 26px' }}
                  placeholder="Escaneie aqui..."
                  value={row.codigoBarras}
                  onChange={e => updateRow(row._key, 'codigoBarras', e.target.value)}
                  onBlur={e => handleBarcodeLeave(row._key, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleBarcodeLeave(row._key, row.codigoBarras)
                    }
                  }}
                />
              </div>

              {/* Nome */}
              <input
                ref={setRef(row._key, 'nome')}
                className="input-field"
                style={{ fontSize: '0.82rem', padding: '7px' }}
                placeholder="Nome do item"
                value={row.nome}
                onChange={e => updateRow(row._key, 'nome', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), focusNext(row._key, 'nome'))}
              />

              {/* Tipo */}
              <select
                ref={setRef(row._key, 'tipo')}
                className="select-field"
                style={{ fontSize: '0.82rem', padding: '7px 28px 7px 7px' }}
                value={row.tipo}
                onChange={e => updateRow(row._key, 'tipo', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), focusNext(row._key, 'tipo'))}
              >
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>

              {/* Data Entrada */}
              <input
                ref={setRef(row._key, 'dataEntrada')}
                className="input-field"
                type="date"
                style={{ fontSize: '0.82rem', padding: '7px' }}
                value={row.dataEntrada}
                onChange={e => updateRow(row._key, 'dataEntrada', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), focusNext(row._key, 'dataEntrada'))}
              />

              {/* Quantidade */}
              <input
                ref={setRef(row._key, 'quantidade')}
                className="input-field"
                type="number"
                min="0"
                style={{ fontSize: '0.82rem', padding: '7px', textAlign: 'center' }}
                placeholder="0"
                value={row.quantidade}
                onChange={e => updateRow(row._key, 'quantidade', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), focusNext(row._key, 'quantidade'))}
              />

              {/* Data Validade */}
              <input
                ref={setRef(row._key, 'dataValidade')}
                className="input-field"
                type="date"
                style={{ fontSize: '0.82rem', padding: '7px' }}
                value={row.dataValidade}
                onChange={e => updateRow(row._key, 'dataValidade', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), focusNext(row._key, 'dataValidade'))}
              />

              {/* Observação */}
              <input
                ref={setRef(row._key, 'observacao')}
                className="input-field"
                style={{ fontSize: '0.82rem', padding: '7px' }}
                placeholder="Observação"
                value={row.observacao}
                onChange={e => updateRow(row._key, 'observacao', e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const isLast = idx === rows.length - 1
                    if (isLast) addRow()
                    else {
                      const next = rows[idx + 1]
                      setTimeout(() => inputRefs.current[next._key]?.codigoBarras?.focus(), 20)
                    }
                  }
                }}
              />

              {/* Remover */}
              <motion.button
                whileHover={{ scale: 1.15, color: '#c0392b' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeRow(row._key)}
                style={{
                  background: 'none', border: 'none',
                  color: '#ccc', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 4,
                }}
              >
                <Trash2 size={15} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <motion.button
          className="btn-outline"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={addRow}
        >
          <Plus size={15} /> Adicionar linha
        </motion.button>

        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button
            className="btn-outline"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/listagem')}
          >
            <ArrowLeft size={15} /> Voltar à listagem
          </motion.button>

          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            <CheckCircle size={16} />
            {loading ? 'Cadastrando...' : 'Efetuar cadastro'}
          </motion.button>
        </div>
      </div>
    </Layout>
  )
}