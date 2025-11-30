// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_META_APP_ID = 'test-app-id'
process.env.NEXT_PUBLIC_META_OAUTH_REDIRECT = 'http://localhost:3000/api/oauth/callback'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
