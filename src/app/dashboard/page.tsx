import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's associations
  const { data: associations } = await supabase
    .from('association_members')
    .select(`
      *,
      associations (*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">OrganizeNow</h1>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logga ut
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Välkommen {profile?.full_name || user.email}!
              </h2>
              
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Dina föreningar
                </h3>
                
                {associations && associations.length > 0 ? (
                  <div className="space-y-3">
                    {associations.map((membership) => (
                      <div
                        key={membership.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">
                              {membership.associations?.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Roll: {membership.role === 'admin' ? 'Administratör' : 
                                    membership.role === 'leader' ? 'Ledare' : 'Medlem'}
                            </p>
                          </div>
                          <Link
                            href={`/associations/${membership.association_id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Öppna →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Inga föreningar
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Du är inte medlem i någon förening ännu.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/associations/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Skapa ny förening
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Föreningar
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {associations?.length || 0}
                  </dd>
                </div>
                <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Kommande händelser
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    0
                  </dd>
                </div>
                <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Olästa meddelanden
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    0
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
