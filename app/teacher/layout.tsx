'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../src/context/AuthContext'

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const pathname = usePathname()
  const { signOut } = useAuth()

  useEffect(() => {
    const handleResize = () => {
      const isTabletOrMobile = window.innerWidth < 1024
      setIsMobile(isTabletOrMobile)
      if (isTabletOrMobile) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navigation = [
    { name: 'Dashboard', href: '/teacher', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Time Table', href: '/teacher/timetable', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'Attendance', href: '/teacher/attendance', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { name: 'Results', href: '/teacher/results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Salary', href: '/teacher/salary', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarOpen(!sidebarOpen)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile/tablet */}
      <div className={`fixed inset-y-0 left-0 z-50 hidden lg:block ${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-indigo-700 to-indigo-800 shadow-xl transform transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          <div className={`flex items-center justify-between h-20 px-4 border-b border-indigo-600 ${!sidebarOpen && 'justify-center'}`}>
            {sidebarOpen ? (
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-white">Teacher Portal</h1>
              </div>
            ) : (
              <button
                onClick={toggleSidebar}
                className="p-1 text-indigo-200 rounded-md hover:text-white hover:bg-indigo-600"
              >
                <svg className="w-6 h-6 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-1 text-indigo-200 rounded-md hover:text-white hover:bg-indigo-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center ${sidebarOpen ? 'px-4' : 'justify-center px-2'} py-3 text-sm font-medium rounded-lg mx-2 transition-colors duration-200 ${
                  pathname === item.href
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
                }`}
                title={sidebarOpen ? undefined : item.name}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            ))}
          </nav>

          <div className={`p-4 border-t border-indigo-600 ${!sidebarOpen && 'px-2'}`}>
            <button
              onClick={() => signOut()}
              className={`flex items-center cursor-pointer justify-center w-full ${sidebarOpen ? 'px-4' : 'px-2'} py-3 text-sm font-medium text-indigo-700 bg-white rounded-lg hover:bg-gray-100 transition-colors duration-200`}
              title={sidebarOpen ? undefined : 'Sign Out'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {sidebarOpen && <span className="ml-2">Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300 ease-in-out`}>
        <header className="sticky top-0 z-10 flex items-center justify-between h-20 px-6 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={navigation.find(item => item.href === pathname)?.icon || ''} />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800">
              {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          {/* Mobile dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute top-20 left-0 right-0 lg:hidden bg-white shadow-xl rounded-lg py-2 z-50 transform transition-all duration-200 ease-in-out border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 overflow-hidden bg-indigo-100 rounded-full">
                    <svg className="w-full h-full text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Teacher</p>
                    <p className="text-xs text-gray-500">Faculty Member</p>
                  </div>
                </div>
              </div>
              <div className="py-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsDropdownOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                      pathname === item.href
                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false)
                    signOut()
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <div className="lg:flex hidden items-center space-x-4">
            <button className="p-2 text-gray-500 rounded-full hover:text-gray-700 hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="relative">
              <button className="flex items-center space-x-2 focus:outline-none">
                <div className="w-10 h-10 overflow-hidden bg-indigo-100 rounded-full">
                  <svg className="w-full h-full text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden lg:inline">Teacher</span>
              </button>
            </div>
          </div>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="lg:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="flex-1 p-6 bg-gray-50">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 