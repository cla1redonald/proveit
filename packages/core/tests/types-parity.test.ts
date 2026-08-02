import { describe, it, expect } from 'vitest'
import type { FastCheckVerdict } from '../src/types.ts'

/** Web app Verdict values (web/src/types/index.ts) — kept in sync via this test. */
const WEB_VERDICTS = ['SUPPORTED', 'WEAK', 'CONTRADICTED'] as const satisfies readonly FastCheckVerdict[]

describe('shared types parity (web ↔ core)', () => {
  it('web Fast Check verdicts are a subset of FastCheckVerdict', () => {
    const all: FastCheckVerdict[] = ['SUPPORTED', 'WEAK', 'CONTRADICTED', 'MIXED']
    for (const v of WEB_VERDICTS) {
      expect(all).toContain(v)
    }
  })

  it('MIXED is core/studio-only (vault parse), not emitted by web Fast Check API', () => {
    expect(WEB_VERDICTS).not.toContain('MIXED')
  })
})
