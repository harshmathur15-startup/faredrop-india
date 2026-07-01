'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// TODO: replace with your real support inbox once set up (e.g. hello@travelbaby.in)
const CONTACT_EMAIL = 'hello@travelbaby.in'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject || 'Travelbaby enquiry')}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={45} height={45} className="h-11 w-auto drop-shadow" />
          <span className="font-black text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
        <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">← Back home</Link>
      </nav>

      <div className="flex-1 px-5 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">Contact us</p>
          <h1 className="text-4xl font-black text-slate-900 mb-3">We’d love to hear from you</h1>
          <p className="text-slate-600 mb-8">
            Questions about a deal, your subscription, or a partnership? Drop us a line and we’ll get back within 1–2 business days.
          </p>

          {/* Direct email */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-xl">✉️</div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email us directly</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-700 font-bold hover:underline">{CONTACT_EMAIL}</a>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Your name *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Your email *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Message *</label>
              <textarea required rows={5} value={message} onChange={e => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-y" />
            </div>
            <button type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
              Send message →
            </button>
            <p className="text-gray-400 text-xs text-center">This opens your email app with the message ready to send.</p>
          </form>
        </div>
      </div>

      <footer className="border-t border-gray-100 px-5 py-8 text-center text-sm text-slate-400 bg-white">
        <div className="flex justify-center gap-6 mb-3 flex-wrap">
          <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
          <Link href="/about" className="hover:text-slate-600 transition-colors">About</Link>
        </div>
        <p>© {new Date().getFullYear()} Travelbaby. Built with ❤️ for Indian travellers.</p>
      </footer>
    </main>
  )
}
