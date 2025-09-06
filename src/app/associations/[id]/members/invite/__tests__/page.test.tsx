import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InviteMembersPage from '../page'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase client
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Mock Papa Parse
jest.mock('papaparse', () => ({
  parse: jest.fn((file, options) => {
    // Mock successful CSV parsing
    options.complete([
      { email: 'test1@example.com', full_name: 'Test User 1', phone: '123456789', birth_date: '1990-01-01' },
      { email: 'test2@example.com', full_name: 'Test User 2', phone: '987654321', birth_date: '1985-05-15' },
    ])
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

    // Mock useParams to return association id
    const mockUseParams = require('next/navigation').useParams
    mockUseParams.mockReturnValue({ id: 'test-association-id' })

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

  it('validates required email field', async () => {
    const user = userEvent.setup()
    render(<InviteMembersPage />)

    // Try to submit without email
    await user.click(screen.getByText('Skicka inbjudan'))

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('E-postadress krävs')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<InviteMembersPage />)

    // Enter invalid email
    await user.type(screen.getByLabelText(/E-postadress/), 'invalid-email')
    await user.click(screen.getByText('Skicka inbjudan'))

    await waitFor(() => {
      expect(screen.getByText('Ogiltig e-postadress')).toBeInTheDocument()
    })
  })

  it('switches to CSV import tab', async () => {
    const user = userEvent.setup()
    render(<InviteMembersPage />)

    await user.click(screen.getByText('Importera från CSV'))

    expect(screen.getByText('Ladda upp en CSV-fil med medlemsinformation')).toBeInTheDocument()
    expect(screen.getByText('CSV-format')).toBeInTheDocument()
  })

  it('handles CSV file upload and preview', async () => {
    const user = userEvent.setup()
    render(<InviteMembersPage />)

    // Switch to CSV tab
    await user.click(screen.getByText('Importera från CSV'))

    // Mock file upload
    const file = new File(['email,full_name,phone,birth_date\\ntest@example.com,Test User,123456789,1990-01-01'], 'test.csv', {
      type: 'text/csv',
    })

    const fileInput = screen.getByLabelText('Välj CSV-fil') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Förhandsgranska import (2 medlemmar)')).toBeInTheDocument()
      expect(screen.getByText('test1@example.com')).toBeInTheDocument()
      expect(screen.getByText('Test User 1')).toBeInTheDocument()
    })
  })

  it('validates CSV data and shows errors', async () => {
    // Mock Papa Parse with invalid data
    const PapaParse = require('papaparse')
    PapaParse.parse.mockImplementation((file, options) => {
      options.complete([
        { email: '', full_name: 'Test User 1', phone: '123456789', birth_date: '1990-01-01' },
        { email: 'invalid-email', full_name: 'Test User 2', phone: 'invalid-phone', birth_date: 'invalid-date' },
      ])
    })

    const user = userEvent.setup()
    render(<InviteMembersPage />)

    // Switch to CSV tab
    await user.click(screen.getByText('Importera från CSV'))

    // Upload file
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText('Välj CSV-fil') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Fel hittades (4)')).toBeInTheDocument()
      expect(screen.getByText('E-postadress saknas')).toBeInTheDocument()
      expect(screen.getByText('Ogiltig e-postadress')).toBeInTheDocument()
    })
  })

  it('imports CSV data successfully', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: [{ token: 'token1' }, { token: 'token2' }],
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
          select: mockInsert,
        })),
      })),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    const user = userEvent.setup()
    render(<InviteMembersPage />)

    // Switch to CSV tab and upload file
    await user.click(screen.getByText('Importera från CSV'))

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText('Välj CSV-fil') as HTMLInputElement
    await user.upload(fileInput, file)

    // Wait for preview and import
    await waitFor(() => {
      expect(screen.getByText('Importera 2 medlemmar')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Importera 2 medlemmar'))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    })
  })

  it('handles CSV import errors', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
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
          select: mockInsert,
        })),
      })),
    }

    mockSupabase.mockReturnValue(mockSupabaseInstance as any)

    const user = userEvent.setup()
    render(<InviteMembersPage />)

    // Upload and try to import
    await user.click(screen.getByText('Importera från CSV'))

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText('Välj CSV-fil') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Importera 2 medlemmar')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Importera 2 medlemmar'))

    await waitFor(() => {
      expect(screen.getByText('Import misslyckades: Database error')).toBeInTheDocument()
    })
  })

  it('prevents import with validation errors', async () => {
    // Mock Papa Parse with invalid data
    const PapaParse = require('papaparse')
    PapaParse.parse.mockImplementation((file, options) => {
      options.complete([
        { email: '', full_name: 'Test User 1', phone: '123456789', birth_date: '1990-01-01' },
      ])
    })

    const user = userEvent.setup()
    render(<InviteMembersPage />)

    await user.click(screen.getByText('Importera från CSV'))

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText('Välj CSV-fil') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => {
      const importButton = screen.getByText('Importera 1 medlemmar')
      expect(importButton).toBeDisabled()
    })
  })
})
