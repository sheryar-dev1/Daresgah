'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { UserIcon } from '@heroicons/react/24/outline'

interface TimeSlot {
  id: string
  day: string
  start_time: string
  end_time: string
  subject: string
  teacher: string
  room: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIME_SLOTS = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00'
]

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>('Monday')

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch timetable
        const { data: timetableData, error } = await supabase
          .from('timetable')
          .select('*')
          .eq('student_id', user.id)
          .order('start_time', { ascending: true })

        if (error) throw error

        if (timetableData) {
          setTimetable(timetableData as TimeSlot[])
        }
      } catch (error) {
        console.error('Error fetching timetable:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [])

  const getTimeSlotClass = (day: string, timeSlot: string) => {
    const slot = timetable.find(
      t => t.day === day && 
      `${t.start_time} - ${t.end_time}` === timeSlot
    )

    if (!slot) return 'bg-gray-50'

    return 'bg-indigo-50 hover:bg-indigo-100 cursor-pointer'
  }

  const getTimeSlotContent = (day: string, timeSlot: string) => {
    const slot = timetable.find(
      t => t.day === day && 
      `${t.start_time} - ${t.end_time}` === timeSlot
    )

    if (!slot) return null

    return (
      <div className="p-2">
        <p className="font-medium text-indigo-900">{slot.subject}</p>
        <div className="mt-1 space-y-1">
          <p className="text-xs text-indigo-700 flex items-center">
            <UserIcon className="w-3 h-3 mr-1" />
            {slot.teacher}
          </p>
          <p className="text-xs text-indigo-700">{slot.room}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Class Schedule</h1>
        <div className="flex space-x-2">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedDay === day
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          {/* Header */}
          <div className="bg-gray-50 p-4">
            <h3 className="text-sm font-medium text-gray-900">Time</h3>
          </div>
          {DAYS.map(day => (
            <div key={day} className="bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-900">{day}</h3>
            </div>
          ))}

          {/* Time Slots */}
          {TIME_SLOTS.map(timeSlot => (
            <>
              <div key={`time-${timeSlot}`} className="bg-white p-4">
                <p className="text-sm text-gray-500">{timeSlot}</p>
              </div>
              {DAYS.map(day => (
                <div
                  key={`${day}-${timeSlot}`}
                  className={`${getTimeSlotClass(day, timeSlot)} transition-colors duration-200`}
                >
                  {getTimeSlotContent(day, timeSlot)}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Legend</h3>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-indigo-50 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Class</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-50 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Free Period</span>
          </div>
        </div>
      </div>
    </div>
  )
} 