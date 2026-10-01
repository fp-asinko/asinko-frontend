// Fixed session user while there is no login (F-38, overview.md § Roadmap). With mocks on, writes
// run as this user; nothing reaches the real database.
export const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'demo',
} as const
