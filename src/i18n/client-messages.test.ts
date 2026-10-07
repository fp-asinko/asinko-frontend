// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '../../messages/en.json'
import { CLIENT_NAMESPACES, pickClientMessages } from './client-messages'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

describe('client messages (i18n.md § Server y Client Components)', () => {
  it('covers every namespace a Client Component uses', () => {
    const missing: string[] = []
    for (const file of sourceFiles(join(process.cwd(), 'src'))) {
      const code = readFileSync(file, 'utf8')
      if (!/^['"]use client['"]/m.test(code)) continue
      for (const [, namespace = ''] of code.matchAll(/useTranslations\(\s*'([^']*)'\s*\)/g)) {
        const covered = CLIENT_NAMESPACES.some(
          (allowed) => namespace === allowed || namespace.startsWith(`${allowed}.`),
        )
        if (!covered) missing.push(`${file}: ${namespace}`)
      }
      // A namespace-less useTranslations() would need every message on the client.
      if (/useTranslations\(\s*\)/.test(code)) missing.push(`${file}: (all)`)
    }
    expect(missing).toEqual([])
  })

  it('keeps only those namespaces, with their nesting', () => {
    const picked = pickClientMessages(en)
    expect(Object.keys(picked).sort()).toEqual([
      'authGate',
      'comments',
      'common',
      'communities',
      'devLogin',
      'errors',
      'feed',
      'join',
    ])
    expect(Object.keys(picked.feed as object).sort()).toEqual([
      'card',
      'comments',
      'loadMore',
      'poll',
      'vote',
    ])
    // Only the client part of the namespace: the page texts stay on the server.
    expect(Object.keys(picked.communities as object)).toEqual(['actions'])
    expect(picked.errors).toEqual({ unexpected: en.errors.unexpected })
    expect(picked).not.toHaveProperty('interests')
  })
})
