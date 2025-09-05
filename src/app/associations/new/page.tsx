'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewAssociationPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF'
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

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

      // Generate a known ID so we don't rely on select() (which is blocked by RLS until membership exists)
      const associationId = crypto.randomUUID()

      // Create association (no returning to avoid SELECT policy requirements)
      const { error: assocError } = await supabase
        .from('associations')
        .insert({
          id: associationId,
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          created_by: user.id
        }, { returning: 'minimal' })

      if (assocError) {
        setError(assocError.message ?? 'Kunde inte skapa föreningen (behörighet eller valideringsfel).')
        return
      }

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('association_members')
        .insert({
          association_id: associationId,
          user_id: user.id,
          role: 'admin',
          status: 'active'
        }, { returning: 'minimal' })

      if (memberError) {
        console.error('Member insert error:', memberError)
        setError(memberError.message ?? 'Föreningen skapades, men kunde inte lägga till dig som administratör.')
        return
      }

      // Redirect to association page
      router.push(`/associations/${associationId}`)
    } catch (err) {
      console.error('Error creating association:', err)
      setError(err instanceof Error ? err.message : 'Ett fel uppstod när föreningen skulle skapas')
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
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Tillbaka
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Skapa ny förening
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

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Föreningens namn *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleNameChange}
className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                placeholder="t.ex. Stuvsta IF"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                URL-namn *
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                  organizenow.se/
                </span>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
className="block w-full flex-1 rounded-none rounded-r-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  placeholder="stuvsta-if"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Detta används i webbadressen till er förening
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Beskrivning
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                placeholder="Beskriv er förening..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">
                  Primärfärg
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="color"
                    name="primary_color"
                    id="primary_color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
className="h-10 w-20 rounded border border-gray-300 bg-white"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
className="block flex-1 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="secondary_color" className="block text-sm font-medium text-gray-700">
                  Sekundärfärg
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="color"
                    name="secondary_color"
                    id="secondary_color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
className="h-10 w-20 rounded border border-gray-300 bg-white"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
className="block flex-1 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500 sm:text-sm px-3 py-2"
                    placeholder="#1E40AF"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Link
                href="/dashboard"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Avbryt
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Skapar...' : 'Skapa förening'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
