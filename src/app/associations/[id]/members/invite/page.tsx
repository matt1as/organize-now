'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'

interface MemberImportData {
  email: string
  full_name?: string
  phone?: string
  birth_date?: string
  [key: string]: string | undefined
}

interface ImportError {
  row: number
  field: string
  message: string
}

export default function InviteMembersPage() {
  const router = useRouter()
  const supabase = createClient()
  const { id } = useParams<{ id: string }>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  
  // Single invite state
  const [singleForm, setSingleForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    birth_date: ''
  })
  
  // Bulk import state
  const [csvData, setCsvData] = useState<MemberImportData[]>([])
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [showPreview, setShowPreview] = useState(false)
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Validate phone format (Swedish)
  const isValidPhone = (phone: string) => {
    if (!phone) return true // Optional
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 8 && cleaned.length <= 15
  }

  // Validate date format
  const isValidDate = (date: string) => {
    if (!date) return true // Optional
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed < new Date()
  }

  // Handle single invitation
  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate form
      if (!singleForm.email) {
        setError('E-postadress krävs')
        setLoading(false)
        return
      }

      if (!isValidEmail(singleForm.email)) {
        setError('Ogiltig e-postadress')
        setLoading(false)
        return
      }

      // Check user permissions
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .insert({
          association_id: id,
          email: singleForm.email.toLowerCase(),
          full_name: singleForm.full_name || null,
          phone: singleForm.phone || null,
          birth_date: singleForm.birth_date || null,
          created_by: user.id
        })
        .select()
        .single()

      if (inviteError) {
        setError(inviteError.message)
        setLoading(false)
        return
      }

      // TODO: Send invitation email via Edge Function
      // For now, we'll just show the invitation link
      const inviteUrl = `${window.location.origin}/invite/${invitation.token}`
      
      setSuccess(`Inbjudan skickad till ${singleForm.email}`)
      
      // Reset form
      setSingleForm({
        email: '',
        full_name: '',
        phone: '',
        birth_date: ''
      })
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/associations/${id}/members`)
      }, 2000)
      
    } catch (err) {
      console.error('Error sending invitation:', err)
      setError('Kunde inte skicka inbjudan')
    } finally {
      setLoading(false)
    }
  }

  // Handle CSV file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportErrors([])
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as MemberImportData[]
        const errors: ImportError[] = []
        
        // Validate each row
        data.forEach((row, index) => {
          if (!row.email) {
            errors.push({
              row: index + 1,
              field: 'email',
              message: 'E-postadress saknas'
            })
          } else if (!isValidEmail(row.email)) {
            errors.push({
              row: index + 1,
              field: 'email',
              message: 'Ogiltig e-postadress'
            })
          }
          
          if (row.phone && !isValidPhone(row.phone)) {
            errors.push({
              row: index + 1,
              field: 'phone',
              message: 'Ogiltigt telefonnummer'
            })
          }
          
          if (row.birth_date && !isValidDate(row.birth_date)) {
            errors.push({
              row: index + 1,
              field: 'birth_date',
              message: 'Ogiltigt födelsedatum'
            })
          }
        })
        
        setCsvData(data)
        setImportErrors(errors)
        setShowPreview(true)
      },
      error: (error) => {
        setError(`Kunde inte läsa CSV-fil: ${error.message}`)
      }
    })
  }

  // Handle bulk import
  const handleBulkImport = async () => {
    if (importErrors.length > 0) {
      setError('Vänligen rätta till alla fel innan import')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Prepare invitations
      const invitations = csvData.map(row => ({
        association_id: id,
        email: row.email.toLowerCase(),
        full_name: row.full_name || null,
        phone: row.phone || null,
        birth_date: row.birth_date || null,
        created_by: user.id,
        member_data: row // Store all data for reference
      }))

      // Insert all invitations
      const { data, error: inviteError } = await supabase
        .from('invitations')
        .insert(invitations)
        .select()

      if (inviteError) {
        setError(`Import misslyckades: ${inviteError.message}`)
        setLoading(false)
        return
      }

      setSuccess(`${data.length} inbjudningar har skickats`)
      
      // Reset state
      setCsvData([])
      setShowPreview(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/associations/${id}/members`)
      }, 2000)
      
    } catch (err) {
      console.error('Error importing members:', err)
      setError('Import misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/associations/${id}/members`}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Tillbaka
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Bjud in medlemmar
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('single')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'single'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Enskild inbjudan
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'bulk'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Importera från CSV
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'single' ? (
                <form onSubmit={handleSingleInvite} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      E-postadress *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={singleForm.email}
                      onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      Fullständigt namn
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      value={singleForm.full_name}
                      onChange={(e) => setSingleForm({ ...singleForm, full_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Telefonnummer
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={singleForm.phone}
                      onChange={(e) => setSingleForm({ ...singleForm, phone: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                      Födelsedatum
                    </label>
                    <input
                      type="date"
                      id="birth_date"
                      value={singleForm.birth_date}
                      onChange={(e) => setSingleForm({ ...singleForm, birth_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Link
                      href={`/associations/${id}/members`}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Avbryt
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Skickar...' : 'Skicka inbjudan'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {!showPreview ? (
                    <>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          Ladda upp en CSV-fil med medlemsinformation
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="mt-2 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                        >
                          Välj CSV-fil
                        </label>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">CSV-format</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          CSV-filen måste ha följande kolumner:
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          <li><strong>email</strong> (obligatorisk)</li>
                          <li><strong>full_name</strong> (valfri)</li>
                          <li><strong>phone</strong> (valfri)</li>
                          <li><strong>birth_date</strong> (valfri, format: YYYY-MM-DD)</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Förhandsgranska import ({csvData.length} medlemmar)
                        </h3>
                        <button
                          onClick={() => {
                            setShowPreview(false)
                            setCsvData([])
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ''
                            }
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Välj annan fil
                        </button>
                      </div>

                      {importErrors.length > 0 && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-red-800 mb-2">
                            Fel hittades ({importErrors.length})
                          </h4>
                          <ul className="text-sm text-red-700 list-disc list-inside">
                            {importErrors.slice(0, 5).map((error, index) => (
                              <li key={index}>
                                Rad {error.row}: {error.field} - {error.message}
                              </li>
                            ))}
                            {importErrors.length > 5 && (
                              <li>...och {importErrors.length - 5} till</li>
                            )}
                          </ul>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                E-post
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Namn
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Telefon
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Födelsedatum
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {csvData.slice(0, 10).map((row, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {row.email}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  {row.full_name || '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  {row.phone || '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  {row.birth_date || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {csvData.length > 10 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            ...och {csvData.length - 10} till
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          onClick={() => {
                            setShowPreview(false)
                            setCsvData([])
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ''
                            }
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Avbryt
                        </button>
                        <button
                          onClick={handleBulkImport}
                          disabled={loading || importErrors.length > 0}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? 'Importerar...' : `Importera ${csvData.length} medlemmar`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
