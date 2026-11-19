import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { useStore } from '../store/useStore'
import toast from 'react-hot-toast'

const TIPOS = ['Alimentício', 'Higiene', 'Limpeza', 'Outro']

export default function EditModal({ item, onClose }) {
  const { updateItem } = useStore()
  const [form, setForm] = useState({
    codigoBarras: item.codigoBarras || '',
    nome:         item.nome || '',
    tipo:         item.tipo || 'Alimentício',
    dataEntrada:  item.dataEntrada || '',
    quantidade:   item.quantidade || '',
    observacao:   item.observacao || '',
  })
  const [loading, setLoading] = useState(false)

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = async () => {
    if (!form.nome.trim()) return toast.error('Nome é obrigatório.')
    setLoading(true)
    const res = await updateItem(item.id, form)
    setLoading(false)
    if (res.ok) {
      toast.success('Item atualizado! Alteração registrada no histórico.')
      onClose()
    } else {
      toast.error(res.error || 'Erro ao atualizar.')
    }
  }

  const labelStyle = {
    display: 'block', marginBottom: 5,
    color: '#7B0D1E', fontWeight: 600, fontSize: '0.82rem',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }
  const rowStyle = { marginBottom: 16 }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 900,
        }}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: '32px 36px',
            width: 520,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: 'Cinzel,serif', color: '#7B0D1E', fontSize: '1.1rem' }}>Editar Item</h2>
              <p style={{ color: '#888', fontSize: '0.78rem', marginTop: 2 }}>
                A versão anterior será salva no histórico automaticamente.
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>
              <X size={20} />
            </button>
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Código de Barras</label>
            <input className="input-field" value={form.codigoBarras} onChange={e => set('codigoBarras', e.target.value)} />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Nome *</label>
            <input className="input-field" value={form.nome} onChange={e => set('nome', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select className="select-field" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Quantidade</label>
              <input className="input-field" type="number" min="0" value={form.quantidade} onChange={e => set('quantidade', e.target.value)} />
            </div>
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Data de Entrada</label>
            <input className="input-field" type="date" value={form.dataEntrada} onChange={e => set('dataEntrada', e.target.value)} />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Observação</label>
            <textarea
              className="input-field"
              value={form.observacao}
              onChange={e => set('observacao', e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button className="btn-outline" onClick={onClose}>Cancelar</button>
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
