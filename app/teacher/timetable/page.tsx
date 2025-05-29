/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../src/lib/supabase'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCalendar, 
  FiClock, 
  FiChevronLeft, 
  FiChevronRight,
  FiGrid,
  FiList
} from 'react-icons/fi'

type TimetableEntry = {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
  subject: string
  class_name: string
  room: string
  is_break: boolean
  is_free: boolean
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function TeacherTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[new Date().getDay()]
  })
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    fetchTimetable()
  }, [])

  const fetchTimetable = async () => {
    try {
      setLoading(true)
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (teacherError) throw teacherError

      const { data, error } = await supabase
        .from('teacher_timetables')
        .select('*')
        .eq('teacher_id', teacherData.id)
        .order('day_of_week, start_time')

      if (error) throw error
      setTimetable(data || [])
    } catch (error) {
      console.error('Error fetching timetable:', error)
      toast.error('Failed to fetch timetable', {
        style: {
          background: '#ffebee',
          color: '#c62828',
          border: '1px solid #ef9a9a'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const getDayEntries = (day: string) => {
    return timetable
      .filter((entry) => entry.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const getEntryClass = (entry: TimetableEntry) => {
    if (entry.is_break) return 'bg-yellow-50 border-l-4 border-yellow-400'
    if (entry.is_free) return 'bg-gray-50 border-l-4 border-gray-400'
    return 'border-l-4 border-indigo-400'
  }

  const getEntryDisplay = (entry: TimetableEntry) => {
    if (entry.is_break) return 'Break'
    if (entry.is_free) return 'Free Period'
    return entry.subject
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    setIsAnimating(true)
    setTimeout(() => {
      const currentIndex = DAYS_OF_WEEK.indexOf(selectedDay)
      if (direction === 'prev') {
        const prevIndex = (currentIndex - 1 + DAYS_OF_WEEK.length) % DAYS_OF_WEEK.length
        setSelectedDay(DAYS_OF_WEEK[prevIndex])
      } else {
        const nextIndex = (currentIndex + 1) % DAYS_OF_WEEK.length
        setSelectedDay(DAYS_OF_WEEK[nextIndex])
      }
      setIsAnimating(false)
    }, 300)
  }

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
        />
      </motion.div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          My Timetable
        </h1>
        
        <div className="flex flex-wrap items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded-md flex items-center transition-all ${viewMode === 'daily' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              <FiList className="mr-1" /> Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md flex items-center transition-all ${viewMode === 'weekly' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              <FiGrid className="mr-1" /> Weekly
            </button>
          </div>
          
          {viewMode === 'daily' && (
            <motion.div 
              className="flex mt-4 sm:mt-0 items-center space-x-2 bg-white p-1 rounded-lg shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <button
                onClick={() => navigateDay('prev')}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <FiChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <motion.span 
                key={selectedDay}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-lg font-medium text-gray-800 min-w-[100px] text-center"
              >
                {selectedDay}
              </motion.span>
              <button
                onClick={() => navigateDay('next')}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <FiChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {viewMode === 'daily' ? (
        <motion.div
          key="daily-view"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white shadow-lg overflow-hidden rounded-xl"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 flex items-center">
              <FiCalendar className="mr-2 text-indigo-600" />
              {selectedDay}&apos;s Schedule
            </h3>
            <div className="text-sm text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {getDayEntries(selectedDay).length > 0 ? (
                    getDayEntries(selectedDay).map((entry) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className={`${getEntryClass(entry)} hover:shadow-md`}
                        whileHover={{ scale: 1.005 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiClock className="flex-shrink-0 mr-2 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getEntryDisplay(entry)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.class_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.room}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No classes scheduled for {selectedDay}
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="weekly-view"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white shadow-lg overflow-hidden rounded-xl"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FiCalendar className="mr-2 text-indigo-600" />
              Weekly Schedule
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {DAYS_OF_WEEK.map((day) => {
                    const dayEntries = getDayEntries(day)
                    if (dayEntries.length === 0) {
                      return (
                        <motion.tr 
                          key={day}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {day}
                          </td>
                          <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            No classes scheduled
                          </td>
                        </motion.tr>
                      )
                    }
                    return dayEntries.map((entry, index) => (
                      <motion.tr
                        key={`${day}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`${getEntryClass(entry)} hover:shadow-md`}
                        whileHover={{ scale: 1.005 }}
                      >
                        {index === 0 && (
                          <motion.td
                            rowSpan={dayEntries.length}
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                          >
                            {day}
                          </motion.td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getEntryDisplay(entry)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.class_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.room}
                        </td>
                      </motion.tr>
                    ))
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}











