'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Public OAuth client id — safe to expose. Overridable via env.
const CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  '73710262482-v2kdpc9h4hopq6lrip1g5j33irgjdi7i.apps.googleusercontent.com'

// Minimal Google Identity Services typings (avoids `any`).
type CredentialResponse = { credential: string }
type GoogleId = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (resp: CredentialResponse) => void
        nonce?: string
        auto_select?: boolean
      }) => void
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
    }
  }
}
declare global {
  interface Window { google?: GoogleId }
}

// Supabase's Google id-token flow needs a nonce: pass the SHA-256 hash to Google,
// and the raw value to signInWithIdToken (Supabase re-hashes and compares).
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = crypto.randomUUID() + crypto.randomUUID()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return { raw, hashed }
}

export default function GoogleSignInButton({ onError }: { onError?: (msg: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { raw, hashed } = await makeNonce()

      function init() {
        if (cancelled || !window.google || !ref.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashed,
          auto_select: false,
          callback: async (resp) => {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: resp.credential,
              nonce: raw,
            })
            // On success the parent page's onAuthStateChange handles routing.
            if (error) onError?.(error.message)
          },
        })
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 320,
        })
        setReady(true)
      }

      if (window.google?.accounts?.id) { init(); return }
      const existing = document.getElementById('gsi-client')
      if (existing) { existing.addEventListener('load', init); return }
      const s = document.createElement('script')
      s.id = 'gsi-client'
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = init
      s.onerror = () => onError?.('Could not load Google sign-in. Check your connection and retry.')
      document.head.appendChild(s)
    })()

    return () => { cancelled = true }
  }, [onError])

  return (
    <div className="flex justify-center min-h-[44px] items-center">
      <div ref={ref} />
      {!ready && <span className="text-slate-400 text-sm">Loading Google sign-in…</span>}
    </div>
  )
}
