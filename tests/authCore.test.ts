import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  adminTokenValid,
  cronSecretValid,
  rateLimit,
  __resetRateLimits,
} from '../src/lib/auth-core.ts'

test('admin auth fails closed when ADMIN_SECRET is unset', () => {
  assert.equal(adminTokenValid('anything', undefined), false)
  assert.equal(adminTokenValid('anything', ''), false)
  assert.equal(adminTokenValid(null, undefined), false)
})

test('admin auth denies missing / wrong tokens and accepts the exact secret', () => {
  const secret = 'super-secret-value'
  assert.equal(adminTokenValid(null, secret), false)
  assert.equal(adminTokenValid('', secret), false)
  assert.equal(adminTokenValid('wrong', secret), false)
  assert.equal(adminTokenValid('super-secret-valu', secret), false) // length mismatch
  assert.equal(adminTokenValid(secret, secret), true)
})

test('cron auth accepts Bearer or x-cron-secret and fails closed without the secret', () => {
  const secret = 'cron-secret'
  assert.equal(cronSecretValid(`Bearer ${secret}`, null, secret), true)
  assert.equal(cronSecretValid(null, secret, secret), true)
  assert.equal(cronSecretValid('Bearer nope', 'nope', secret), false)
  assert.equal(cronSecretValid(`Bearer ${secret}`, null, undefined), false) // no secret configured
  assert.equal(cronSecretValid(null, null, secret), false)
})

test('rate limiter blocks once the window limit is exhausted', () => {
  __resetRateLimits()
  const key = 'test:1.2.3.4'
  const t0 = 1_000_000
  assert.equal(rateLimit(key, 3, 60_000, t0), true)
  assert.equal(rateLimit(key, 3, 60_000, t0), true)
  assert.equal(rateLimit(key, 3, 60_000, t0), true)
  assert.equal(rateLimit(key, 3, 60_000, t0), false, '4th call in window is blocked')
  // window rolls over
  assert.equal(rateLimit(key, 3, 60_000, t0 + 60_001), true)
})
