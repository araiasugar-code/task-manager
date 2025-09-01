'use client'

import { useState, useEffect } from 'react'
import { mockUser } from '@/lib/mockData'

export function useMockAuth() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ローカルストレージから認証状態を確認
    const isLoggedIn = localStorage.getItem('mock_auth') === 'true'
    
    if (isLoggedIn) {
      setUser(mockUser)
      setSession({ user: mockUser })
    }
    
    setLoading(false)
  }, [])

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    // モック認証 - 常に成功
    const user = {
      ...mockUser,
      email,
      user_metadata: { username, display_name: displayName }
    }
    
    localStorage.setItem('mock_auth', 'true')
    setUser(user)
    setSession({ user })
    
    return { data: { user }, error: null }
  }

  const signIn = async (email: string, password: string) => {
    // モック認証 - 常に成功
    const user = { ...mockUser, email }
    
    localStorage.setItem('mock_auth', 'true')
    setUser(user)
    setSession({ user })
    
    return { data: { user, session: { user } }, error: null }
  }

  const signOut = async () => {
    localStorage.removeItem('mock_auth')
    setUser(null)
    setSession(null)
    return { error: null }
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  }
}