'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../src/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface FeeReceipt {
  id: string
  amount: number
  due_date: string
  status: 'paid' | 'pending' | 'overdue'
  payment_date?: string
  payment_method?: string
  description: string
  paid?: number
  month: string
  fine?: number
  student: {
    name: string
    grade: string
  }
}

  export default function FeeReceiptPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [receipt, setReceipt] = useState<FeeReceipt | null>(null)
  const [loading, setLoading] = useState(true)

  const calculateFine = (dueDate: string, paymentDate?: string): number => {
    if (!paymentDate) return 0
    
    const due = new Date(dueDate)
    const payment = new Date(paymentDate)
    
    if (payment <= due) return 0
    
    const daysLate = Math.floor((payment.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLate <= 7) {
      return daysLate * 60 // Rs. 60 per day for first 7 days
    } else if (daysLate <= 22) {
      return (7 * 60) + ((daysLate - 7) * 120) // Rs. 120 per day for next 15 days
    } else if (daysLate <= 29) {
      return (7 * 60) + (15 * 120) + ((daysLate - 22) * 220) // Rs. 220 per day for next 7 days
    } else {
      return (7 * 60) + (15 * 120) + (7 * 220) // Maximum fine after 29 days
    }
  }

  const amountToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const scales = ['', 'Thousand', 'Lac', 'Crore']
    
    if (num === 0) return 'Zero'
    
    const numStr = num.toString()
    const parts = []
    
    // Handle decimal part
    const [whole] = numStr.split('.')
    const wholeNum = parseInt(whole)
    
    if (wholeNum === 0) return 'Zero'
    
    // Convert whole number to words
    let current = wholeNum
    let scaleIndex = 0
    
    while (current > 0) {
      let chunk = current % 1000
      if (chunk !== 0) {
        let chunkStr = ''
        
        // Handle hundreds
        if (chunk >= 100) {
          chunkStr += ones[Math.floor(chunk / 100)] + ' Hundred '
          chunk %= 100
        }
        
        // Handle tens and ones
        if (chunk > 0) {
          if (chunk < 10) {
            chunkStr += ones[chunk]
          } else if (chunk < 20) {
            chunkStr += ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'][chunk - 10]
          } else {
            chunkStr += tens[Math.floor(chunk / 10)]
            if (chunk % 10 > 0) {
              chunkStr += ' ' + ones[chunk % 10]
            }
          }
        }
        
        if (scaleIndex > 0) {
          chunkStr += ' ' + scales[scaleIndex]
        }
        
        parts.unshift(chunkStr)
      }
      
      current = Math.floor(current / 1000)
      scaleIndex++
    }
    
    return parts.join(' ') + ' Rupees Only'
  }

  useEffect(() => {
    fetchReceipt()
  }, [params.id])

  const fetchReceipt = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get student information
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, name, grade')
        .eq('user_id', user.id)
        .single()

      if (studentError) throw studentError

      console.log('Student Data:', studentData) // Debug log

      // Get fee information
      const { data: feeData, error: feeError } = await supabase
        .from('fee_challans')
        .select('*')
        .eq('id', params.id)
        .eq('student_id', studentData.id)
        .single()

      if (feeError) throw feeError

      console.log('Fee Data:', feeData) // Debug log

      if (feeData) {
        const receiptData = {
          ...feeData,
          student: {
            name: studentData.name,
            grade: studentData.grade || 'Not Assigned' // Provide a default value if grade is undefined
          }
        }
        console.log('Receipt Data:', receiptData) // Debug log
        setReceipt(receiptData)
      }
    } catch (error) {
      console.error('Error fetching receipt:', error)
      toast.error('Error loading fee receipt')
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = async () => {
    if (!receipt) return

    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Please allow popups to download the receipt')
        return
      }

      const fineAmount = calculateFine(receipt.due_date, receipt.payment_date)
      const totalAmount = receipt.amount + fineAmount

      console.log('Current Receipt:', receipt) // Debug log

      const getSemesterOrMonthYear = () => {
        if (receipt.month && receipt.month !== '') {
          return receipt.month
        }
        const date = new Date(receipt.due_date)
        return date.toLocaleString('default', { month: 'long', year: 'numeric' })
      }

      const receiptHTML = ` 
    <!DOCTYPE html>
<html>
  <head>
    <title>Fee Receipt</title>
    <style>
      @media print {
        body, html {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
          font-size: 11px;
        }
        .container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin: 0;
          padding: 8px 8px 0 8px;
          border: 1px solid #ddd;
          min-width: 0;
        }
        .no-print {
          display: none;
        }
        .all-copies {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .section-divider {
          border-top: 2px dashed black;
          margin: 10px 0 10px 0;
          height: 0;
        }
      }
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 8px;
        color: #333;
        background: #fff;
      }
      .all-copies {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .container {
        max-width: 100%;
        margin: 0 0 8px 0;
        border: 1px solid black;
        padding: 8px 8px 0 8px;
        position: relative;
        min-width: 0;
      }
      .university-header {
        text-align: center;
        margin-bottom: 8px;
        border-bottom: 1px solid black;
        padding-bottom: 4px;
      }
           .university-header2 {
        text-align: center;
        margin-bottom: 8px;
        padding-bottom: 4px;
      }
      .university-name {
        font-size: 16px;
        font-weight: bold;
        color: black;
        margin-bottom: 2px;
      }
      .copy-label {
        text-align: right;
        font-weight: bold;
        
      
        border-radius: 2px;
        font-size: 12px;
      }
      .payment-info {
        font-weight: bold;
        padding: 4px;
        margin-bottom: 6px;
        border-radius: 3px;
        font-size: 12px;
      }
      table.info-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
      }
      table.info-table td {
        border: 1px solid black;
        padding: 4px 6px;
        font-size: 11px;
      }
      .signature {
        margin-top: 10px;
        text-align: right;
        padding-right: 20px;
        font-size: 11px;
      }
      .notes {
        font-size: 9px;
        margin-top: 0px;
        padding: 4px;
        background-color: #f9f9f9;
        border-radius: 3px;
      }
      .note {
        font-size: 12px;
        font-weight: bold;
        color: black;
        margin-top: 2px;
      }
      .print-date {
        position: absolute;
        top: 31px;
        right: 8px;
        font-size: 9px;
      }
    </style>
  </head>
  <body>
    <div class="all-copies">
      <!-- STUDENT COPY -->
      <div class="container">
        <div class="print-date">Printed Date: ${new Date().toLocaleString()}</div>
        <div class="university-header">
          <div class="university-name">Daresgah School System</div>
          <div>Phone: +92-123-456-7890</div>
             <div class="copy-label">STUDENT COPY</div>
        </div>
     
        <div class="payment-info">
          This payment can be made through following:<br>
          - Allied Bank (Any Branch)<br>
          - Bank Alfalah (Any Branch)<br>
          - Bank Islami (Any Branch)<br>
          - Digital Channels of all banks (Mobile App, Internet Banking & ATM)
        </div>
        <table class="info-table">
          <tr><td>Receipt No.</td><td>${receipt.id}</td></tr>
          <tr><td>Name</td><td>${receipt.student.name}</td></tr>
          <tr><td>Class</td><td>${receipt.student.grade || 'Not Assigned'}</td></tr>
          <tr><td>Semester / Month-Year</td><td>${getSemesterOrMonthYear()}</td></tr>
          <tr><td>Due Date</td><td>${new Date(receipt.due_date).toLocaleDateString()}</td></tr>
          <tr><td>Fine</td><td>Rs. ${fineAmount.toFixed(2)}</td></tr>
          <tr><td>Payable Amount</td><td>Rs. ${totalAmount.toFixed(2)}</td></tr>
          <tr><td>Amount in words</td><td>${amountToWords(totalAmount)}</td></tr>
        </table>
        <div class="signature">
          <p>Received By</p>
          <p>_________________________</p>
          <p>Accountant</p>
        </div>
        <div class="notes">
          <h4>Notes:</h4>
          <ul>
            <li>Dues must be paid on or before the due date to avoid late payment charges.</li>
            <li>Fine will be charged after the due date as per school rules:
              <ul>
                <li>Rs. 60/- per day for first 7 days</li>
                <li>Rs. 120/- per day for next 15 days</li>
                <li>Rs. 220/- per day for next 7 days</li>
                <li>After 29 days of due date passed, Admission will be cancelled</li>
              </ul>
            </li>
            <li>This is system generated fee challan and does not require any signature.</li>
          </ul>
        </div>
      </div>
      <div class="section-divider"></div>
      <!-- CAMPUS COPY -->
      <div class="container">
        <div class="print-date">Printed Date: ${new Date().toLocaleString()}</div>
        <div class="university-header2">
          <div class="university-name">Daresgah School System</div>
          <div>Phone: +92-123-456-7890</div>
             <div class="copy-label">CAMPUS COPY</div>
        </div>
     
        <table class="info-table">
          <tr>
            <td>Receipt No.</td><td>${receipt.id}</td>
            <td>Name</td><td>${receipt.student.name}</td>
          </tr>
          <tr>
            <td>Class</td><td>${receipt.student.grade || 'Not Assigned'}</td>
            <td>Semester / Month-Year</td><td>${getSemesterOrMonthYear()}</td>
          </tr>
          <tr>
            <td>Due Date</td><td>${new Date(receipt.due_date).toLocaleDateString()}</td>
            <td>Payable Amount</td><td>Rs. ${totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="4">Amount in words: ${amountToWords(totalAmount)}</td>
          </tr>
        </table>
        <div class="signature">
          <p>Received By</p>
          <p>_________________________</p>
          <p>Accountant</p>
        </div>
        <div>
          <p class="note">
            Fine will be charged after the due date as per BU Rule i.e. Rs.60/- per day for first 7 days, Rs.120/- per day for next 15 days
            and Rs.220/- per day for next 7 days. After 29 days of due date passed, Admission will be cancelled. (This instruction is not
            valid for new admission fee vouchers)
          </p>
        </div>
      </div>
           <div class="section-divider"></div>
      <!-- BANK COPY -->
      <div class="container">
        <div class="print-date">Printed Date: ${new Date().toLocaleString()}</div>
        <div class="university-header2">
          <div class="university-name">Daresgah School System</div>
          <div>Phone: +92-123-456-7890</div>
               <div class="copy-label">BANK COPY</div>
        </div>
       
        <table class="info-table">
          <tr>
            <td>Receipt No.</td><td>${receipt.id}</td>
            <td>Name</td><td>${receipt.student.name}</td>
          </tr>
          <tr>
            <td>Class</td><td>${receipt.student.grade || 'Not Assigned'}</td>
            <td>Semester / Month-Year</td><td>${getSemesterOrMonthYear()}</td>
          </tr>
          <tr>
            <td>Due Date</td><td>${new Date(receipt.due_date).toLocaleDateString()}</td>
            <td>Payable Amount</td><td>Rs. ${totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="4">Amount in words: ${amountToWords(totalAmount)}</td>
          </tr>
        </table>
        <div class="signature">
          <p>Received By</p>
          <p>_________________________</p>
          <p>Accountant</p>
        </div>
        <div>
          <p class="note">
            Fine will be charged after the due date as per BU Rule i.e. Rs.60/- per day for first 7 days, Rs.120/- per day for next 15 days
            and Rs.220/- per day for next 7 days. After 29 days of due date passed, Admission will be cancelled. (This instruction is not
            valid for new admission fee vouchers)
          </p>
        </div>
      </div>
    </div>
    <div class="no-print" style="text-align: center; margin-top: 10px;">
      <button onclick="window.print()" style="padding: 8px 16px; background-color: #1a5f9c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
        Print Challan
      </button>
    </div>
  </body>
</html>
      `

      // Write the HTML to the new window
      printWindow.document.write(receiptHTML)
      printWindow.document.close()

      // Wait for the content to load
      printWindow.onload = () => {
        // Automatically trigger print dialog
        printWindow.print()
      }
    } catch (error) {
      console.error('Error generating receipt:', error)
      toast.error('Error generating receipt')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-center text-gray-600">Receipt not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-50 p-6">
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-8 transition-colors duration-300"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        <span className="font-medium">Back to Fees</span>
      </button>
  
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">Payment Receipt</h1>
              <p className="text-indigo-100 mt-1">Transaction #{receipt.id}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-xs text-white/80">Issued on</p>
              <p className="text-white font-medium">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
  
        {/* Content */}
        <div className="p-8">
          {/* Student info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">Student</p>
              <p className="text-lg font-semibold text-gray-900">{receipt.student.name}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">Class</p>
              <p className="text-lg font-semibold text-gray-900">{receipt.student.grade}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  receipt.status === 'paid' ? 'bg-green-500' :
                  receipt.status === 'pending' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></span>
                <p className={`text-lg font-semibold ${
                  receipt.status === 'paid' ? 'text-green-600' :
                  receipt.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                </p>
              </div>
            </div>
          </div>
  
          {/* Payment details */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Payment Breakdown</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Fee Amount */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Tuition Fee</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-700">${receipt.amount.toFixed(2)}</p>
                  </div>
                </div>
                
                {/* Fine Amount */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Late Fine</p>
                    {receipt.fine && receipt.fine > 0 && (
                      <p className="text-xs text-red-500 mt-1">Late payment penalty</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={receipt.fine && receipt.fine > 0 ? "text-red-600" : "text-gray-700"}>
                      ${receipt.fine ? receipt.fine.toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="border-t border-gray-200 my-2"></div>
                
                {/* Total Amount */}
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="font-bold text-gray-900">Total Paid</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-600">
                      ${(receipt.amount + (receipt.fine || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              {receipt.payment_date && (
                <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Payment Date</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(receipt.payment_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
  
          {/* Total and action */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-indigo-50 rounded-xl p-6">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-indigo-600 font-medium">Total Amount Paid</p>
              <p className="text-3xl font-bold text-indigo-700">
                  ${(receipt.amount + (receipt.fine || 0)).toFixed(0)}
              </p>
              <p className="text-xs text-indigo-500 mt-1">
                {receipt.fine && receipt.fine > 0 ? `(Includes $${receipt.fine.toFixed(2)} late fee)` : '(No late fees applied)'}
              </p>
            </div>
            <button
              onClick={downloadReceipt}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              <span className="font-medium">Download Receipt</span>
            </button>
          </div>
        </div>
  
        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Thank you for your payment. For any queries, please contact support@school.edu
          </p>
        </div>
      </div>
    </div>
  </div>  
  )
} 