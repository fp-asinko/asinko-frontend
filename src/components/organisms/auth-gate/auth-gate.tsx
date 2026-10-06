'use client'

import dynamic from 'next/dynamic'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/** What the visitor was about to do: the modal says it (G-05) and auth resumes it (G-09). */
export type GatedAction = 'vote-post' | 'vote-poll' | 'post' | 'join' | 'login' | 'signup'

/** The pending action and where to come back after logging in (a relative path, security.md). */
export type GateRequest = { action: GatedAction; next: string }

type AuthGate = {
  signedIn: boolean
  /**
   * The viewer's avatar, rendered on the server (FC-24: on their poll vote). A node, not a name:
   * the avatar code never reaches the browser (JS budget, seo.md).
   */
  viewerAvatar: ReactNode
  /** true when there is a session; otherwise opens the modal for `action` and returns false. */
  requireAccount: (action: GatedAction) => boolean
  /** Opens the modal directly: the Log in and Sign up buttons. */
  openGate: (action: GatedAction) => void
}

// Without a provider (isolated component tests) everything behaves as signed in, like before.
const AuthGateContext = createContext<AuthGate>({
  signedIn: true,
  viewerAvatar: null,
  requireAccount: () => true,
  openGate: () => {},
})

// Loaded the first time it opens (G-10): visitors who only read never download it.
const AuthGateDialog = dynamic(
  () => import('./auth-gate-dialog').then((mod) => mod.AuthGateDialog),
  {
    ssr: false,
  },
)

/**
 * Who can act (specs/guest-experience § 1). The layout passes `signedIn` from getViewer(); the
 * Server Actions still check the session themselves (security.md § 5).
 */
export function AuthGateProvider({
  signedIn,
  viewerAvatar = null,
  children,
}: {
  signedIn: boolean
  viewerAvatar?: ReactNode
  children: ReactNode
}) {
  const [request, setRequest] = useState<GateRequest | null>(null)
  // Stays mounted after the first open, so closing can animate and reopening is instant.
  const [last, setLast] = useState<GateRequest | null>(null)

  const openGate = useCallback((action: GatedAction) => {
    const next = `${window.location.pathname}${window.location.search}`
    const gate = { action, next }
    setRequest(gate)
    setLast(gate)
  }, [])

  const value = useMemo<AuthGate>(
    () => ({
      signedIn,
      viewerAvatar: signedIn ? viewerAvatar : null,
      openGate,
      requireAccount: (action) => {
        if (signedIn) return true
        openGate(action)
        return false
      },
    }),
    [signedIn, viewerAvatar, openGate],
  )

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      {last && (
        <AuthGateDialog
          request={request ?? last}
          open={request !== null}
          onClose={() => setRequest(null)}
        />
      )}
    </AuthGateContext.Provider>
  )
}

export function useAuthGate(): AuthGate {
  return useContext(AuthGateContext)
}
