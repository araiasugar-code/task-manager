// Supabase接続テスト
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ezhjervuafgbnlqxaykq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6aGpldnZ1YWZnYm5scXhheWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTA0MTEsImV4cCI6MjA3MjI4NjQxMX0.f4eik5qGZbdUZQXdpnB4oWLWWoPjFfOcb1L3I6KXhb0'

const supabase = createClient(supabaseUrl, supabaseKey)

// 接続テスト
async function testConnection() {
  try {
    console.log('Supabase接続テスト開始...')
    
    // 1. 基本的な接続テスト
    const { data, error } = await supabase
      .from('tasks')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('接続エラー:', error)
      return
    }
    
    console.log('✅ Supabase接続成功!')
    console.log('データベース応答:', data)
    
  } catch (err) {
    console.error('❌ 接続失敗:', err)
  }
}

testConnection()