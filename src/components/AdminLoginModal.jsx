import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, X, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminLoginModal({ onClose }) {
  const [senha, setSenha] = useState('')
  const [show, setShow]   = useState(false)
  const [erro, setErro]   = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const { loginAdmin } = useStore()
  const navigate = useNavigate()

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const ok = await loginAdmin(senha)
    setLoading(false)
    if (ok) {
      toast.success('Bem-vindo, Administrador!')
      navigate('/admin')
      onClose()
    } else {
      setErro('Senha incorreta.')
      setSenha('')
      inputRef.current?.focus()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(145deg, #2a0810 0%, #1a0508 100%)',
            border: '1px solid #D4AF37',
            borderRadius: 14,
            padding: '40px 44px',
            width: 380,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.15)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'none', border: 'none',
              color: '#D4AF37', cursor: 'pointer', opacity: 0.7,
            }}
          >
            <X size={18} />
          </button>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <motion.div
              animate={{ boxShadow: ['0 0 8px #D4AF37','0 0 24px #D4AF37','0 0 8px #D4AF37'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(212,175,55,0.12)',
                border: '2px solid #D4AF37',
                marginBottom: 16,
              }}
            >
              <Lock size={26} color="#D4AF37" />
            </motion.div>
            <h2 style={{
              fontFamily: 'Cinzel, serif', color: '#D4AF37',
              fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.05em',
            }}>
              Área Administrativa
            </h2>
            <p style={{ color: '#a08060', fontSize: '0.82rem', marginTop: 4 }}>
              Apenas visualização e relatórios
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <input
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Senha"
                style={{
                  width: '100%', padding: '11px 42px 11px 14px',
                  background: 'rgba(255,255,255,0.07)',
                  border: `1.5px solid ${erro ? '#ff4444' : '#8B5010'}`,
                  borderRadius: 8, color: '#F5E6C8', fontSize: '0.95rem',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e  => e.target.style.borderColor = erro ? '#ff4444' : '#8B5010'}
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#a08060', cursor: 'pointer',
                }}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {erro && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: '#ff6666', fontSize: '0.8rem', marginBottom: 12 }}
              >
                {erro}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading || !senha}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', marginTop: 16,
                padding: '12px 0',
                background: 'linear-gradient(135deg, #D4AF37, #C49B27)',
                border: 'none', borderRadius: 8,
                color: '#2a0810', fontWeight: 700, fontSize: '0.95rem',
                cursor: loading || !senha ? 'not-allowed' : 'pointer',
                opacity: !senha ? 0.6 : 1,
                fontFamily: 'Cinzel, serif', letterSpacing: '0.06em',
              }}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
