import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatFreshness } from '../src/lib/utils.ts'

const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
const MIN = 60_000
const HOUR = 60 * MIN

test('formatFreshness returns null when there is no timestamp', () => {
  assert.equal(formatFreshness(null), null)
  assert.equal(formatFreshness(undefined), null)
  assert.equal(formatFreshness(''), null)
  assert.equal(formatFreshness('not-a-date'), null)
})

test('recent checks read as minutes/hours and are not stale', () => {
  assert.deepEqual(formatFreshness(ago(5 * MIN)), { text: 'Price checked 5 minutes ago', stale: false })
  assert.deepEqual(formatFreshness(ago(2 * HOUR)), { text: 'Price checked 2 hours ago', stale: false })
  assert.deepEqual(formatFreshness(ago(1 * HOUR)), { text: 'Price checked 1 hour ago', stale: false })
})

test('older-than-a-day checks are flagged stale with a verify warning', () => {
  const yesterday = formatFreshness(ago(30 * HOUR))
  assert.ok(yesterday && yesterday.stale)
  assert.match(yesterday!.text, /verify the final fare before booking/)
  assert.match(yesterday!.text, /yesterday/)

  const twoDays = formatFreshness(ago(50 * HOUR))
  assert.ok(twoDays && twoDays.stale)
  assert.match(twoDays!.text, /2 days ago/)
})
