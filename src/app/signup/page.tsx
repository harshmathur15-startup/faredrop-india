'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { INDIAN_AIRPORTS } from '@/lib/airports'

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Chandigarh', 'Ladakh',
  'Andaman & Nicobar', 'Other',
]

type Step = 'email' | 'otp' | 'profile' | 'success'
const STAGES = ['Verify', 'Profile', 'Done']

function Progress({ step }: { step: Step }) {
  const stage = step === 'success' ? 2 : step === 'profile' ? 1 : 0
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STAGES.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i <= stage ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>{i < stage ? '✓' : i + 1}</div>
            <span className={`text-[11px] font-semibold ${i <= stage ? 'text-blue-700' : 'text-slate-400'}`}>{label}</span>
          </div>
          {i < STAGES.length - 1 && <div className={`w-10 h-0.5 -mt-4 rounded ${i < stage ? 'bg-blue-600' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [age, setAge] = useState('')
  const [stateV, setStateV] = useState('')
  const [city, setCity] = useState('')
  const [homeAirport,   setHomeAirport]   = useState('')
  const [waOptIn,       setWaOptIn]       = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [error, setError] = useState('')

  // Detect an existing/just-completed session (Google redirect or email OTP) and route accordingly
  useEffect(() => {
    let mounted = true
    type SbUser = { email?: string; user_metadata?: Record<string, unknown> }
    function decide(user: SbUser | undefined | null) {
      if (!mounted) return
      if (!user) { setChecking(false); return }
      if (user.user_metadata?.mobile) { router.replace('/'); return } // profile already complete
      setEmail(user.email ?? '')
      setFullName((user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '')
      setStep('profile')
      setChecking(false)
    }
    supabase.auth.getSession().then(({ data }) => decide(data.session?.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => decide(session?.user))
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [router])

  async function googleSignIn() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/signup` },
    })
    if (error) setError(error.message)
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault(); setError(''); setStatus('loading')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    setStatus('idle')
    if (error) { setError(error.message); return }
    setStep('otp')
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault(); setError(''); setStatus('loading')
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setStatus('idle')
    if (error) { setError(error.message); return }
    setStep('profile') // onAuthStateChange also confirms; returning users with mobile get redirected home
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (fullName.trim().length < 2) { setError('Please enter your full name.'); return }
    if (!/^[6-9]\d{9}$/.test(mobile)) { setError('Enter a valid 10-digit Indian mobile number.'); return }
    if (age && (Number(age) < 1 || Number(age) > 120)) { setError('Enter a valid age.'); return }
    setStatus('loading')

    const whatsappNumber = waOptIn ? `+91${mobile}` : null
    const homeAirportObj = homeAirport ? INDIAN_AIRPORTS.find(a => a.iata === homeAirport) ?? null : null

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name:      fullName.trim(),
        mobile:         `+91${mobile}`,
        mobile_verified: false,
        age:            age ? Number(age) : null,
        state:          stateV || null,
        city:           city.trim() || null,
        home_airport:   homeAirport || null,
        whatsapp_opted_in: waOptIn,
      },
    })
    if (error) { setStatus('idle'); setError(error.message); return }

    // Persist preferences to user_preferences table (non-fatal)
    try {
      await fetch('/api/preferences', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_airport:      homeAirport || null,
          home_airport_city: homeAirportObj?.city ?? null,
          whatsapp_number:   whatsappNumber,
          whatsapp_opted_in: waOptIn,
          email_opted_in:    true,
        }),
      })
    } catch { /* non-fatal */ }

    // Complete signup (add to subscribers table, send welcome email)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      await fetch('/api/auth/complete-signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, name: fullName.trim(), phone: `+91${mobile}`,
          userId: currentUser?.id ?? null,
          whatsapp_number: whatsappNumber, whatsapp_opted_in: waOptIn,
        }),
      })
    } catch { /* non-fatal */ }

    setStatus('idle'); setStep('success')
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={45} height={45} className="h-11 w-auto drop-shadow" />
          <span className="font-display font-bold text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-md border border-gray-100 p-8">
          {checking ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : (
            <>
              {step !== 'success' && <Progress step={step} />}

              {/* Step 1 — Sign in (Google + Email) */}
              {step === 'email' && (
                <div className="space-y-5">
                  <div className="text-center">
                    <h1 className="font-display text-2xl font-bold text-slate-900">Welcome to Travelbaby</h1>
                    <p className="text-slate-500 text-sm mt-1">Find the best flight &amp; hotel deals.</p>
                  </div>

                  <button onClick={googleSignIn}
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex-1 h-px bg-slate-200" /> or <span className="flex-1 h-px bg-slate-200" />
                  </div>

                  <form onSubmit={sendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email address</label>
                      <input type="email" inputMode="email" autoComplete="email" required value={email}
                        onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className={inputCls} />
                    </div>
                    <button type="submit" disabled={status === 'loading'}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                      {status === 'loading' ? 'Sending…' : 'Continue with Email →'}
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2 — OTP */}
              {step === 'otp' && (
                <form onSubmit={verify} className="space-y-5">
                  <div className="text-center">
                    <h1 className="font-display text-2xl font-bold text-slate-900">Enter your code</h1>
                    <p className="text-slate-500 text-sm mt-1">We sent a verification code to <strong>{email}</strong>.</p>
                  </div>
                  <input type="text" inputMode="numeric" autoComplete="one-time-code" required value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter code" maxLength={8}
                    className={`${inputCls} text-center text-2xl font-black tracking-[0.4em]`} />
                  <button type="submit" disabled={status === 'loading' || code.length < 6}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                    {status === 'loading' ? 'Verifying…' : 'Verify →'}
                  </button>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => { setStep('email'); setCode(''); setError('') }}
                      className="text-slate-500 font-semibold hover:text-slate-700">← Change email</button>
                    <button type="button" onClick={sendOtp} className="text-blue-600 font-semibold hover:underline">Resend code</button>
                  </div>
                </form>
              )}

              {/* Step 3 — Profile (mobile captured, not verified) */}
              {step === 'profile' && (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="text-center mb-1">
                    <h1 className="font-display text-2xl font-bold text-slate-900">Almost there!</h1>
                    <p className="text-slate-500 text-sm mt-1">Just a few details so we can tailor deals from your home city.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Full name *</label>
                    <input type="text" autoComplete="name" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Harsh Mathur" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Mobile number *</label>
                    <div className="flex items-center rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
                      <span className="px-3 py-3 bg-gray-50 text-gray-600 text-sm font-semibold border-r border-gray-300">+91</span>
                      <input type="tel" inputMode="numeric" required value={mobile}
                        onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" className="flex-1 px-4 py-3 focus:outline-none text-gray-900" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Age</label>
                      <input type="number" min={1} max={120} value={age} onChange={e => setAge(e.target.value)} placeholder="31" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">State</label>
                      <select value={stateV} onChange={e => setStateV(e.target.value)} className={`${inputCls} cursor-pointer`}>
                        <option value="">Select…</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. New Delhi" className={inputCls} />
                  </div>

                  {/* Optional: home airport */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      Home airport <span className="text-gray-400 font-normal normal-case">(optional)</span>
                    </label>
                    <select value={homeAirport} onChange={e => setHomeAirport(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      <option value="">Select your nearest airport…</option>
                      {INDIAN_AIRPORTS.map(a => (
                        <option key={a.iata} value={a.iata}>{a.city} ({a.iata})</option>
                      ))}
                    </select>
                  </div>

                  {/* Optional: WhatsApp opt-in */}
                  <label className="flex items-start gap-3 cursor-pointer bg-green-50 border border-green-100 rounded-xl p-3">
                    <input type="checkbox" checked={waOptIn} onChange={e => setWaOptIn(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-green-600 rounded shrink-0" />
                    <span className="text-sm text-gray-700">
                      <span className="font-bold text-green-800">Get WhatsApp alerts</span>
                      <span className="text-gray-500"> — we'll ping you on {mobile ? `+91 ${mobile}` : 'your mobile'} when prices drop</span>
                    </span>
                  </label>

                  <button type="submit" disabled={status === 'loading'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                    {status === 'loading' ? 'Saving…' : 'Continue →'}
                  </button>
                </form>
              )}

              {/* Step 4 — Success */}
              {step === 'success' && (
                <div className="text-center py-6">
                  <p className="text-5xl mb-4">🎉</p>
                  <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Welcome aboard!</h1>
                  <p className="text-slate-500 mb-8">You&apos;re all set{fullName ? `, ${fullName.split(' ')[0]}` : ''}. Start finding amazing fares.</p>
                  <button onClick={() => { router.push('/'); router.refresh() }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                    Go to deals →
                  </button>
                </div>
              )}

              {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

              {step === 'email' && (
                <p className="text-gray-400 text-xs mt-6 text-center">
                  By continuing you agree to receive curated flight deal emails. Unsubscribe anytime.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
