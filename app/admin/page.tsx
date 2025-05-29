'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../src/lib/supabase'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

type MonthlyData = {
  month: string
  count?: number
  amount?: number
}

type FeePayment = {
  amount: number
  status: 'paid' | 'pending'
  late_fee: number
  created_at: string
}

type StudentRegistration = {
  created_at: string
}

type Stats = {
  totalTeachers: number
  totalStudents: number
  pendingRegistrations: number
  totalFeesCollected: number
  totalDues: number
  totalLateFees: number
  monthlyAdmissions: MonthlyData[]
  monthlyFees: MonthlyData[]
  feeStatus: { paid: number; pending: number }
  lateFeeTrends: MonthlyData[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTeachers: 0,
    totalStudents: 0,
    pendingRegistrations: 0,
    totalFeesCollected: 0,
    totalDues: 0,
    totalLateFees: 0,
    monthlyAdmissions: [],
    monthlyFees: [],
    feeStatus: { paid: 0, pending: 0 },
    lateFeeTrends: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [
        teachersResponse, 
        studentsResponse, 
        registrationsResponse,
        feesResponse,
        admissionsResponse
      ] = await Promise.all([
        supabase.from('teachers').select('*', { count: 'exact' }),
        supabase.from('students').select('*', { count: 'exact' }),
        supabase.from('student_registrations').select('*', { count: 'exact' }),
        supabase.from('fee_payments').select('amount, status, late_fee, created_at'),
        supabase.from('student_registrations').select('created_at')
      ])

      const feesData = feesResponse.data as FeePayment[] || []
      const admissionsData = admissionsResponse.data as StudentRegistration[] || []

      // Calculate monthly admissions
      const monthlyAdmissions = calculateMonthlyData(admissionsData, 'created_at')
      
      // Calculate monthly fees
      const monthlyFees = calculateMonthlyData(feesData, 'created_at', 'amount')
      
      // Calculate fee status
      const feeStatus = {
        paid: feesData.filter(fee => fee.status === 'paid').length,
        pending: feesData.filter(fee => fee.status === 'pending').length
      }
      
      // Calculate late fee trends
      const lateFeeTrends = calculateMonthlyData(
        feesData.filter(fee => fee.late_fee > 0),
        'created_at',
        'late_fee'
      )

      const totalFeesCollected = feesData
        .filter(fee => fee.status === 'paid')
        .reduce((sum, fee) => sum + fee.amount, 0)
      
      const totalDues = feesData
        .filter(fee => fee.status === 'pending')
        .reduce((sum, fee) => sum + fee.amount, 0)
      
      const totalLateFees = feesData
        .filter(fee => fee.status === 'paid')
        .reduce((sum, fee) => sum + (fee.late_fee || 0), 0)

      setStats({
        totalTeachers: teachersResponse.count || 0,
        totalStudents: studentsResponse.count || 0,
        pendingRegistrations: registrationsResponse.count || 0,
        totalFeesCollected,
        totalDues,
        totalLateFees,
        monthlyAdmissions,
        monthlyFees,
        feeStatus,
        lateFeeTrends
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyData = <T extends Record<string, unknown>>(
    data: T[],
    dateField: keyof T,
    amountField?: keyof T
  ): MonthlyData[] => {
    const monthlyData = data.reduce((acc, item) => {
      const date = new Date(item[dateField] as string)
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' })
      
      if (!acc[month]) {
        acc[month] = amountField ? 0 : 0
      }
      
      acc[month] += amountField ? (item[amountField] as number) : 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyData).map(([month, value]) => ({
      month,
      [amountField ? 'amount' : 'count']: value
    }))
  }

  const admissionsChartData = {
    labels: stats.monthlyAdmissions.map(item => item.month),
    datasets: [
      {
        label: 'Admissions',
        data: stats.monthlyAdmissions.map(item => item.count || 0),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  }

  const feesChartData = {
    labels: stats.monthlyFees.map(item => item.month),
    datasets: [
      {
        label: 'Fees Collected',
        data: stats.monthlyFees.map(item => item.amount || 0),
        borderColor: 'rgb(53, 162, 235)',
        tension: 0.1
      }
    ]
  }

  const lateFeesChartData = {
    labels: stats.lateFeeTrends.map(item => item.month),
    datasets: [
      {
        label: 'Late Fees',
        data: stats.lateFeeTrends.map(item => item.amount || 0),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Trends'
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Teachers Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Teachers</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalTeachers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Students Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Registrations Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Registrations</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.pendingRegistrations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Collection Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Fees Collected</dt>
                  <dd className="text-lg font-semibold text-gray-900">${stats.totalFeesCollected.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Dues Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Dues</dt>
                  <dd className="text-lg font-semibold text-gray-900">${stats.totalDues.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Late Fees Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Late Fees</dt>
                  <dd className="text-lg font-semibold text-gray-900">${stats.totalLateFees.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Admissions Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Admissions</h3>
          <div className="h-64">
            <Line options={chartOptions} data={admissionsChartData} />
          </div>
        </div>

        {/* Fees Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Fee Collection</h3>
          <div className="h-64">
            <Line options={chartOptions} data={feesChartData} />
          </div>
        </div>

        {/* Late Fees Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Late Fee Trends</h3>
          <div className="h-64">
            <Line options={chartOptions} data={lateFeesChartData} />
          </div>
        </div>

        {/* Fee Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Payment Status</h3>
          <div className="h-64">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {((stats.feeStatus.paid / (stats.feeStatus.paid + stats.feeStatus.pending)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Payment Rate</div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-lg font-semibold text-green-600">{stats.feeStatus.paid}</div>
                    <div className="text-sm text-gray-500">Paid</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">{stats.feeStatus.pending}</div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Collection Details Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fee Collection Details</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Fee Payments</h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Late Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* We'll add dynamic data here once we have the API endpoint */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Loading...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Loading...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Loading...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Loading...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 