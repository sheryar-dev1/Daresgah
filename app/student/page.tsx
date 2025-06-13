import React from 'react'
import Link from 'next/link'
import { 
  BookOpen, 
  GraduationCap, 

  Clock,
  DollarSign,

  ChevronRight
} from 'lucide-react'

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      {/* <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between h-full px-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-blue-600">Student Portal</h1>
          </div>
          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-gray-600 hover:text-blue-600">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-gray-700">John Doe</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Sidebar */}
      {/* <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200">
        <nav className="p-4">
          <a href="#" className="flex items-center px-4 py-3 text-blue-600 bg-blue-50 rounded-lg mb-2">
            <Home className="h-5 w-5 mr-3" />
            Dashboard
          </a>
          <Link href="/student/profile" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg mb-2">
            <User className="h-5 w-5 mr-3" />
            Profile
          </Link>
          <Link href="/student/timetable" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg mb-2">
            <Calendar className="h-5 w-5 mr-3" />
            Timetable
          </Link>
          <Link href="/student/results" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg mb-2">
            <GraduationCap className="h-5 w-5 mr-3" />
            Results
          </Link>
          <Link href="/student/attendance" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg mb-2">
            <Clock className="h-5 w-5 mr-3" />
            Attendance
          </Link>
          <Link href="/student/fees" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg mb-2">
            <DollarSign className="h-5 w-5 mr-3" />
            Fees
          </Link>
          <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg mb-2">
            <FileText className="h-5 w-5 mr-3" />
            Documents
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </a>
        </nav>
      </div> */}

      {/* Main Content */}
      <div className=" pt-20 p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, John!</h1>
          <p className="text-gray-600">Here&apos;s your academic overview for today.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance</p>
                <h3 className="text-2xl font-bold text-gray-900">85%</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CGPA</p>
                <h3 className="text-2xl font-bold text-gray-900">3.8</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Courses</p>
                <h3 className="text-2xl font-bold text-gray-900">6</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fees Due</p>
                <h3 className="text-2xl font-bold text-gray-900">$0</h3>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Schedule</h3>
              <Link href="/student/timetable" className="text-blue-600 text-sm flex items-center">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Mathematics</h4>
                  <p className="text-sm text-gray-600">9:00 AM - 10:30 AM</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Physics</h4>
                  <p className="text-sm text-gray-600">11:00 AM - 12:30 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Results</h3>
              <Link href="/student/results" className="text-blue-600 text-sm flex items-center">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Mathematics Midterm</h4>
                  <p className="text-sm text-gray-600">March 15, 2024</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">A</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Physics Quiz</h4>
                  <p className="text-sm text-gray-600">March 10, 2024</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">B+</span>
              </div>
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h3>
              <a href="#" className="text-blue-600 text-sm flex items-center">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Math Project</h4>
                  <p className="text-sm text-gray-600">Due in 2 days</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Urgent</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Physics Lab Report</h4>
                  <p className="text-sm text-gray-600">Due in 5 days</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Pending</span>
              </div>
            </div>
          </div>

          {/* Fee Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Fee Status</h3>
              <Link href="/student/fees" className="text-blue-600 text-sm flex items-center">
                View Details <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Tuition Fee</h4>
                  <p className="text-sm text-gray-600">Spring 2024</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Paid</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Lab Fee</h4>
                  <p className="text-sm text-gray-600">Spring 2024</p>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
