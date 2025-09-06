import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelfRegistrationPage from '../page'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock the Supabase client
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Mock Next.js navigation hooks
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockGet = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useParams: () => ({
    token: 'test-token',
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}))

describe('SelfRegistrationPage', () => {
  const mockInvitation = {
    id: 'invitation-id',
    association_id: 'association-id',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '123456789',
    birth_date: '1990-01-01',
    member_data: {
      email: 'test@example.com',
      full_name: 'Test User',
      phone: '123456789',
    },
    status: 'pending',
    expires_at: '2030-12-31T23:59:59Z', // Far in the future
  }

  const mockAssociation = {
    id: 'association-id',
    name: 'Test Association',
    description: 'Test Description',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockReturnValue('test-token')

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
            if (table === 'associations') {
              return Promise.resolve({ data: mockAssociation, error: null })
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
      expect(screen.getByText('Acceptera inbjudan')).toBeInTheDocument()
      expect(screen.getByText('Test Association')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument()
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
      expect(screen.getByText('Denna inbjudan har redan accepterats')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', async () => {
    render(<SelfRegistrationPage />)
    
    // Should show loading indicator
    expect(screen.getByText('Laddar inbjudan...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles missing token', () => {
    mockGet.mockReturnValue(null)

    render(<SelfRegistrationPage />)

    // Should initially show loading state
    expect(screen.getByText('Laddar inbjudan...')).toBeInTheDocument()
  })
})
