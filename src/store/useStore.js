import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // ── Estado ────────────────────────────────────────────────────────────────
  itens: [],
  historico: [],
  excluidos: [],
  isAdmin: false,
  loading: false,
  lastActivity: Date.now(),

  // ── Auth ──────────────────────────────────────────────────────────────────
  loginAdmin: async (senha) => {
    const ok = await window.api.verify(senha)
    if (ok) {
      set({ isAdmin: true })
      get().refreshHistorico()
    }
    return ok
  },
  logoutAdmin: () => set({ isAdmin: false }),

  // ── Activity tracker ──────────────────────────────────────────────────────
  updateActivity: () => set({ lastActivity: Date.now() }),

  // ── Dados ─────────────────────────────────────────────────────────────────
  refreshItens: async () => {
    set({ loading: true })
    const itens = await window.api.list()
    set({ itens, loading: false })
  },

  refreshHistorico: async () => {
    const historico = await window.api.history()
    const excluidos = await window.api.deleted()
    set({ historico, excluidos })
  },

  insertBatch: async (items) => {
    const res = await window.api.insertBatch(items)
    if (res.ok) await get().refreshItens()
    return res
  },

  updateItem: async (id, changes) => {
    const res = await window.api.update(id, changes)
    if (res.ok) {
      await get().refreshItens()
      if (get().isAdmin) await get().refreshHistorico()
    }
    return res
  },

  removeItem: async (id) => {
    const res = await window.api.remove(id)
    if (res.ok) {
      await get().refreshItens()
      if (get().isAdmin) await get().refreshHistorico()
    }
    return res
  },

  exportBackup:  () => window.api.exportBackup(),
  importBackup:  async () => {
    const res = await window.api.importBackup()
    if (res.ok) {
      await get().refreshItens()
      await get().refreshHistorico()
    }
    return res
  },
}))