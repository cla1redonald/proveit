import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isHostedStudio,
  isHostedStudioMisconfigured,
  studioAllowedEmail,
} from '../src/lib/auth-config'

describe('studio auth-config', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    delete process.env.STUDIO_SOURCE
    delete process.env.STUDIO_ALLOWED_EMAIL
  })

  afterEach(() => {
    process.env = env
  })

  it('local fs mode is never misconfigured', () => {
    process.env.STUDIO_SOURCE = 'fs'
    expect(isHostedStudioMisconfigured()).toBe(false)
  })

  it('hosted mode without allow-list email is misconfigured', () => {
    process.env.STUDIO_SOURCE = 'supabase'
    expect(isHostedStudio()).toBe(true)
    expect(isHostedStudioMisconfigured()).toBe(true)
  })

  it('hosted mode with allow-list email is configured', () => {
    process.env.STUDIO_SOURCE = 'supabase'
    process.env.STUDIO_ALLOWED_EMAIL = 'Claire@Example.com'
    expect(studioAllowedEmail()).toBe('claire@example.com')
    expect(isHostedStudioMisconfigured()).toBe(false)
  })
})
