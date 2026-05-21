import { createContext, useCallback, useContext, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mj_user') || 'null') } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('mj_token') || null)

  const login = useCallback((userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('mj_user', JSON.stringify(userData))
    localStorage.setItem('mj_token', userToken)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('mj_user')
    localStorage.removeItem('mj_token')
  }, [])

  return (
    <AuthCtx.Provider value={{ user, token, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
