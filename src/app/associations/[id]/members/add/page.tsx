'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AddMemberPage({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    member_number: '',
    status: 'active',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has permission
      const { data: membership } = await supabase
        .from('association_members')
        .select('role')
        .eq('association_id', params.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
        setError('Du har inte behörighet att lägga till medlemmar')
        return
      }

      // Create member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          association_id: params.id,
          full_name: formData.full_name,
          email: formData.email || null,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          member_number: formData.member_number || null,
          status: formData.status as 'active' | 'inactive' | 'pending',
          notes: formData.notes || null,
          created_by: user.id
        })

      if (memberError) throw memberError

      // Redirect to members list
      router.push(`/associations/${params.id}/members`)
    } catch (err) {
      console.error('Error creating member:', err)
      setError(err instanceof Error ? err.message : 'Ett fel uppstod när medlemmen skulle läggas till')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/associations/${params.id}/members`}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Tillbaka
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Lägg till medlem
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Personuppgifter</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Fullständigt namn *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                    placeholder="Anna Andersson"
                  />
                </div>

                <div>
                  <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                    Födelsedatum
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    id="birth_date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Kontaktuppgifter</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-postadress
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                    placeholder="anna@exempel.se"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                    placeholder="070-123 45 67"
                  />
                </div>
              </div>
            </div>

            {/* Membership Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Medlemsinformation</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="member_number" className="block text-sm font-medium text-gray-700">
                    Medlemsnummer
                  </label>
                  <input
                    type="text"
                    name="member_number"
                    id="member_number"
                    value={formData.member_number}
                    onChange={(e) => setFormData({ ...formData, member_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                    placeholder="Valfritt"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="pending">Väntande</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Anteckningar
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  placeholder="Eventuella anteckningar om medlemmen..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Link
                href={`/associations/${params.id}/members`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Avbryt
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Lägger till...' : 'Lägg till medlem'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
