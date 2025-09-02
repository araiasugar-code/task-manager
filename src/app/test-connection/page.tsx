'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    const testResults: any = {}

    try {
      // 1. Supabase接続テスト
      testResults.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      testResults.mockMode = process.env.NEXT_PUBLIC_MOCK_MODE
      
      // 2. 基本的な接続テスト
      const { data: healthCheck, error: healthError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
        .single()

      testResults.healthCheck = healthError ? 
        { error: healthError.message } : 
        { success: true, data: healthCheck }

      // 3. RLSポリシーテスト
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1)

      testResults.usersTable = usersError ?
        { error: usersError.message } :
        { success: true, count: usersData?.length || 0 }

      // 4. スタッフテーブルテスト
      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select('*')
        .limit(1)

      testResults.staffTable = staffError ?
        { error: staffError.message } :
        { success: true, count: staffData?.length || 0 }

      // 5. タスクテーブルテスト
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .limit(1)

      testResults.tasksTable = tasksError ?
        { error: tasksError.message } :
        { success: true, count: tasksData?.length || 0 }

    } catch (error: any) {
      testResults.generalError = error.message
    }

    setResults(testResults)
    setLoading(false)
  }

  const testAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpass123'
      })
      
      setResults(prev => ({
        ...prev,
        authTest: error ? { error: error.message } : { success: true }
      }))
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        authTest: { error: error.message }
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Supabase接続テスト
          </h1>

          <div className="flex gap-4 mb-8">
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? '接続テスト中...' : '接続テスト実行'}
            </button>
            
            <button
              onClick={testAuth}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              認証テスト
            </button>
          </div>

          {Object.keys(results).length > 0 && (
            <div className="bg-gray-100 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">テスト結果:</h2>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 text-center">
            <a 
              href="/login" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← ログインページに戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}