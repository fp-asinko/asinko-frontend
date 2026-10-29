'use client'

import dynamic from 'next/dynamic'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/** What the visitor was about to do: the modal says it (G-05) and auth comes back to it (G-09). */
export type GatedAction =
  'vote-post' | 'vote-poll' | 'post' | 'comment' | 'join' | 'login' | 'signup'

/** The pending action and where to come back after logging in (a relative path, security.md). */
export type GateRequest = { action: GatedAction; next: string }

/**
 * What the modal shows: the invitation, one of the forms (specs/auth AU-01), or the second step of
 * an account without a username (AU-11): its username, photo and terms.
 */
export type GateView = 'invite' | 'login' | 'signup' | 'profile'

/** Back from Google without a username, the page opens the second step (design.md § 12). */
export const WELCOME_PARAM = 'welcome'

type AuthGate = {
  signedIn: boolean
  /** Signed in, but still without a username (specs/auth AU-11). */
  needsProfile: boolean
  /**
   * The viewer's avatar, rendered on the server (FC-24: on their poll vote). A node, not a name:
   * the avatar code never reaches the browser (JS budget, seo.md).
   */
  viewerAvatar: ReactNode
  /** true when there is a session; otherwise opens the modal for `action` and returns false. */
  requireAccount: (action: GatedAction) => boolean
  /** Opens the modal directly: the Log in and Sign up buttons. */
  openGate: (action: GatedAction) => void
  /** Logs out (specs/auth AU-14); the layout passes the Server Action. */
  logOut: () => Promise<unknown>
}

// Without a provider (isolated component tests) everything behaves as signed in, like before.
const AuthGateContext = createContext<AuthGate>({
  signedIn: true,
  needsProfile: false,
  viewerAvatar: null,
  requireAccount: () => true,
  openGate: () => {},
  logOut: async () => {},
})

/** For the forms inside the modal: which one, switching, closing and where to come back. */
export type GateDialog = {
  view: GateView
  setView: (view: GateView) => void
  next: string
  close: () => void
}

const GateDialogContext = createContext<GateDialog | null>(null)

// Loaded the first time it opens (G-10): visitors who only read never download it.
const AuthGateDialog = dynamic(
  () => import('./auth-gate-dialog').then((mod) => mod.AuthGateDialog),
  {
    ssr: false,
  },
)

const viewFor = (action: GatedAction): GateView =>
  action === 'login' ? 'login' : action === 'signup' ? 'signup' : 'invite'

/**
 * Who can act (specs/guest-experience § 1, specs/auth § 8). The layout passes the account's state
 * from the session; the Server Actions still check it themselves (security.md § 5). For an account
 * without a username, the modal is its second step (AU-11), and it opens by itself back from Google.
 */
export function AuthGateProvider({
  signedIn,
  needsProfile = false,
  viewerAvatar = null,
  forms = null,
  logOut = async () => {},
  children,
}: {
  signedIn: boolean
  needsProfile?: boolean
  viewerAvatar?: ReactNode
  /** The log in and sign up forms, from the auth feature: the modal shows them (AU-01). */
  forms?: ReactNode
  logOut?: () => Promise<unknown>
  children: ReactNode
}) {
  const [request, setRequest] = useState<GateRequest | null>(null)
  // Stays mounted after the first open, so closing can animate and reopening is instant.
  const [last, setLast] = useState<GateRequest | null>(null)
  const [view, setView] = useState<GateView>('invite')

  const openGate = useCallback(
    (action: GatedAction) => {
      const next = `${window.location.pathname}${window.location.search}`
      const gate = { action, next }
      setView(needsProfile ? 'profile' : viewFor(action))
      setRequest(gate)
      setLast(gate)
    },
    [needsProfile],
  )

  const value = useMemo<AuthGate>(
    () => ({
      signedIn,
      needsProfile,
      viewerAvatar: signedIn ? viewerAvatar : null,
      openGate,
      logOut,
      requireAccount: (action) => {
        if (signedIn) return true
        openGate(action)
        return false
      },
    }),
    [signedIn, needsProfile, viewerAvatar, openGate, logOut],
  )

  // Back from Google without a username: the second step, over the page the person was on.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!needsProfile || !url.searchParams.has(WELCOME_PARAM)) return
    // After the page's first paint: the modal comes over it, and the mark leaves the address.
    const frame = requestAnimationFrame(() => {
      url.searchParams.delete(WELCOME_PARAM)
      window.history.replaceState(window.history.state, '', url)
      openGate('signup')
    })
    return () => cancelAnimationFrame(frame)
  }, [needsProfile, openGate])

  const close = useCallback(() => setRequest(null), [])
  const dialog = useMemo<GateDialog | null>(
    () => (last ? { view, setView, next: (request ?? last).next, close } : null),
    [last, request, view, close],
  )

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      {last && dialog && (
        <GateDialogContext.Provider value={dialog}>
          <AuthGateDialog
            request={request ?? last}
            view={view}
            open={request !== null}
            onClose={close}
            onViewChange={setView}
            forms={forms}
          />
        </GateDialogContext.Provider>
      )}
    </AuthGateContext.Provider>
  )
}

export function useAuthGate(): AuthGate {
  return useContext(AuthGateContext)
}

/** Inside the modal only; null elsewhere. */
export function useGateDialog(): GateDialog | null {
  return useContext(GateDialogContext)
}
