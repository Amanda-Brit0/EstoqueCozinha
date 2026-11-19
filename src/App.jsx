import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import Splash    from './pages/Splash'
import Listagem  from './pages/Listagem'
import Cadastro  from './pages/Cadastro'
import Admin     from './pages/Admin'

function AdminRoute({ children }) {
  const isAdmin = useStore(s => s.isAdmin)
  return isAdmin ? children : <Navigate to="/listagem" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<Splash />} />
      <Route path="/listagem" element={<Listagem />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/admin"    element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  )
}