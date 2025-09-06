import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InviteMembersPage from '../page'
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
  }),
}))

// Mock Papa Parse
const mockPapaParseComplete = jest.fn()
jest.mock('papaparse', () => ({
  parse: jest.fn((file, options) => {
    mockPapaParseComplete(options)
  }),
}))

describe('InviteMembersPage', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockMembership = {
    role: 'admin',
  }

  beforeEach(() => {
    jest.clearAllMocks()

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
            return Promise.resolve({ data: null, error: null })
          }),
          insert: jest.fn(() => mockQuery),
        }
        return mockQuery
      }),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)
  })

  it('renders invite page with tabs', async () => {
    render(<InviteMembersPage />)

    expect(screen.getByText('Bjud in medlemmar')).toBeInTheDocument()
    expect(screen.getByText('Enskild inbjudan')).toBeInTheDocument()
    expect(screen.getByText('Importera från CSV')).toBeInTheDocument()
  })

  it('submits single invitation successfully', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: { token: 'test-token' },
      error: null,
    })

    const mockSupabaseInstance = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockMembership, error: null })),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: mockInsert,
          })),
        })),
      })),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    const user = userEvent.setup()
    render(<InviteMembersPage />)

    // Fill in single invitation form
    await user.type(screen.getByLabelText(/E-postadress/), 'test@example.com')
    await user.type(screen.getByLabelText(/Fullständigt namn/), 'Test User')
    await user.type(screen.getByLabelText(/Telefonnummer/), '123456789')

    // Submit form
    await user.click(screen.getByText('Skicka inbjudan'))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    })
  })

  it('allows form input', async () => {
    const user = userEvent.setup()
    render(<InviteMembersPage />)

    // Should allow typing in the email field
    const emailInput = screen.getByLabelText(/E-postadress/)
    await user.type(emailInput, 'test@example.com')
    
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('switches to CSV import tab', async () => {
    const user = userEvent.setup()
    render(<InviteMembersPage />)

    await user.click(screen.getByText('Importera från CSV'))

    expect(screen.getByText('Ladda upp en CSV-fil med medlemsinformation')).toBeInTheDocument()
    expect(screen.getByText('CSV-format')).toBeInTheDocument()
  })

  it('shows CSV upload interface', async () => {
    const user = userEvent.setup()
    render(<InviteMembersPage />)

    // Switch to CSV tab
    await user.click(screen.getByText('Importera från CSV'))

    // Should show CSV upload elements
    expect(screen.getByText('Ladda upp en CSV-fil med medlemsinformation')).toBeInTheDocument()
    expect(screen.getByText('CSV-format')).toBeInTheDocument()
  })
})
