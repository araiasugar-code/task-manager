'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'

export default function DebugStaffPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useUnifiedAuth()

  const checkStaffData = async () => {
    setLoading(true)
    try {
      // 1. 現在のスタッフを確認
      const { data: allStaff, error: staffError } = await supabase
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('created_at')

      // 2. 現在のユーザー情報
      const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email

      // 3. 現在のユーザーがスタッフにいるかチェック
      const userInStaff = allStaff?.find(s => s.name === userName || s.email === user?.email)

      setResult({
        currentUser: {
          id: user?.id,
          email: user?.email,
          display_name: user?.user_metadata?.display_name,
          calculated_name: userName
        },
        staffData: allStaff || [],
        userInStaff: userInStaff || null,
        staffError: staffError?.message || null,
        staffCount: allStaff?.length || 0
      })

    } catch (error: any) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  const addCurrentUserToStaff = async () => {
    setLoading(true)
    try {
      if (!user) {
        setResult({ error: 'No user logged in' })
        return
      }

      const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email

      const { data, error } = await supabase
        .from('staff_members')
        .insert({
          name: userName,
          email: user.email,
          user_id: user.id
        })
        .select()

      if (error) {
        setResult({ error: error.message, details: error })
      } else {
        setResult({ success: true, addedStaff: data })
        // 追加後に再チェック
        setTimeout(checkStaffData, 1000)
      }

    } catch (error: any) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">スタッフデバッグ</h1>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={checkStaffData}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {loading ? 'チェック中...' : 'スタッフデータ確認'}
          </button>
          
          <button
            onClick={addCurrentUserToStaff}
            disabled={loading || !user}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {loading ? '追加中...' : '現在のユーザーをスタッフに追加'}
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">結果:</h2>
          <pre className="text-sm overflow-auto bg-gray-100 p-4 rounded">
            {result ? JSON.stringify(result, null, 2) : 'テスト未実行'}
          </pre>
        </div>
        
        <div className="mt-4 text-center">
          <a 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← ダッシュボードに戻る
          </a>
        </div>
      </div>
    </div>
  )
}