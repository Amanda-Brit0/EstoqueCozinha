import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import logoImg from '../assets/logos.png'

export default function Splash() {
  const navigate = useNavigate()
  const { refreshItens, logoutAdmin } = useStore()

  useEffect(() => {
    logoutAdmin()
    refreshItens()
  }, [])

  const handleEnter = () => navigate('/listagem')

  return (
    <div
      onClick={handleEnter}
      style={{
        width: '100vw', height: '100vh',
        background: 'linear-gradient(145deg, #3a0810 0%, #7B0D1E 50%, #3a0810 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
      }}
    >
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: i % 3 === 0 ? 6 : 3,
            height: i % 3 === 0 ? 6 : 3,
            borderRadius: '50%',
            background: '#D4AF37',
            left: `${8 + i * 8}%`,
            top:  `${10 + (i % 5) * 18}%`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.6, 1], y: [0, -10, 0] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}

      <motion.div
        animate={{
          boxShadow: [
            '0 0 20px rgba(212,175,55,0.4)',
            '0 0 60px rgba(212,175,55,0.9)',
            '0 0 20px rgba(212,175,55,0.4)',
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{ borderRadius: '50%', padding: 8, marginBottom: 36 }}
      >
        <img src={logoImg} alt="Logo" style={{ width: 130, height: 130, objectFit: 'contain' }} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ color: 'rgba(212,175,55,0.75)', fontFamily: 'Cinzel, serif', fontSize: '0.85rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}
      >
        Fundação Lar de São Bento
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{ color: '#D4AF37', fontFamily: 'Cinzel, serif', fontSize: '2.4rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center', marginBottom: 6 }}
      >
        Casa Dom Macário
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ color: 'rgba(245,230,200,0.7)', fontFamily: 'Cinzel, serif', fontSize: '0.9rem', letterSpacing: '0.15em', marginBottom: 60 }}
      >
        Estoque — Cozinha
      </motion.p>

      <motion.p
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        style={{ color: 'rgba(212,175,55,0.85)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}
      >
        Toque ou clique para entrar
      </motion.p>

      <motion.div
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
      />
    </div>
  )
}