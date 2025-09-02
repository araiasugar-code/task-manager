import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // 重複スタッフを削除
    const { data: allStaff, error: fetchError } = await supabase
      .from('staff_members')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // 重複を特定（名前またはメールが同じもの）
    const uniqueStaff: any[] = []
    const duplicateIds: string[] = []

    allStaff?.forEach(staff => {
      const isDuplicate = uniqueStaff.some(unique => 
        unique.name === staff.name || 
        (unique.email && staff.email && unique.email === staff.email)
      )
      
      if (isDuplicate) {
        duplicateIds.push(staff.id)
      } else {
        uniqueStaff.push(staff)
      }
    })

    // 重複を非アクティブ化
    if (duplicateIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('staff_members')
        .update({ is_active: false })
        .in('id', duplicateIds)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      removedDuplicates: duplicateIds.length,
      remainingStaff: uniqueStaff.length,
      staffList: uniqueStaff
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Cleanup failed', 
      message: error.message 
    }, { status: 500 })
  }
}