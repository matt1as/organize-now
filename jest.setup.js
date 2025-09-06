import '@testing-library/jest-dom'

// Mock Next.js router - each test will provide specific implementation
jest.mock('next/navigation')

// Mock Supabase client - each test will provide specific implementation
jest.mock('@/lib/supabase/client')

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
