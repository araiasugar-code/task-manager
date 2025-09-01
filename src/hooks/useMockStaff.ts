'use client'

import { useState, useEffect } from 'react'
import { StaffMember } from '@/lib/types'
import { mockStaff } from '@/lib/mockData'

export function useMockStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // ローカルストレージからスタッフデータを取得、なければモックデータを使用
    const storedStaff = localStorage.getItem('mock_staff')
    if (storedStaff) {
      setStaff(JSON.parse(storedStaff))
    } else {
      setStaff(mockStaff)
      localStorage.setItem('mock_staff', JSON.stringify(mockStaff))
    }
    setLoading(false)
  }, [])

  const addStaff = async (name: string) => {
    const newStaff: StaffMember = {
      id: Date.now().toString(),
      name,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updatedStaff = [...staff, newStaff]
    setStaff(updatedStaff)
    localStorage.setItem('mock_staff', JSON.stringify(updatedStaff))
    
    return { data: newStaff, error: null }
  }

  const updateStaff = async (id: string, name: string) => {
    const updatedStaff = staff.map(s => 
      s.id === id ? { ...s, name, updated_at: new Date().toISOString() } : s
    )
    
    setStaff(updatedStaff)
    localStorage.setItem('mock_staff', JSON.stringify(updatedStaff))
    
    const updatedItem = updatedStaff.find(s => s.id === id)
    return { data: updatedItem, error: null }
  }

  const deleteStaff = async (id: string) => {
    const updatedStaff = staff.filter(s => s.id !== id)
    setStaff(updatedStaff)
    localStorage.setItem('mock_staff', JSON.stringify(updatedStaff))
    
    return { error: null }
  }

  const refetch = async () => {
    // モックなので何もしない
  }

  return {
    staff,
    loading,
    error,
    addStaff,
    updateStaff,
    deleteStaff,
    refetch
  }
}