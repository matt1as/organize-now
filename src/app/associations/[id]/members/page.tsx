import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'

export default async function MembersListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: { q?: string }
}) {
  const { id } = use(params)
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get association details
  const { data: association } = await supabase
    .from('associations')
    .select('*')
    .eq('id', id)
    .single()

  if (!association) {
    redirect('/dashboard')
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('association_members')
    .select('*')
    .eq('association_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  // Get all members optionally filtered by search
  const q = (searchParams?.q || '').trim()
  let membersQuery = supabase
    .from('members')
    .select('*')
    .eq('association_id', id)

  if (q) {
    // Search by name, email or phone (case-insensitive)
    membersQuery = membersQuery.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    )
  }

  const { data: members } = await membersQuery.order('full_name')

  const isLeader = membership.role === 'admin' || membership.role === 'leader'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/associations/${id}`}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Tillbaka
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Medlemmar
                </h1>
                <p className="text-sm text-gray-500">
                  {association.name}
                </p>
              </div>
            </div>
            {isLeader && (
              <Link
                href={`/associations/${id}/members/invite`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Bjud in medlemmar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search and filters */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <form className="flex flex-col sm:flex-row gap-4" method="get">
              <div className="flex-1">
                <label htmlFor="q" className="sr-only">
                  Sök medlemmar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    name="q"
                    id="q"
                    defaultValue={q}
                    className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 leading-5 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 sm:text-sm"
                    placeholder="Sök efter namn, e-post eller telefon..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sök
                </button>
              </div>
            </form>
          </div>

          {/* Members list */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {members && members.length > 0 ? (
              <>
                {/* Desktop view */}
                <div className="hidden sm:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Namn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kontakt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Födelsedatum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Medlem sedan
                        </th>
                        {isLeader && (
                          <th className="relative px-6 py-3">
                            <span className="sr-only">Åtgärder</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {member.full_name}
                                </div>
                                {member.member_number && (
                                  <div className="text-sm text-gray-500">
                                    #{member.member_number}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.email || '-'}</div>
                            <div className="text-sm text-gray-500">{member.phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.birth_date ? new Date(member.birth_date).toLocaleDateString('sv-SE') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {member.status === 'active' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Aktiv
                              </span>
                            ) : member.status === 'inactive' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Inaktiv
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Väntande
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.joined_date ? new Date(member.joined_date).toLocaleDateString('sv-SE') : '-'}
                          </td>
                          {isLeader && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/associations/${id}/members/${member.id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Redigera
                              </Link>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view */}
                <ul className="divide-y divide-gray-200 sm:hidden">
                  {members.map((member) => (
                    <li key={member.id}>
                      <Link
                        href={`/associations/${id}/members/${member.id}`}
                        className="block hover:bg-gray-50 px-4 py-4"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900">
                                {member.full_name}
                              </div>
                              {member.status === 'active' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Aktiv
                                </span>
                              ) : member.status === 'inactive' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inaktiv
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Väntande
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.email || 'Ingen e-post'}
                            </div>
                            {member.phone && (
                              <div className="text-sm text-gray-500">
                                {member.phone}
                              </div>
                            )}
                          </div>
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="text-center py-12">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Inga medlemmar</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Kom igång genom att lägga till medlemmar till föreningen.
                </p>
                {isLeader && (
                  <div className="mt-6">
                    <Link
                      href={`/associations/${id}/members/invite`}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Bjud in medlemmar
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
