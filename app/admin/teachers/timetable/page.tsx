'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../src/lib/supabase'
import toast from 'react-hot-toast'
import QuickTimetableEditor from '../../../../src/components/QuickTimetableEditor'

type Teacher = {
  id: string
  name: string
}

export default function TeacherTimetablePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name')

      if (error) throw error

      setTeachers(data)
    } catch (error) {
      console.error('Error fetching teachers:', error)
      toast.error('Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading teachers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Teacher Timetable Management
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Easily manage and organize teacher schedules
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="border-b border-gray-200 pb-5 mb-6">
              <h2 className="text-lg font-semibold text-indigo-600">
                Quick Timetable Editor
              </h2>
            </div>
            <QuickTimetableEditor 
              teachers={teachers} 
              onUpdate={fetchTeachers} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}