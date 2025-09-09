import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AttendanceSelection } from '@/lib/types'

interface TaskStore {
  selectedDate: string
  selectedStaff: AttendanceSelection
  setSelectedDate: (date: string) => void
  setSelectedStaff: (staff: AttendanceSelection) => void
  toggleStaffSelection: (staffName: string) => void
  getSelectedStaffNames: () => string[]
  clearSelections: () => void
  removeStaffFromSelection: (staffName: string) => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      selectedDate: new Date().toISOString().split('T')[0],
      selectedStaff: {},

      setSelectedDate: (date: string) => set({ selectedDate: date }),

      setSelectedStaff: (staff: AttendanceSelection) => set({ selectedStaff: staff }),

      toggleStaffSelection: (staffName: string) => {
        const { selectedStaff } = get()
        set({
          selectedStaff: {
            ...selectedStaff,
            [staffName]: !selectedStaff[staffName]
          }
        })
      },

      getSelectedStaffNames: () => {
        const { selectedStaff } = get()
        return Object.keys(selectedStaff).filter(name => selectedStaff[name])
      },

      clearSelections: () => set({
        selectedStaff: {}
      }),

      removeStaffFromSelection: (staffName: string) => {
        const { selectedStaff } = get()
        const updatedStaff = { ...selectedStaff }
        delete updatedStaff[staffName]
        set({ selectedStaff: updatedStaff })
      }
    }),
    {
      name: 'task-store',
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        selectedStaff: state.selectedStaff
      })
    }
  )
)