'use client'

import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'
import toast from 'react-hot-toast'
import { FiX, FiClock, FiBook, FiUsers, FiHome, FiMoreVertical, FiEdit2, FiTrash2, FiLoader, FiPlus, FiCalendar } from 'react-icons/fi'

type Teacher = {
  id: string
  name: string
}

type TimetableEntry = {
  id: string
  teacher_id: string
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
const TIME_SLOTS = [
  '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00'
]
const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)

const getSubjectsForGrade = (grade: string) => {
  const gradeNum = parseInt(grade.replace(/\D/g, ''))
  
  if (gradeNum <= 5) {
    return ['Urdu', 'English', 'Mathematics', 'General Science', 'Islamiat', 'Social Studies']
  } else if (gradeNum <= 8) {
    return ['Urdu', 'English', 'Mathematics', 'General Science', 'Islamiat', 'Social Studies', 'Computer Science']
  } else {
    return ['Urdu', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Islamiat', 'Pakistan Studies']
  }
}

export default function QuickTimetableEditor({ 
  teachers, 
  onUpdate 
}: { 
  teachers: Teacher[]
  onUpdate: () => void
}) {
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<string>('Monday')
  const [timetable, setTimetable] = useState<Record<string, TimetableEntry[]>>({})
  const [loading, setLoading] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState('')
  const [newEntry, setNewEntry] = useState({
    subject: '',
    class_name: '',
    room: '',
    is_break: false,
    is_free: false
  })
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)
  const [showActions, setShowActions] = useState<string | null>(null)
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])

  useEffect(() => {
    if (newEntry.class_name) {
      setAvailableSubjects(getSubjectsForGrade(newEntry.class_name))
    } else {
      setAvailableSubjects([])
    }
  }, [newEntry.class_name])

  const handleTeacherChange = async (teacherId: string) => {
    if (!teacherId) return
    
    setSelectedTeacher(teacherId)
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('teacher_timetables')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('day_of_week, start_time')

      if (error) throw error

      const groupedEntries = data.reduce((acc, entry) => {
        if (!acc[entry.day_of_week]) {
          acc[entry.day_of_week] = []
        }
        acc[entry.day_of_week].push(entry)
        return acc
      }, {} as Record<string, TimetableEntry[]>)

      setTimetable(groupedEntries)
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

  const handleCellClick = (time: string) => {
    if (!selectedTeacher) {
      toast.error('Please select a teacher first', {
        style: {
          background: '#ffebee',
          color: '#c62828',
          border: '1px solid #ef9a9a'
        }
      })
      return
    }

    const existingEntry = timetable[selectedDay]?.find(
      entry => entry.start_time === time
    )

    if (existingEntry) {
      return
    } else {
      setSelectedTime(time)
      setNewEntry({
        subject: '',
        class_name: '',
        room: '',
        is_break: false,
        is_free: false
      })
      setEditingEntry(null)
      setShowModal(true)
    }
  }

  const handleEditClick = (entry: TimetableEntry) => {
    setEditingEntry(entry)
    setNewEntry({
      subject: entry.subject,
      class_name: entry.class_name,
      room: entry.room,
      is_break: entry.is_break || false,
      is_free: entry.is_free || false
    })
    setSelectedTime(entry.start_time)
    setShowModal(true)
    setShowActions(null)
  }

  const handleDeleteClick = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        setLoading(true)
        const { error } = await supabaseAdmin
          .from('teacher_timetables')
          .delete()
          .eq('id', entryId)

        if (error) throw error

        toast.success('Entry deleted successfully', {
          style: {
            background: '#e8f5e9',
            color: '#2e7d32',
            border: '1px solid #a5d6a7'
          }
        })
        handleTeacherChange(selectedTeacher)
        onUpdate()
      } catch (error) {
        console.error('Error deleting entry:', error)
        toast.error('Failed to delete entry', {
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
    setShowActions(null)
  }

  const handleAddOrUpdateEntry = async () => {
    try {
      if (!newEntry.class_name && !newEntry.is_break && !newEntry.is_free) {
        toast.error('Please select a class or mark as break/free period', {
          style: {
            background: '#ffebee',
            color: '#c62828',
            border: '1px solid #ef9a9a'
          }
        })
        return
      }

      setModalLoading(true)

      const entryData = {
        teacher_id: selectedTeacher,
        day_of_week: selectedDay,
        start_time: selectedTime,
        end_time: `${parseInt(selectedTime.split(':')[0]) + 1}:00:00`,
        subject: newEntry.is_break ? 'Break' : newEntry.is_free ? 'Free Period' : newEntry.subject,
        class_name: newEntry.class_name,
        room: newEntry.room,
        is_break: newEntry.is_break,
        is_free: newEntry.is_free
      }

      if (editingEntry) {
        const { error } = await supabaseAdmin
          .from('teacher_timetables')
          .update(entryData)
          .eq('id', editingEntry.id)

        if (error) throw error
        
        toast.success('Entry updated successfully', {
          style: {
            background: '#e8f5e9',
            color: '#2e7d32',
            border: '1px solid #a5d6a7'
          }
        })
      } else {
        const { error } = await supabaseAdmin
          .from('teacher_timetables')
          .insert([entryData])

        if (error) throw error
        
        toast.success('Entry added successfully', {
          style: {
            background: '#e8f5e9',
            color: '#2e7d32',
            border: '1px solid #a5d6a7'
          }
        })
      }

      setShowModal(false)
      handleTeacherChange(selectedTeacher)
      onUpdate()
    } catch (error) {
      console.error('Error saving entry:', error)
      
      let errorMessage = 'Failed to save entry'
      if (error instanceof Error) {
        errorMessage = error.message
        
        if (error.message.includes('duplicate key value')) {
          errorMessage = 'This time slot is already booked'
        } else if (error.message.includes('foreign key constraint')) {
          errorMessage = 'Invalid teacher or class reference'
        }
      }

      toast.error(errorMessage, {
        style: {
          background: '#ffebee',
          color: '#c62828',
          border: '1px solid #ef9a9a'
        },
        duration: 5000
      })
    } finally {
      setModalLoading(false)
    }
  }

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${parseInt(hours)}:${minutes}`
  }

  const getEntryDisplay = (entry: TimetableEntry) => {
    if (entry.is_break) return 'Break'
    if (entry.is_free) return 'Free Period'
    return entry.subject
  }

  const getEntryClass = (entry: TimetableEntry) => {
    if (entry.is_break) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-l-4 border-yellow-500'
    if (entry.is_free) return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-l-4 border-gray-500'
    return 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border-l-4 border-indigo-500'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <label htmlFor="teacher-select" className="block text-sm font-medium text-indigo-800 mb-1">
            <span className="flex items-center">
              <FiUsers className="mr-2" />
              Select Teacher
            </span>
          </label>
          <select
            id="teacher-select"
            value={selectedTeacher}
            onChange={(e) => handleTeacherChange(e.target.value)}
            className="w-full rounded-lg border border-indigo-200 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-indigo-900 bg-white"
            disabled={loading}
          >
            <option value="">Select a teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <label htmlFor="day-select" className="block text-sm font-medium text-indigo-800 mb-1">
            <span className="flex items-center">
              <FiCalendar className="mr-2" />
              Select Day
            </span>
          </label>
          <select
            id="day-select"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full rounded-lg border border-indigo-200 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-indigo-900 bg-white"
            disabled={loading}
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col items-center">
            <FiLoader className="animate-spin h-8 w-8 text-indigo-600 mb-2" />
            <p className="text-indigo-600 font-medium">Loading timetable...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Time Slot
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {TIME_SLOTS.map((time) => {
                const entry = timetable[selectedDay]?.find(
                  (entry) => entry.start_time === time
                )

                return (
                  <tr
                    key={time}
                    className={entry ? getEntryClass(entry) : 'hover:bg-gray-50'}
                  >
                    <td 
                      onClick={() => handleCellClick(time)}
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer group"
                    >
                      <div className="flex items-center">
                        <span>{formatTimeDisplay(time)} - {formatTimeDisplay(`${parseInt(time.split(':')[0]) + 1}:00:00`)}</span>
                        {!entry && (
                          <FiPlus className="ml-2 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                        )}
                      </div>
                    </td>
                    <td 
                      onClick={() => handleCellClick(time)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                    >
                      {entry ? (
                        <span className="font-medium">{getEntryDisplay(entry)}</span>
                      ) : (
                        <span className="text-gray-400 italic">Click to add</span>
                      )}
                    </td>
                    <td 
                      onClick={() => handleCellClick(time)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                    >
                      {entry?.class_name || <span className="text-gray-400">-</span>}
                    </td>
                    <td 
                      onClick={() => handleCellClick(time)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                    >
                      {entry?.room || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 relative">
                      {entry ? (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowActions(showActions === entry.id ? null : entry.id)
                            }}
                            className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                          >
                            <FiMoreVertical />
                          </button>
                          {showActions === entry.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 ring-1 ring-black ring-opacity-5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditClick(entry)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <FiEdit2 className="mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(entry.id)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <FiTrash2 className="mr-2" />
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleCellClick(time)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <FiPlus />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center bg-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">
                {editingEntry ? 'Edit Timetable Entry' : 'Add New Timetable Entry'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white hover:text-indigo-200 transition-colors"
                disabled={modalLoading}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-3 bg-indigo-50 p-3 rounded-lg">
                <FiClock className="text-indigo-600" size={18} />
                <span className="font-medium text-indigo-800">
                  {formatTimeDisplay(selectedTime)} - {formatTimeDisplay(`${parseInt(selectedTime.split(':')[0]) + 1}:00:00`)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="inline-flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={newEntry.is_break}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      is_break: e.target.checked,
                      is_free: e.target.checked ? false : newEntry.is_free,
                      subject: '',
                      class_name: '',
                      room: ''
                    })}
                    className="form-checkbox h-5 w-5 text-yellow-500 rounded focus:ring-yellow-500"
                    disabled={modalLoading}
                  />
                  <span className="text-gray-700 font-medium">Break Period</span>
                </label>
                <label className="inline-flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={newEntry.is_free}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      is_free: e.target.checked,
                      is_break: e.target.checked ? false : newEntry.is_break,
                      subject: '',
                      class_name: '',
                      room: ''
                    })}
                    className="form-checkbox h-5 w-5 text-gray-500 rounded focus:ring-gray-500"
                    disabled={modalLoading}
                  />
                  <span className="text-gray-700 font-medium">Free Period</span>
                </label>
              </div>

              {!newEntry.is_break && !newEntry.is_free && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center">
                        <FiUsers className="mr-2 text-indigo-600" />
                        Class
                      </span>
                    </label>
                    <select
                      value={newEntry.class_name}
                      onChange={(e) => setNewEntry({
                        ...newEntry, 
                        class_name: e.target.value,
                        subject: ''
                      })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700"
                      disabled={modalLoading}
                    >
                      <option value="">Select Grade</option>
                      {GRADE_OPTIONS.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  
                  {newEntry.class_name && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        <span className="flex items-center">
                          <FiBook className="mr-2 text-indigo-600" />
                          Subject
                        </span>
                      </label>
                      <select
                        value={newEntry.subject}
                        onChange={(e) => setNewEntry({...newEntry, subject: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700"
                        disabled={modalLoading}
                      >
                        <option value="">Select Subject</option>
                        {availableSubjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center">
                        <FiHome className="mr-2 text-indigo-600" />
                        Room
                      </span>
                    </label>
                    <input
                      type="text"
                      value={newEntry.room}
                      onChange={(e) => setNewEntry({...newEntry, room: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700"
                      placeholder="Enter room number"
                      disabled={modalLoading}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 p-6 bg-gray-50 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdateEntry}
                disabled={modalLoading}
                className={`px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center ${modalLoading ? 'opacity-70' : ''}`}
              >
                {modalLoading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    {editingEntry ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  editingEntry ? 'Update Entry' : 'Save Entry'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}