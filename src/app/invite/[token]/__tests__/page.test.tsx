import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelfRegistrationPage from '../page'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock the Supabase client
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

describe('SelfRegistrationPage', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  }

  const mockSearchParams = {
    get: jest.fn(),
  }

  const mockInvitation = {
    id: 'invitation-id',
    association_id: 'association-id',
    member_data: {
      email: 'test@example.com',
      full_name: 'Test User',
      phone: '123456789',
    },
    status: 'pending',
    associations: {
      name: 'Test Association',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseRouter.mockReturnValue(mockRouter as any)
    mockUseSearchParams.mockReturnValue(mockSearchParams as any)
    mockSearchParams.get.mockReturnValue('test-token')

    const mockSupabaseInstance = {
      auth: {
        signUp: jest.fn(),
      },
      from: jest.fn((table: string) => {
        const mockQuery = {
          select: jest.fn(() => mockQuery),
          eq: jest.fn(() => mockQuery),
          single: jest.fn(() => {
            if (table === 'invitations') {
              return Promise.resolve({ data: mockInvitation, error: null })
            }
            return Promise.resolve({ data: null, error: null })
          }),
          insert: jest.fn(() => mockQuery),
          update: jest.fn(() => mockQuery),
        }
        return mockQuery
      }),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)
  })

  it('renders registration form with pre-filled data', async () => {
    render(<SelfRegistrationPage />)

    await waitFor(() => {
      expect(screen.getByText('Slutför registrering')).toBeInTheDocument()
      expect(screen.getByText('Test Association')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument()
    })
  })

  it('shows error for invalid token', async () => {
    const mockSupabaseInstance = {
      auth: {
        signUp: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Invalid token' } })),
          })),
        })),
      })),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    render(<SelfRegistrationPage />)

    await waitFor(() => {
      expect(screen.getByText('Inbjudan hittades inte eller är ogiltig')).toBeInTheDocument()
    })
  })

  it('shows error for expired invitation', async () => {
    const expiredInvitation = {
      ...mockInvitation,
      status: 'accepted',
    }

    const mockSupabaseInstance = {
      auth: {
        signUp: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: expiredInvitation, error: null })),
          })),
        })),
      })),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    render(<SelfRegistrationPage />)

    await waitFor(() => {
      expect(screen.getByText('Denna inbjudan har redan använts')).toBeInTheDocument()
    })
  })

  it('completes registration successfully', async () => {
    const mockSignUp = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    })

    const mockInsertMember = jest.fn().mockResolvedValue({
      data: { id: 'member-id' },
      error: null,
    })

    const mockUpdateInvitation = jest.fn().mockResolvedValue({
      data: {},
      error: null,
    })

    const mockSupabaseInstance = {
      auth: {
        signUp: mockSignUp,
      },
      from: jest.fn((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockInvitation, error: null })),
              })),
            })),
            update: jest.fn(() => ({
              eq: mockUpdateInvitation,
            })),
          }
        }
        if (table === 'members') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: mockInsertMember,
              })),
            })),
          }
        }
        if (table === 'association_members') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {}
      }),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    const user = userEvent.setup()
    render(<SelfRegistrationPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    // Fill in birth date
    await user.type(screen.getByLabelText(/Födelsedatum/), '1990-01-01')

    // Submit form
    await user.click(screen.getByText('Slutför registrering'))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: expect.any(String),
      })
      expect(mockInsertMember).toHaveBeenCalled()
      expect(mockUpdateInvitation).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/associations/association-id')
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<SelfRegistrationPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    // Clear required field
    await user.clear(screen.getByDisplayValue('Test User'))

    // Try to submit
    await user.click(screen.getByText('Slutför registrering'))

    await waitFor(() => {
      expect(screen.getByText('Fullständigt namn krävs')).toBeInTheDocument()
    })
  })

  it('validates birth date format', async () => {
    const user = userEvent.setup()
    render(<SelfRegistrationPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    // Enter invalid birth date
    await user.type(screen.getByLabelText(/Födelsedatum/), 'invalid-date')
    await user.click(screen.getByText('Slutför registrering'))

    await waitFor(() => {
      expect(screen.getByText('Ogiltigt datumformat')).toBeInTheDocument()
    })
  })

  it('handles auth signup error', async () => {
    const mockSignUp = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Email already exists' },
    })

    const mockSupabaseInstance = {
      auth: {
        signUp: mockSignUp,
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockInvitation, error: null })),
          })),
        })),
      })),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    const user = userEvent.setup()
    render(<SelfRegistrationPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/Födelsedatum/), '1990-01-01')
    await user.click(screen.getByText('Slutför registrering'))

    await waitFor(() => {
      expect(screen.getByText('Fel vid skapande av konto: Email already exists')).toBeInTheDocument()
    })
  })

  it('handles member creation error', async () => {
    const mockSignUp = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    })

    const mockInsertMember = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    })

    const mockSupabaseInstance = {
      auth: {
        signUp: mockSignUp,
      },
      from: jest.fn((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockInvitation, error: null })),
              })),
            })),
          }
        }
        if (table === 'members') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: mockInsertMember,
              })),
            })),
          }
        }
        return {}
      }),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    const user = userEvent.setup()
    render(<SelfRegistrationPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/Födelsedatum/), '1990-01-01')
    await user.click(screen.getByText('Slutför registrering'))

    await waitFor(() => {
      expect(screen.getByText('Fel vid skapande av medlem: Database error')).toBeInTheDocument()
    })
  })

  it('handles association linking error gracefully', async () => {
    const mockSignUp = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    })

    const mockInsertMember = jest.fn().mockResolvedValue({
      data: { id: 'member-id' },
      error: null,
    })

    const mockInsertAssociationMember = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Association linking failed' },
    })

    const mockSupabaseInstance = {
      auth: {
        signUp: mockSignUp,
      },
      from: jest.fn((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockInvitation, error: null })),
              })),
            })),
          }
        }
        if (table === 'members') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: mockInsertMember,
              })),
            })),
          }
        }
        if (table === 'association_members') {
          return {
            insert: mockInsertAssociationMember,
          }
        }
        return {}
      }),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    const user = userEvent.setup()
    render(<SelfRegistrationPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/Födelsedatum/), '1990-01-01')
    await user.click(screen.getByText('Slutför registrering'))

    await waitFor(() => {
      expect(screen.getByText('Kontot skapades men länkning till förening misslyckades. Kontakta administratören.')).toBeInTheDocument()
    })
  })

  it('redirects when no token provided', async () => {
    mockSearchParams.get.mockReturnValue(null)

    render(<SelfRegistrationPage />)

    expect(mockRouter.replace).toHaveBeenCalledWith('/login')
  })
})
