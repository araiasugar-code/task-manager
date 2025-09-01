import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => ({
  start: i + 8,
  end: i + 9,
  label: `${i + 8}:00-${i + 9}:00`
}))

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'yyyy-MM-dd')
}

export function formatDisplayDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'yyyy年MM月dd日')
}

export function getHoursSpan(startHour: number, endHour: number): number {
  return endHour - startHour
}

export function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'not-started':
      return 'from-blue-500 to-blue-700'
    case 'progress':
      return 'from-orange-500 to-orange-700'
    case 'completed':
      return 'from-green-500 to-green-700'
    case 'pending':
      return 'from-red-500 to-red-700'
    default:
      return 'from-gray-500 to-gray-700'
  }
}

export function getTaskStatusText(status: string): string {
  switch (status) {
    case 'not-started':
      return '未着手'
    case 'progress':
      return '進行中'
    case 'completed':
      return '完了'
    case 'pending':
      return '保留'
    default:
      return '不明'
  }
}

export function calculateWorkingHours(tasks: any[]): number {
  return tasks.reduce((total, task) => {
    return total + (task.end_hour - task.start_hour)
  }, 0)
}

export function calculateWorkingHoursByStaff(tasks: any[]): { [staffName: string]: number } {
  const workingHours: { [staffName: string]: number } = {}
  
  tasks.forEach(task => {
    const hours = task.end_hour - task.start_hour
    if (workingHours[task.staff_name]) {
      workingHours[task.staff_name] += hours
    } else {
      workingHours[task.staff_name] = hours
    }
  })
  
  return workingHours
}

export function formatWorkingHours(hours: number): string {
  if (hours === 0) return '0時間'
  if (hours < 1) return `${Math.round(hours * 60)}分`
  
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (minutes === 0) {
    return `${wholeHours}時間`
  } else {
    return `${wholeHours}時間${minutes}分`
  }
}