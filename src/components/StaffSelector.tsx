'use client'

import { useState, useEffect } from 'react'
import { useUnifiedStaff as useStaff } from '@/hooks/useUnifiedStaff'
import { useTaskStore } from '@/stores/taskStore'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'

export default function StaffSelector() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [newStaffName, setNewStaffName] = useState('')
  const [isAddingStaff, setIsAddingStaff] = useState(false)

  const { user } = useUnifiedAuth()
  const { staff, addStaff, deleteStaff, loading } = useStaff()
  const { selectedStaff, toggleStaffSelection, getSelectedStaffNames } = useTaskStore()

  const selectedCount = getSelectedStaffNames().length

  // ログインユーザーの自動選択は無効化
  // 管理者が手動で出勤者を選択する

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaffName.trim()) return

    const { error } = await addStaff(newStaffName.trim())
    if (!error) {
      setNewStaffName('')
      setIsAddingStaff(false)
    }
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    console.log(`削除ボタンクリック: ${name} (ID: ${id})`)
    
    // ログインユーザーの自己削除を防止
    const loggedInUserName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email
    if (name === loggedInUserName) {
      alert(`エラー: 自分自身（${name}）は削除できません。\n\n他のユーザーでログインしてから削除してください。`)
      console.log('自己削除を防止:', name)
      return
    }
    
    console.log('MOCK_MODE環境変数:', process.env.NEXT_PUBLIC_MOCK_MODE)
    console.log('isMockMode判定:', process.env.NEXT_PUBLIC_MOCK_MODE === 'true')
    
    if (confirm(`${name}さんを削除しますか？\n\nID: ${id}\nMOCK_MODE: ${process.env.NEXT_PUBLIC_MOCK_MODE}`)) {
      try {
        console.log('削除実行開始...')
        const result = await deleteStaff(id)
        console.log('削除結果:', result)
        
        if (result?.error) {
          alert(`削除に失敗しました: ${result.error}\n\nMOCK_MODE: ${process.env.NEXT_PUBLIC_MOCK_MODE}`)
          console.error('削除エラー:', result.error)
        } else {
          console.log(`スタッフ削除成功: ${name}`)
          // 強制的にページリロード
          setTimeout(() => window.location.reload(), 500)
        }
      } catch (err: any) {
        console.error('削除例外:', err)
        alert(`削除エラー: ${err.message}`)
      }
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 shadow-md">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">出勤者選択</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {selectedCount}名選択中
            </span>
            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {selectedCount > 0 && !isExpanded && (
          <div className="mt-2 flex flex-wrap gap-1">
            {getSelectedStaffNames().slice(0, 3).map(name => (
              <span key={name} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {name}
              </span>
            ))}
            {selectedCount > 3 && (
              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                +{selectedCount - 3}名
              </span>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-300">
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-600 py-4">読み込み中...</div>
            ) : staff.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p className="mb-2">スタッフが登録されていません</p>
                <p className="text-sm">下の「+ スタッフを追加」ボタンから登録してください</p>
              </div>
            ) : (
              staff.map((member) => {
                const loggedInUserName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || user?.email
                const isCurrentUser = member.name === loggedInUserName
                
                return (
                  <div key={member.id} className={`flex items-center justify-between group ${isCurrentUser ? 'bg-blue-50 rounded-lg p-2 border border-blue-200' : ''}`}>
                    <label className="flex items-center cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedStaff[member.name] || false}
                        onChange={() => toggleStaffSelection(member.name)}
                        className="w-4 h-4 text-blue-500 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className={`ml-3 transition-colors ${isCurrentUser ? 'text-blue-800 font-semibold' : 'text-gray-700 group-hover:text-gray-900'}`}>
                        {member.name}
                        {isCurrentUser && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            あなた
                          </span>
                        )}
                      </span>
                    </label>
                    {!isCurrentUser ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteStaff(member.id, member.name)
                        }}
                        className="opacity-60 group-hover:opacity-100 p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        title={`${member.name}を削除`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    ) : (
                      <div className="p-1 text-gray-400" title="自分自身は削除できません">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* デバッグ用クリアボタン */}
          <div className="mt-4 pt-4 border-t border-gray-300">
            <div className="space-y-2">
              <button
                onClick={() => {
                  console.log('LocalStorage before clear:', {
                    staff: localStorage.getItem('mock_staff'),
                    tasks: localStorage.getItem('mock_tasks')
                  })
                  
                  if (confirm('全てのスタッフデータとタスクデータをクリアしますか？')) {
                    localStorage.clear() // 全てのlocalStorageをクリア
                    console.log('LocalStorage cleared, reloading...')
                    window.location.reload()
                  }
                }}
                className="w-full py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded"
              >
                🗑️ 緊急: 全データクリア & リロード
              </button>
              
              <button
                onClick={() => {
                  console.log('Current localStorage:', {
                    staff: localStorage.getItem('mock_staff'),
                    tasks: localStorage.getItem('mock_tasks'),
                    deleted_staff: localStorage.getItem('deleted_staff')
                  })
                  console.log('Current staff state:', staff)
                  console.log('Environment variables:', {
                    MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE,
                    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
                  })
                  alert(`LocalStorage確認:\n\nStaff: ${staff.length}名\nDeleted: ${JSON.parse(localStorage.getItem('deleted_staff') || '[]').length}名\nMOCK_MODE: ${process.env.NEXT_PUBLIC_MOCK_MODE}\n\nコンソールで詳細確認可能`)
                }}
                className="w-full py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
              >
                🔍 デバッグ情報表示
              </button>
              
              <button
                onClick={() => {
                  if (confirm('モックモードに強制切り替えしますか？')) {
                    localStorage.setItem('force_mock_mode', 'true')
                    window.location.reload()
                  }
                }}
                className="w-full py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded"
              >
                ⚡ 強制モックモード
              </button>
            </div>
          </div>

          {/* スタッフ追加フォーム */}
          <div className="mt-2 pt-2 border-t border-gray-300">
            {isAddingStaff ? (
              <form onSubmit={handleAddStaff} className="flex gap-2">
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="スタッフ名を入力"
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingStaff(false)
                    setNewStaffName('')
                  }}
                  className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  キャンセル
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingStaff(true)}
                className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700 text-sm rounded-lg transition-colors"
              >
                + スタッフを追加
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}