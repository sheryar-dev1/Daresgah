/* eslint-disable react/no-unescaped-entities */
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../src/lib/supabase'
import toast from 'react-hot-toast'
import { FiCalendar, FiCheckSquare, FiAward, FiClock, FiUsers, FiBook } from 'react-icons/fi'
interface ClassSummary {
  id: string
  name: string
  totalStudents: number
  nextClass: string
  subject: string
  grade: string
}
interface UpcomingClass {
  id: string
  time: string
  class: string
  subject: string
  room: string
  day: string
  startTime: string
  endTime: string
  endTimee: string
}
interface GradeRange {
  label: string
  grades: string[]
}
export default function TeacherDashboard() {
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState('1-3')
  
  const gradeRanges: { [key: string]: GradeRange } = {
    '1-3': { label: 'Grade 1-3', grades: ['1', '2', '3'] },
    '4-6': { label: 'Grade 4-6', grades: ['4', '5', '6'] },
    '7-9': { label: 'Grade 7-9', grades: ['7', '8', '9'] },
    '10-12': { label: 'Grade 10-12', grades: ['10', '11', '12'] }
  }
  useEffect(() => {
    fetchClassSummaries()
    fetchUpcomingClasses()
  }, [selectedRange])
  const fetchClassSummaries = async () => {
    try {
      setLoading(true)
      // Get current teacher's ID
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()
      if (teacherError) throw teacherError
      
      const selectedGrades = gradeRanges[selectedRange].grades
      
      // Get student counts for each grade in the selected range
      const summariesPromises = selectedGrades.map(async (grade) => {
        const { count, error: countError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('grade', grade)
        if (countError) throw countError
        
        // Get subject for this grade from teacher's timetable
        const { data: timetableData, error: timetableError } = await supabase
          .from('teacher_timetables')
          .select('subject')
          .eq('teacher_id', teacherData.id)
          .eq('class_name', `Grade ${grade}`)
          .limit(1)
        if (timetableError) throw timetableError
        
        return {
          id: `grade-${grade}`,
          name: `Grade ${grade}`,
          totalStudents: count || 0,
          nextClass: timetableData?.[0]?.subject || 'No Class',
          subject: timetableData?.[0]?.subject || 'No Subject',
          grade: `Grade ${grade}`
        }
      })
      
      const classSummariesWithCounts = await Promise.all(summariesPromises)
      setClassSummaries(classSummariesWithCounts)
    } catch (error) {
      console.error('Error fetching class summaries:', error)
      toast.error('Failed to fetch class summaries')
    } finally {
      setLoading(false)
    }
  }
  const fetchUpcomingClasses = async () => {
    try {
      setLoading(true)
      // Get current teacher's ID
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()
      if (teacherError) throw teacherError
      
      // Get current day and time
      const now = new Date()
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false })
      
      // First try to get today's upcoming classes
      const { data: initialTodayClasses, error: todayError } = await supabase
        .from('teacher_timetables')
        .select('*')
        .eq('teacher_id', teacherData.id)
        .eq('day_of_week', currentDay)
        .gte('start_time', currentTime)
        .order('start_time')
      if (todayError) throw todayError
      
      // If we don't have enough classes today, get classes from next days
      let finalClasses = initialTodayClasses || []
      if (finalClasses.length < 3) {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const currentDayIndex = daysOfWeek.indexOf(currentDay)
        
        // Get next days' classes
        const { data: futureClasses, error: futureError } = await supabase
          .from('teacher_timetables')
          .select('*')
          .eq('teacher_id', teacherData.id)
          .in('day_of_week', daysOfWeek.slice(currentDayIndex + 1))
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true })
        if (futureError) throw futureError
        
        // Combine today's and future classes
        finalClasses = [...finalClasses, ...(futureClasses || [])]
        // Take only first 3 classes
        finalClasses = finalClasses.slice(0, 3)
      }
      
      // Transform the data to match the UpcomingClass interface
      const transformedClasses = finalClasses.map(entry => ({
        id: entry.id,
        time: `${formatTime(entry.start_time)}`,
        endTimee: `${formatEndTime(entry.end_time)}`,
        class: entry.class_name,
        subject: entry.subject,
        room: entry.room,
        day: entry.day_of_week,
        startTime: entry.start_time,
        endTime: entry.end_time
      }))
      
      setUpcomingClasses(transformedClasses)
    } catch (error) {
      console.error('Error fetching upcoming classes:', error)
      toast.error('Failed to fetch upcoming classes')
    } finally {
      setLoading(false)
    }
  }
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }
  const formatEndTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }
  
  const getDayColor = (day: string) => {
    const colors: Record<string, string> = {
      Monday: 'bg-blue-100 text-blue-800',
      Tuesday: 'bg-purple-100 text-purple-800',
      Wednesday: 'bg-green-100 text-green-800',
      Thursday: 'bg-yellow-100 text-yellow-800',
      Friday: 'bg-red-100 text-red-800',
      Saturday: 'bg-indigo-100 text-indigo-800',
      Sunday: 'bg-gray-100 text-gray-800'
    }
    return colors[day] || 'bg-gray-100 text-gray-800'
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your daily overview</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="1-3">Grade 1-3</option>
            <option value="4-6">Grade 4-6</option>
            <option value="7-9">Grade 7-9</option>
            <option value="10-12">Grade 10-12</option>
          </select>
          
          <div className="flex gap-3">
            <Link
              href="/teacher/attendance"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              <FiCheckSquare className="h-4 w-4" />
              <span>Attendance</span>
            </Link>
            
            <Link
              href="/teacher/results"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              <FiAward className="h-4 w-4" />
              <span>Results</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Class Summary Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Class Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classSummaries.map((classSummary) => (
            <div key={classSummary.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${classSummary.totalStudents > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                    <FiUsers className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{classSummary.name}</h3>
                    <p className="text-sm text-gray-500">{classSummary.subject}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{classSummary.totalStudents}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">Next Class</p>
                    <p className="text-lg font-semibold text-indigo-600">{classSummary.nextClass}</p>
                  </div>
                </div>
              </div>
              
              <Link 
                href={`/teacher/attendance?class=${encodeURIComponent(classSummary.name)}`}
                className="block bg-gray-50 px-6 py-3 text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-gray-100 transition-colors"
              >
                View Class Details →
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {/* Upcoming Classes */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm sm:text-xl font-semibold text-gray-800">Upcoming Classes</h2>
          <Link 
            href="/teacher/timetable" 
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <FiCalendar className="h-4 w-4" />
            View Full Timetable
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hidden sm:block">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : upcomingClasses.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {upcomingClasses.map((classItem) => (
                <li key={classItem.id} className="hover:bg-gray-50 transition-colors">
                  <div className="px-6 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-2 rounded-lg ${getDayColor(classItem.day)}`}>
                          {/* <p className="text-sm font-medium">{classItem.day.substring(0, 3)}</p> */}
                          <p className="text-sm font-medium">{classItem.day}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <FiClock className="h-4 w-4 text-gray-400" />
                            <p className="text-sm font-medium text-gray-900">{classItem.time}</p>
                            <p className="text-sm font-medium text-gray-900"> - </p>
                            <p className="text-sm font-medium text-gray-900">{classItem.endTimee}</p>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mt-1">
                            {classItem.class} - {classItem.subject}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Room: {classItem.room}
                          </p>
                        </div>
                      </div>
                      
                      <Link
                        href={`/teacher/attendance?class=${encodeURIComponent(classItem.class)}&time=${classItem.startTime}`}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap"
                      >
                        Prepare Class
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center">
              <FiBook className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No upcoming classes</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any classes scheduled in the near future.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/teacher/timetable"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                <FiCalendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">View Timetable</h3>
                <p className="text-sm text-gray-500">Check your weekly schedule</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/teacher/attendance"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                <FiCheckSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Mark Attendance</h3>
                <p className="text-sm text-gray-500">Record student attendance</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/teacher/results"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                <FiAward className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Add Results</h3>
                <p className="text-sm text-gray-500">Enter student grades</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}