import { StaffMember, Task } from './types'

export const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: '田中太郎',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: '佐藤花子',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: '山田次郎',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: '鈴木美香',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: '高橋健太',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// デモユーザー個人のタスク（モバイル表示用）
export const personalMockTasks: Task[] = [
  {
    id: 'personal-1',
    date: new Date().toISOString().split('T')[0],
    staff_name: 'demo',
    task_name: 'プロジェクト企画書作成',
    start_hour: 9,
    end_hour: 11,
    status: 'progress',
    wbs_code: 'DEMO-001',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'personal-2',
    date: new Date().toISOString().split('T')[0],
    staff_name: 'demo',
    task_name: 'チームミーティング参加',
    start_hour: 13,
    end_hour: 14,
    status: 'not-started',
    wbs_code: 'DEMO-002',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'personal-3',
    date: new Date().toISOString().split('T')[0],
    staff_name: 'demo',
    task_name: 'システム仕様書レビュー',
    start_hour: 15,
    end_hour: 17,
    status: 'completed',
    wbs_code: 'DEMO-003',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockTasks: Task[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    staff_name: '田中太郎',
    task_name: 'DB設計書作成',
    start_hour: 9,
    end_hour: 12,
    status: 'progress',
    wbs_code: 'WBS-001',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    staff_name: '佐藤花子',
    task_name: 'UI/UX設計',
    start_hour: 10,
    end_hour: 13,
    status: 'progress',
    wbs_code: 'WBS-002',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    date: new Date().toISOString().split('T')[0],
    staff_name: '田中太郎',
    task_name: 'API実装',
    start_hour: 14,
    end_hour: 17,
    status: 'not-started',
    wbs_code: 'WBS-003',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    date: new Date().toISOString().split('T')[0],
    staff_name: '山田次郎',
    task_name: 'テスト実装',
    start_hour: 11,
    end_hour: 16,
    status: 'completed',
    wbs_code: 'WBS-004',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    date: new Date().toISOString().split('T')[0],
    staff_name: '鈴木美香',
    task_name: '要件定義書レビュー',
    start_hour: 8,
    end_hour: 10,
    status: 'completed',
    wbs_code: 'WBS-005',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    date: new Date().toISOString().split('T')[0],
    staff_name: '高橋健太',
    task_name: 'インフラ設計',
    start_hour: 9,
    end_hour: 11,
    status: 'progress',
    wbs_code: 'WBS-006',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '7',
    date: new Date().toISOString().split('T')[0],
    staff_name: '佐藤花子',
    task_name: 'プロトタイプ作成',
    start_hour: 14,
    end_hour: 18,
    status: 'not-started',
    wbs_code: 'WBS-007',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '8',
    date: new Date().toISOString().split('T')[0],
    staff_name: '鈴木美香',
    task_name: 'セキュリティ検証',
    start_hour: 13,
    end_hour: 15,
    status: 'pending',
    wbs_code: 'WBS-008',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '9',
    date: new Date().toISOString().split('T')[0],
    staff_name: '高橋健太',
    task_name: 'デプロイ準備',
    start_hour: 12,
    end_hour: 14,
    status: 'not-started',
    wbs_code: 'WBS-009',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '10',
    date: new Date().toISOString().split('T')[0],
    staff_name: '田中太郎',
    task_name: 'チームミーティング',
    start_hour: 18,
    end_hour: 19,
    status: 'not-started',
    wbs_code: 'WBS-010',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// 過去の稼働実績デモデータ
export const historicalMockTasks: Task[] = [
  // 昨日のデータ
  {
    id: 'hist-1',
    date: '2025-08-31',
    staff_name: 'demo',
    task_name: 'システム設計書作成',
    start_hour: 9,
    end_hour: 12,
    status: 'completed',
    wbs_code: 'SYS-001',
    created_by: 'demo-user-id',
    created_at: '2025-08-31T09:00:00Z',
    updated_at: '2025-08-31T09:00:00Z'
  },
  {
    id: 'hist-2',
    date: '2025-08-31',
    staff_name: 'demo',
    task_name: 'データベース設計',
    start_hour: 13,
    end_hour: 17,
    status: 'completed',
    wbs_code: 'DB-001',
    created_by: 'demo-user-id',
    created_at: '2025-08-31T13:00:00Z',
    updated_at: '2025-08-31T13:00:00Z'
  },
  // 一週間前のデータ
  {
    id: 'hist-3',
    date: '2025-08-25',
    staff_name: 'demo',
    task_name: 'API開発',
    start_hour: 10,
    end_hour: 15,
    status: 'completed',
    wbs_code: 'API-001',
    created_by: 'demo-user-id',
    created_at: '2025-08-25T10:00:00Z',
    updated_at: '2025-08-25T10:00:00Z'
  },
  {
    id: 'hist-4',
    date: '2025-08-25',
    staff_name: 'demo',
    task_name: 'テスト実装',
    start_hour: 15,
    end_hour: 18,
    status: 'completed',
    wbs_code: 'TEST-001',
    created_by: 'demo-user-id',
    created_at: '2025-08-25T15:00:00Z',
    updated_at: '2025-08-25T15:00:00Z'
  },
  // 先月のデータ
  {
    id: 'hist-5',
    date: '2025-07-30',
    staff_name: 'demo',
    task_name: '要件定義書レビュー',
    start_hour: 9,
    end_hour: 11,
    status: 'completed',
    wbs_code: 'REQ-001',
    created_by: 'demo-user-id',
    created_at: '2025-07-30T09:00:00Z',
    updated_at: '2025-07-30T09:00:00Z'
  },
  {
    id: 'hist-6',
    date: '2025-07-30',
    staff_name: 'demo',
    task_name: 'プロトタイプ開発',
    start_hour: 13,
    end_hour: 18,
    status: 'completed',
    wbs_code: 'PROTO-001',
    created_by: 'demo-user-id',
    created_at: '2025-07-30T13:00:00Z',
    updated_at: '2025-07-30T13:00:00Z'
  }
]

export const mockUser = {
  id: 'demo-user-id',
  email: 'demo@taskmanager.com',
  user_metadata: {
    username: 'demo',
    display_name: 'デモユーザー'
  }
}

export const demoAccount = {
  email: 'demo@taskmanager.com',
  password: 'demo123',
  username: 'demo',
  display_name: 'デモユーザー'
}