'use client'

import { useState } from 'react'

export default function DebugSupabasePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testBasicFetch = async () => {
    setLoading(true)
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('Testing URL:', url)
      console.log('Key length:', key?.length)
      
      // 最もシンプルなfetchテスト
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key || '',
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        }
      })
      
      const text = await response.text()
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text,
        url: url,
        keyExists: !!key
      })
      
    } catch (error: any) {
      setResult({
        error: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabaseデバッグ</h1>
        
        <button
          onClick={testBasicFetch}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg mb-4"
        >
          {loading ? 'テスト中...' : 'シンプルフェッチテスト'}
        </button>
        
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