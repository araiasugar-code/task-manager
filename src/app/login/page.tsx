'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUnifiedAuth as useAuth } from '@/hooks/useUnifiedAuth'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { user, signIn, signUp } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, username, displayName)
        if (error) throw error
        alert('アカウントが作成されました。確認メールをチェックしてください。')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setEmail('demo@taskmanager.com')
    setPassword('demo123')
    setLoading(true)
    setError(null)

    try {
      const { error } = await signIn('demo@taskmanager.com', 'demo123')
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              日次タスク管理システム
            </h1>
            <p className="text-slate-600">
              {isSignUp ? 'アカウントを作成' : 'ログインしてください'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                    ユーザー名
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-2">
                    表示名
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="田中太郎"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  パスワード
                </label>
                {!isSignUp && (
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                    パスワードを忘れた場合
                  </Link>
                )}
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? '処理中...' : (isSignUp ? 'アカウント作成' : 'ログイン')}
            </button>

            {/* デモログインボタン */}
            {!isSignUp && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/80 px-2 text-slate-500">または</span>
                </div>
              </div>
            )}

            {!isSignUp && (
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? '処理中...' : '🚀 デモアカウントでログイン'}
              </button>
            )}

            {/* デモアカウント情報 */}
            {!isSignUp && (
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <h4 className="text-sm font-medium text-slate-700 mb-2">デモアカウント情報</h4>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>📧 メール: demo@taskmanager.com</div>
                  <div>🔐 パスワード: demo123</div>
                  <div className="mt-2 text-slate-500">
                    ※ サンプルデータが事前設定済みです
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                {isSignUp
                  ? 'すでにアカウントをお持ちですか？ログインに戻る'
                  : 'アカウントをお持ちでない方はこちら - 新規登録'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}