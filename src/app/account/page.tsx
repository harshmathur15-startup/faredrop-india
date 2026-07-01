'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Chandigarh', 'Ladakh',
  'Andaman & Nicobar', 'Other',
]

const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900'

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [age, setAge] = useState('')
  const [stateV, setStateV] = useState('')
  const [city, setCity] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving'>('idle')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (!u) { router.replace('/signup'); return }
      if (!mounted) return
      const m = (u.user_metadata || {}) as Record<string, unknown>
      setEmail(u.email || '')
      setFullName((m.full_name as string) || (m.name as string) || '')
      setMobile(((m.mobile as string) || '').replace('+91', ''))
      setAge(m.age ? String(m.age) : '')
      setStateV((m.state as string) || '')
      setCity((m.city as string) || '')
      setLoading(false)
    })
    return () => { mounted = false }
  }, [router])

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg('')
    if (fullName.trim().length < 2) { setMsg('Please enter your full name.'); return }
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) { setMsg('Enter a valid 10-digit Indian mobile number.'); return }
    setStatus('saving')
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        mobile: mobile ? `+91${mobile}` : null,
        age: age ? Number(age) : null,
        state: stateV || null,
        city: city.trim() || null,
      },
    })
    setStatus('idle')
    setMsg(error ? error.message : 'Saved ✓')
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={45} height={45} className="h-11 w-auto drop-shadow" />
          <span className="font-display font-bold text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
        <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">← Deals</Link>
      </nav>

      <div className="flex-1 px-5 py-10">
        <div className="max-w-xl mx-auto">
          {loading ? (
            <p className="text-center text-slate-400 py-20">Loading your profile…</p>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-8">
                <span className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                  {(fullName || email || 'U')[0]?.toUpperCase()}
                </span>
                <div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">{fullName || 'Your profile'}</h1>
                  <p className="text-slate-500 text-sm">{email}</p>
                </div>
              </div>

              <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Personal info</p>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Full name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email</label>
                  <input type="email" value={email} disabled className={`${inputCls} bg-slate-50 text-slate-500 cursor-not-allowed`} />
                  <p className="text-[11px] text-slate-400 mt-1">Email is your login — contact support to change it.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Mobile number</label>
                  <div className="flex items-center rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
                    <span className="px-3 py-3 bg-gray-50 text-gray-600 text-sm font-semibold border-r border-gray-300">+91</span>
                    <input type="tel" inputMode="numeric" value={mobile}
                      onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" className="flex-1 px-4 py-3 focus:outline-none text-gray-900" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Age</label>
                    <input type="number" min={1} max={120} value={age} onChange={e => setAge(e.target.value)} className={inputCls} />
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

                <div className="flex items-center gap-3 pt-1">
                  <button type="submit" disabled={status === 'saving'}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-60">
                    {status === 'saving' ? 'Saving…' : 'Save changes'}
                  </button>
                  {msg && <span className={`text-sm font-semibold ${msg.includes('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</span>}
                </div>
              </form>

              <button onClick={logout}
                className="mt-6 w-full border border-gray-200 hover:bg-gray-50 text-red-600 font-bold py-3 rounded-xl transition-colors">
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
