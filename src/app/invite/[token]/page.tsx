'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Invitation {
  id: string
  association_id: string
  email: string
  full_name: string | null
  phone: string | null
  birth_date: string | null
  member_data: any
  status: string
  expires_at: string
}

interface Association {
  id: string
  name: string
  description: string | null
}

export default function AcceptInvitationPage() {
  const router = useRouter()
  const { token } = useParams<{ token: string }>()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [association, setAssociation] = useState<Association | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    try {
      // Fetch invitation by token
      const { data: inviteData, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single()

      if (inviteError || !inviteData) {
        setError('Inbjudan hittades inte eller är ogiltig')
        setLoading(false)
        return
      }

      // Check if invitation is valid
      if (inviteData.status !== 'pending') {
        if (inviteData.status === 'accepted') {
          setError('Denna inbjudan har redan accepterats')
        } else if (inviteData.status === 'expired') {
          setError('Denna inbjudan har gått ut')
        } else {
          setError('Denna inbjudan är inte längre giltig')
        }
        setLoading(false)
        return
      }

      // Check expiration
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('Denna inbjudan har gått ut')
        // Update status to expired
        await supabase
          .from('invitations')
          .update({ status: 'expired' })
          .eq('id', inviteData.id)
        setLoading(false)
        return
      }

      setInvitation(inviteData)

      // Pre-fill form with invitation data
      setFormData(prev => ({
        ...prev,
        email: inviteData.email,
        full_name: inviteData.full_name || inviteData.member_data?.full_name || '',
        phone: inviteData.phone || inviteData.member_data?.phone || '',
        birth_date: inviteData.birth_date || inviteData.member_data?.birth_date || ''
      }))

      // Fetch association details
      const { data: assocData } = await supabase
        .from('associations')
        .select('*')
        .eq('id', inviteData.association_id)
        .single()

      if (assocData) {
        setAssociation(assocData)
      }

    } catch (err) {
      console.error('Error loading invitation:', err)
      setError('Ett fel uppstod när inbjudan skulle laddas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invitation) return
    
    setSubmitting(true)
    setError(null)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Lösenorden matchar inte')
        setSubmitting(false)
        return
      }

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setSubmitting(false)
        return
      }

      if (!authData.user) {
        setError('Kunde inte skapa användarkonto')
        setSubmitting(false)
        return
      }

      // Create member record
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert({
          association_id: invitation.association_id,
          full_name: formData.full_name,
          email: invitation.email,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          status: 'active',
          invitation_id: invitation.id,
          joined_date: new Date().toISOString()
        })
        .select()
        .single()

      if (memberError) {
        console.error('Error creating member:', memberError)
        // Try to clean up the created user account
        try {
          // Note: This requires service role key, which client-side doesn't have
          // In production, this cleanup should be handled server-side
          setError('Ett fel uppstod vid skapande av medlemskonto. Kontakta administratören.')
          setSubmitting(false)
          return
        } catch (cleanupError) {
          console.error('Failed to cleanup after member creation error:', cleanupError)
        }
      }

      // Create association_members record linking user to association
      if (authData.user) {
        const { error: linkError } = await supabase
          .from('association_members')
          .insert({
            association_id: invitation.association_id,
            user_id: authData.user.id,
            role: 'member',
            status: 'active'
          })

        if (linkError) {
          console.error('Error linking user to association:', linkError)
          setError('Kunde inte länka användaren till föreningen. Kontakta administratören för hjälp.')
          setSubmitting(false)
          return
        }
      }

      // Update invitation status
      await supabase
        .from('invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      // Redirect to dashboard or login
      router.push('/dashboard')
      
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setError('Ett fel uppstod när inbjudan skulle accepteras')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" data-testid="loading-spinner" role="status"></div>
          <p className="mt-4 text-gray-600">Laddar inbjudan...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Ogiltig inbjudan</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Acceptera inbjudan
        </h2>
        {association && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Du har blivit inbjuden att gå med i <strong>{association.name}</strong>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-postadress
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Fullständigt namn *
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
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
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Lösenord *
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">Minst 6 tecken</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Bekräfta lösenord *
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Skapar konto...' : 'Acceptera inbjudan och skapa konto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
