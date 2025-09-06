'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  association_id: string
  full_name: string
  email: string | null
  phone: string | null
  birth_date: string | null
  member_number: string | null
  status: 'active' | 'inactive' | 'pending'
  guardian_id: string | null
  joined_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  custom_fields: any
  consents: any
  invitation_id: string | null
}

interface Guardian {
  id: string
  full_name: string
  email: string | null
  phone: string | null
}

interface ActivityItem {
  id: string
  action: string
  created_at: string
  old_data: any
  new_data: any
}

interface Association {
  id: string
  name: string
}

export default function MemberDetailPage() {
  const router = useRouter()
  const { id: associationId, memberId } = useParams<{ id: string, memberId: string }>()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<Member | null>(null)
  const [guardian, setGuardian] = useState<Guardian | null>(null)
  const [association, setAssociation] = useState<Association | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLeader, setIsLeader] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    member_number: '',
    notes: '',
    status: 'active' as 'active' | 'inactive' | 'pending'
  })

  useEffect(() => {
    if (associationId && memberId) {
      loadMemberData()
    }
  }, [associationId, memberId])

  const loadMemberData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is a leader/admin of this association
      const { data: membership } = await supabase
        .from('association_members')
        .select('role')
        .eq('association_id', associationId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!membership) {
        setError('Du har inte behörighet att visa denna medlem')
        return
      }

      setIsLeader(membership.role === 'admin' || membership.role === 'leader')

      // Get association details
      const { data: assocData } = await supabase
        .from('associations')
        .select('id, name')
        .eq('id', associationId)
        .single()

      if (assocData) {
        setAssociation(assocData)
      }

      // Get member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .eq('association_id', associationId)
        .single()

      if (memberError || !memberData) {
        setError('Medlem hittades inte')
        return
      }

      setMember(memberData)
      
      // Initialize edit form with current data
      setEditForm({
        full_name: memberData.full_name || '',
        email: memberData.email || '',
        phone: memberData.phone || '',
        birth_date: memberData.birth_date || '',
        member_number: memberData.member_number || '',
        notes: memberData.notes || '',
        status: memberData.status || 'active'
      })

      // Get guardian info if member has one
      if (memberData.guardian_id) {
        const { data: guardianData } = await supabase
          .from('members')
          .select('id, full_name, email, phone')
          .eq('id', memberData.guardian_id)
          .single()

        if (guardianData) {
          setGuardian(guardianData)
        }
      }

      // Get activity log
      const { data: activityData } = await supabase
        .from('audit_log')
        .select('id, action, created_at, old_data, new_data')
        .eq('entity_type', 'member')
        .eq('entity_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (activityData) {
        setActivities(activityData)
      }

    } catch (err) {
      console.error('Error loading member data:', err)
      setError('Ett fel uppstod när medlemsdata skulle laddas')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!member || !isLeader) return

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('members')
        .update({
          full_name: editForm.full_name,
          email: editForm.email || null,
          phone: editForm.phone || null,
          birth_date: editForm.birth_date || null,
          member_number: editForm.member_number || null,
          notes: editForm.notes || null,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Reload member data
      await loadMemberData()
      setIsEditing(false)

    } catch (err) {
      console.error('Error saving member:', err)
      setError('Ett fel uppstod när medlemmen skulle sparas')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!member) return

    // Reset form to current member data
    setEditForm({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      birth_date: member.birth_date || '',
      member_number: member.member_number || '',
      notes: member.notes || '',
      status: member.status || 'active'
    })
    setIsEditing(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('sv-SE')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800', 
      pending: 'bg-yellow-100 text-yellow-800'
    }
    
    const labels = {
      active: 'Aktiv',
      inactive: 'Inaktiv',
      pending: 'Väntande'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar medlemsuppgifter...</p>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Ett fel uppstod</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <div className="mt-6">
              <Link
                href={`/associations/${associationId}/members`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Tillbaka till medlemslistan
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/associations/${associationId}/members`}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Tillbaka
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {member.full_name}
                </h1>
                {association && (
                  <p className="text-sm text-gray-500">
                    {association.name}
                  </p>
                )}
              </div>
            </div>
            {isLeader && (
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Sparar...' : 'Spara'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Redigera
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Info Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Personal Information */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Personuppgifter
                  </h3>
                  
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Fullständigt namn *
                        </label>
                        <input
                          type="text"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          E-postadress
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Telefonnummer
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Födelsedatum
                        </label>
                        <input
                          type="date"
                          value={editForm.birth_date}
                          onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Medlemsnummer
                        </label>
                        <input
                          type="text"
                          value={editForm.member_number}
                          onChange={(e) => setEditForm({ ...editForm, member_number: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="active">Aktiv</option>
                          <option value="inactive">Inaktiv</option>
                          <option value="pending">Väntande</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Namn</dt>
                        <dd className="mt-1 text-sm text-gray-900">{member.full_name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">E-post</dt>
                        <dd className="mt-1 text-sm text-gray-900">{member.email || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                        <dd className="mt-1 text-sm text-gray-900">{member.phone || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Födelsedatum</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(member.birth_date)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Medlemsnummer</dt>
                        <dd className="mt-1 text-sm text-gray-900">{member.member_number || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1">{getStatusBadge(member.status)}</dd>
                      </div>
                    </dl>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Anteckningar
                  </h3>
                  
                  {isEditing ? (
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={4}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Lägg till anteckningar om medlemmen..."
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {member.notes || 'Inga anteckningar'}
                    </p>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Aktivitetshistorik
                  </h3>
                  
                  {activities.length > 0 ? (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {activities.map((activity, index) => (
                          <li key={activity.id}>
                            <div className="relative pb-8">
                              {index !== activities.length - 1 && (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                              )}
                              <div className="relative flex space-x-3">
                                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      {activity.action}
                                    </p>
                                  </div>
                                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                    {formatDate(activity.created_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Ingen aktivitet registrerad</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Info */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Medlemsinfo
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gick med</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(member.joined_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Senast uppdaterad</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(member.updated_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Guardian Info */}
              {guardian && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Vårdnadshavare
                    </h3>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {guardian.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{guardian.full_name}</p>
                        <p className="text-sm text-gray-500">{guardian.email || guardian.phone || 'Ingen kontaktinfo'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
