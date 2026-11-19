import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ShieldOff } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useIdleTimer } from '../hooks/useIdleTimer'
import AdminLoginModal from './AdminLoginModal'
import logoImg from '../assets/logos.png'
import fundoImg from '../assets/fundo.jpg'

export default function Layout({ children, title }) {
  useIdleTimer()
  const navigate = useNavigate()
  const { isAdmin, logoutAdmin } = useStore()
  const [showLogin, setShowLogin] = React.useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        background: 'linear-gradient(90deg, #4A0810 0%, #7B0D1E 60%, #4A0810 100%)',
        padding: '0 28px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => navigate('/listagem')}>
          <motion.img
            src={logoImg}
            alt="Logo"
            style={{ height: 36, width: 36, objectFit: 'contain' }}
            animate={{ boxShadow: ['0 0 8px #D4AF37', '0 0 24px #D4AF37', '0 0 8px #D4AF37'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <span style={{ color: '#D4AF37', fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.04em' }}>
            {title || 'Estoque Cozinha Dom Macário'}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => isAdmin ? logoutAdmin() : setShowLogin(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 18px',
            background: isAdmin ? 'linear-gradient(135deg,#D4AF37,#C49B27)' : 'transparent',
            border: '1.5px solid #D4AF37', borderRadius: 8,
            color: isAdmin ? '#4A0810' : '#D4AF37',
            fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', letterSpacing: '0.03em',
          }}
        >
          {isAdmin ? <ShieldOff size={15} /> : <Shield size={15} />}
          {isAdmin ? 'Sair do Admin' : 'Área administrativa'}
        </motion.button>
      </header>

      <main style={{
        flex: 1,
        backgroundImage: `url(${fundoImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,237,228,0.82)', backdropFilter: 'blur(1px)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '32px 40px', minHeight: '100%' }}>
          {children}
        </div>
      </main>

      <footer style={{
        background: 'linear-gradient(90deg, #4A0810 0%, #7B0D1E 60%, #4A0810 100%)',
        textAlign: 'center', padding: '10px 0',
        color: '#D4AF37', fontSize: '0.8rem',
        fontFamily: 'Cinzel, serif', letterSpacing: '0.06em',
      }}>
        Fundação Lar de São Bento — Casa Dom Macário
      </footer>

      {showLogin && <AdminLoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}