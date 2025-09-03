'use client'

import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { mockUser } from '@/lib/mockData'

// 認証は環境変数に従う
const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export function useUnifiedAuth() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isMockMode) {
      // モックモード - ローカルストレージから認証状態を確認
      const isLoggedIn = localStorage.getItem('mock_auth') === 'true'
      
      if (isLoggedIn) {
        setUser(mockUser)
        setSession({ user: mockUser })
      }
      
      setLoading(false)
    } else {
      // 実際のSupabase認証
      let mounted = true

      async function getInitialSession() {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }

      getInitialSession()

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      })

      return () => {
        mounted = false
        subscription?.unsubscribe()
      }
    }
  }, [])

  const signUp = async (email: string, password: string, options?: { display_name?: string; username?: string }) => {
    const { display_name: displayName, username } = options || {}
    if (isMockMode) {
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
    } else {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              display_name: displayName
            }
          }
        })

        if (error) throw error

        // Create user profile in the users table
        if (data.user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              username,
              display_name: displayName
            })

          if (profileError) {
            console.error('Error creating user profile:', profileError)
          }
        }

        return { data, error: null }
      } catch (error: any) {
        return { data: null, error: error.message || '登録に失敗しました' }
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (isMockMode) {
      // モック認証 - 常に成功
      const user = { ...mockUser, email }
      
      localStorage.setItem('mock_auth', 'true')
      setUser(user)
      setSession({ user })
      
      return { data: { user, session: { user } }, error: null }
    } else {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
        return { data, error: null }
      } catch (error: any) {
        return { data: null, error: error.message || 'ログインに失敗しました' }
      }
    }
  }

  const signOut = async () => {
    if (isMockMode) {
      localStorage.removeItem('mock_auth')
      setUser(null)
      setSession(null)
      return { error: null }
    } else {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        return { error: null }
      } catch (error: any) {
        return { error: error.message || 'ログアウトに失敗しました' }
      }
    }
  }

  const resetPassword = async (email: string) => {
    if (isMockMode) {
      // モックモード - 常に成功を返す
      return { data: null, error: null }
    } else {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        })
        
        if (error) throw error
        return { data, error: null }
      } catch (error: any) {
        return { data: null, error: error.message || 'パスワードリセットに失敗しました' }
      }
    }
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  }
}