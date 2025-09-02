'use client'

import { useState } from 'react'

export default function TestProxyPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testProxy = async () => {
    setLoading(true)
    try {
      // API Route経由でSupabaseにアクセス
      const response = await fetch('/api/supabase-proxy?endpoint=/rest/v1/', {
        method: 'GET'
      })
      
      const text = await response.text()
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        body: text,
        success: response.ok
      })
      
    } catch (error: any) {
      setResult({
        error: error.message,
        type: 'Client error'
      })
    }
    setLoading(false)
  }

  const testDirectSupabase = async () => {
    setLoading(true)
    try {
      // 直接Supabaseにアクセス（失敗するはず）
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': key || '',
          'Authorization': `Bearer ${key}`,
        }
      })
      
      const text = await response.text()
      setResult({
        type: 'Direct connection',
        status: response.status,
        body: text
      })
      
    } catch (error: any) {
      setResult({
        type: 'Direct connection failed',
        error: error.message
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">プロキシテスト</h1>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={testProxy}
            disabled={loading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {loading ? 'テスト中...' : 'プロキシ経由テスト'}
          </button>
          
          <button
            onClick={testDirectSupabase}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {loading ? 'テスト中...' : '直接接続テスト'}
          </button>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">結果:</h2>
          <pre className="text-sm overflow-auto bg-gray-100 p-4 rounded">
            {result ? JSON.stringify(result, null, 2) : 'テスト未実行'}
          </pre>
        </div>
      </div>
    </div>
  )
}