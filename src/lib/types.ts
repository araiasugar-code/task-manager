export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          display_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          display_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      staff_members: {
        Row: {
          id: string
          name: string
          email?: string
          user_id?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string
          user_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          user_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          date: string
          staff_name: string
          task_name: string
          start_hour: number
          end_hour: number
          status: 'not-started' | 'progress' | 'completed' | 'pending'
          wbs_code: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          staff_name: string
          task_name: string
          start_hour: number
          end_hour: number
          status?: 'not-started' | 'progress' | 'completed' | 'pending'
          wbs_code?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          staff_name?: string
          task_name?: string
          start_hour?: number
          end_hour?: number
          status?: 'not-started' | 'progress' | 'completed' | 'pending'
          wbs_code?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Task = Database['public']['Tables']['tasks']['Row']
export type StaffMember = Database['public']['Tables']['staff_members']['Row']
export type User = Database['public']['Tables']['users']['Row']

export type TaskStatus = 'not-started' | 'progress' | 'completed' | 'pending'

export interface TaskFormData {
  staff_name: string
  task_name: string
  start_hour: number
  end_hour: number
  status?: TaskStatus
  wbs_code?: string
}

export interface AttendanceSelection {
  [staffName: string]: boolean
}