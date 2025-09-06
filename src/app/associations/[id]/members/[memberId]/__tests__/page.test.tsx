import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemberDetailPage from '../page'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase client
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useParams: () => ({
    id: 'test-association-id',
    memberId: 'test-member-id',
  }),
}))

describe('MemberDetailPage', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockMember = {
    id: 'test-member-id',
    association_id: 'test-association-id',
    full_name: 'Test Member',
    email: 'member@example.com',
    phone: '+46123456789',
    birth_date: '1990-01-01',
    member_number: 'M001',
    status: 'active',
    guardian_id: null,
    joined_date: '2023-01-01',
    notes: 'Test member notes',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    custom_fields: {},
    consents: {},
    invitation_id: null,
  }

  const mockAssociation = {
    id: 'test-association-id',
    name: 'Test Association',
  }

  const mockMembership = {
    role: 'admin',
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Mock successful Supabase responses
    const mockSupabaseInstance = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const mockQuery = {
          select: jest.fn(() => mockQuery),
          eq: jest.fn(() => mockQuery),
          single: jest.fn(() => {
            if (table === 'association_members') {
              return Promise.resolve({ data: mockMembership, error: null })
            }
            if (table === 'associations') {
              return Promise.resolve({ data: mockAssociation, error: null })
            }
            if (table === 'members') {
              return Promise.resolve({ data: mockMember, error: null })
            }
            if (table === 'audit_log') {
              return Promise.resolve({ data: [], error: null })
            }
            return Promise.resolve({ data: null, error: null })
          }),
          update: jest.fn(() => mockQuery),
          order: jest.fn(() => mockQuery),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        }
        return mockQuery
      }),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)
  })

  it('renders member details correctly', async () => {
    render(<MemberDetailPage />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Laddar medlemsuppgifter...')).not.toBeInTheDocument()
    })

    // Check if member name is displayed in header
    expect(screen.getByRole('heading', { name: 'Test Member' })).toBeInTheDocument()
    expect(screen.getByText('Test Association')).toBeInTheDocument()

    // Check personal information
    expect(screen.getByText('member@example.com')).toBeInTheDocument()
    expect(screen.getByText('+46123456789')).toBeInTheDocument()
    expect(screen.getByText('M001')).toBeInTheDocument()
    expect(screen.getByText('Test member notes')).toBeInTheDocument()
  })

  it('shows edit button for admin users', async () => {
    render(<MemberDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Redigera')).toBeInTheDocument()
    })
  })

  it('does not show edit button for regular members', async () => {
    // Mock regular member permission
    const mockSupabaseInstance = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const mockQuery = {
          select: jest.fn(() => mockQuery),
          eq: jest.fn(() => mockQuery),
          single: jest.fn(() => {
            if (table === 'association_members') {
              return Promise.resolve({ data: { role: 'member' }, error: null })
            }
            if (table === 'associations') {
              return Promise.resolve({ data: mockAssociation, error: null })
            }
            if (table === 'members') {
              return Promise.resolve({ data: mockMember, error: null })
            }
            return Promise.resolve({ data: [], error: null })
          }),
          order: jest.fn(() => mockQuery),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        }
        return mockQuery
      }),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    render(<MemberDetailPage />)

    await waitFor(() => {
      expect(screen.queryByText('Redigera')).not.toBeInTheDocument()
    })
  })

  it('enters edit mode when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<MemberDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Redigera')).toBeInTheDocument()
    })

    // Click edit button
    await user.click(screen.getByText('Redigera'))

    // Check if edit mode is active
    await waitFor(() => {
      expect(screen.getByText('Spara')).toBeInTheDocument()
      expect(screen.getByText('Avbryt')).toBeInTheDocument()
    })
    
    // Check if form inputs are present
    expect(screen.getByDisplayValue('Test Member')).toBeInTheDocument()
    expect(screen.getByDisplayValue('member@example.com')).toBeInTheDocument()
  })

  it('cancels edit mode and resets form', async () => {
    const user = userEvent.setup()
    render(<MemberDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Redigera')).toBeInTheDocument()
    })

    // Enter edit mode
    await user.click(screen.getByText('Redigera'))

    // Wait for edit mode to activate
    await waitFor(() => {
      expect(screen.getByText('Avbryt')).toBeInTheDocument()
    })

    // Modify a field
    const nameInput = screen.getByDisplayValue('Test Member')
    await user.clear(nameInput)
    await user.type(nameInput, 'Modified Name')

    // Click cancel
    await user.click(screen.getByText('Avbryt'))

    // Should return to view mode
    await waitFor(() => {
      expect(screen.getByText('Redigera')).toBeInTheDocument()
      expect(screen.queryByText('Spara')).not.toBeInTheDocument()
    })
  })

  it('displays member data correctly', async () => {
    render(<MemberDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('member@example.com')).toBeInTheDocument()
      expect(screen.getByText('+46123456789')).toBeInTheDocument()
      expect(screen.getByText('M001')).toBeInTheDocument()
      expect(screen.getByText('Test member notes')).toBeInTheDocument()
    })
  })

  it('saves member data successfully', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ error: null })
    const mockSupabaseInstance = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const mockQuery = {
          select: jest.fn(() => mockQuery),
          eq: jest.fn(() => mockQuery),
          single: jest.fn(() => {
            if (table === 'association_members') {
              return Promise.resolve({ data: mockMembership, error: null })
            }
            if (table === 'associations') {
              return Promise.resolve({ data: mockAssociation, error: null })
            }
            if (table === 'members') {
              return Promise.resolve({ data: mockMember, error: null })
            }
            return Promise.resolve({ data: [], error: null })
          }),
          update: jest.fn(() => ({
            eq: mockUpdate,
          })),
          order: jest.fn(() => mockQuery),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        }
        return mockQuery
      }),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    const user = userEvent.setup()
    render(<MemberDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Redigera')).toBeInTheDocument()
    })

    // Enter edit mode
    await user.click(screen.getByText('Redigera'))

    // Wait for edit mode to activate
    await waitFor(() => {
      expect(screen.getByText('Spara')).toBeInTheDocument()
    })

    // Modify a field
    const nameInput = screen.getByDisplayValue('Test Member')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Member Name')

    // Save changes
    await user.click(screen.getByText('Spara'))

    // Verify update was called
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('displays error message when member not found', async () => {
    const mockSupabaseInstance = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const mockQuery = {
          select: jest.fn(() => mockQuery),
          eq: jest.fn(() => mockQuery),
          single: jest.fn(() => {
            if (table === 'association_members') {
              return Promise.resolve({ data: mockMembership, error: null })
            }
            if (table === 'members') {
              return Promise.resolve({ data: null, error: { message: 'Member not found' } })
            }
            return Promise.resolve({ data: null, error: null })
          }),
        }
        return mockQuery
      }),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    render(<MemberDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Medlem hittades inte')).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    render(<MemberDetailPage />)
    
    expect(screen.getByText('Laddar medlemsuppgifter...')).toBeInTheDocument()
  })

  it('formats dates correctly', async () => {
    render(<MemberDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('1990-01-01')).toBeInTheDocument()
      expect(screen.getAllByText('2023-01-01')).toHaveLength(2) // joined_date and updated_at
    })
  })

  it('displays status badge correctly', async () => {
    render(<MemberDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Aktiv')).toBeInTheDocument()
    })
  })
})
