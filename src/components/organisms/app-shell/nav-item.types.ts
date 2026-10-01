import type { NavLinkProps } from '@/components/molecules/nav-link'

/** A navigation destination. Only views that exist are registered (F-23b). */
export type NavItem = Pick<NavLinkProps, 'href' | 'label' | 'icon'>
