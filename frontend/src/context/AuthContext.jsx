import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On first load, restore the session if a token exists
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/user')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const saveSession = ({ user, token }) => {
    localStorage.setItem('token', token)
    setUser(user)
  }

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password })
    saveSession(res.data)
  }

  const register = async (form) => {
    const res = await api.post('/register', form)
    saveSession(res.data)
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)