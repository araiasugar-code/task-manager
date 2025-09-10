'use client'

import React, { useState, useEffect } from 'react'
import { Task } from '@/lib/types'
import TaskTable from '@/components/TaskTable'
import { useTaskStore } from '@/stores/taskStore'

// モックデータ
const mockTasks: Task[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    staff_name: 'テストユーザー',
    task_name: 'ドラッグテスト1',
    start_hour: 9,
    end_hour: 11,
    status: 'progress',
    wbs_code: 'TEST001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2', 
    date: new Date().toISOString().split('T')[0],
    staff_name: 'テストユーザー',
    task_name: 'ドラッグテスト2',
    start_hour: 13,
    end_hour: 15,
    status: 'not-started',
    wbs_code: 'TEST002',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    date: new Date().toISOString().split('T')[0], 
    staff_name: 'テストスタッフ',
    task_name: 'ドラッグテスト3',
    start_hour: 10,
    end_hour: 12,
    status: 'completed',
    wbs_code: 'TEST003',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export default function TestDragPage() {
  const { toggleStaffSelection, getSelectedStaffNames } = useTaskStore()
  const [isClient, setIsClient] = useState(false)
  
  // クライアントサイドでのみ実行（hydration error対策）
  useEffect(() => {
    setIsClient(true)
    
    const selectedStaff = getSelectedStaffNames()
    if (!selectedStaff.includes('テストユーザー')) {
      toggleStaffSelection('テストユーザー')
    }
    if (!selectedStaff.includes('テストスタッフ')) {
      toggleStaffSelection('テストスタッフ')
    }
    
    // モックタスクをlocalStorageに設定
    localStorage.setItem('mock_tasks', JSON.stringify(mockTasks))
  }, [])
  
  // クライアントサイドでロードされるまで何も表示しない
  if (!isClient) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ドラッグ機能テストページ
          </h1>
          <p className="text-gray-600">
            タスクの左端・右端をドラッグして開始/終了時間を調整できます
          </p>
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <h2 className="font-semibold text-blue-800">操作方法:</h2>
            <ul className="text-blue-700 text-sm mt-2 space-y-1">
              <li>• タスクにマウスをホバーすると左右にドラッグハンドル（灰色のバー）が表示されます</li>
              <li>• 左のハンドル：開始時間を調整</li>
              <li>• 右のハンドル：終了時間を調整</li>
              <li>• ダブルクリック：タスク編集モーダル</li>
            </ul>
          </div>
        </div>
        
        <TaskTable />
      </div>
    </div>
  )
}