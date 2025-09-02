import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const testResults: any = {}
  
  try {
    // 1. 基本的な外部API接続テスト（Google）
    try {
      const googleResponse = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      testResults.google = {
        status: googleResponse.status,
        ok: googleResponse.ok
      }
    } catch (error: any) {
      testResults.google = { error: error.message }
    }
    
    // 2. JSONPlaceholder API（一般的なテスト用API）
    try {
      const jsonResponse = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
        signal: AbortSignal.timeout(5000)
      })
      const jsonData = await jsonResponse.json()
      testResults.jsonplaceholder = {
        status: jsonResponse.status,
        ok: jsonResponse.ok,
        hasData: !!jsonData.id
      }
    } catch (error: any) {
      testResults.jsonplaceholder = { error: error.message }
    }
    
    // 3. Supabase固有のテスト
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseKey) {
        const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          signal: AbortSignal.timeout(5000)
        })
        
        testResults.supabase = {
          status: supabaseResponse.status,
          ok: supabaseResponse.ok,
          statusText: supabaseResponse.statusText,
          headers: Object.fromEntries(supabaseResponse.headers.entries())
        }
      } else {
        testResults.supabase = { error: 'Missing Supabase credentials' }
      }
    } catch (error: any) {
      testResults.supabase = { 
        error: error.message,
        cause: error.cause?.toString(),
        code: error.code
      }
    }
    
    // 4. DNS解決テスト
    testResults.environment = {
      nodeVersion: process.version,
      platform: process.platform,
      region: process.env.VERCEL_REGION || 'unknown',
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(testResults)
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Network test failed',
      message: error.message,
      testResults
    }, { status: 500 })
  }
}