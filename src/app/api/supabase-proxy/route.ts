import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || ''
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // デバッグ情報
    const debug = {
      supabaseUrl,
      supabaseUrlLength: supabaseUrl?.length,
      keyExists: !!supabaseKey,
      keyLength: supabaseKey?.length,
      endpoint,
      fullUrl: `${supabaseUrl}${endpoint}`,
      nodeVersion: process.version,
      platform: process.platform,
    }
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials',
        debug 
      }, { status: 500 })
    }
    
    // より詳細なfetch試行
    try {
      const fullUrl = `${supabaseUrl}${endpoint}`
      console.log('Attempting fetch to:', fullUrl)
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'NextJS-Vercel-Proxy/1.0',
        },
        // タイムアウトとリトライ設定
        signal: AbortSignal.timeout(10000)
      })
      
      const data = await response.text()
      console.log('Response status:', response.status)
      
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
      
    } catch (fetchError: any) {
      console.error('Fetch error details:', fetchError)
      return NextResponse.json({ 
        error: 'Fetch failed', 
        message: fetchError.message,
        cause: fetchError.cause,
        stack: fetchError.stack,
        debug
      }, { status: 500 })
    }
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'General proxy error', 
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || ''
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }
    
    const body = await request.text()
    
    const response = await fetch(`${supabaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body
    })
    
    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Proxy error', 
      message: error.message 
    }, { status: 500 })
  }
}