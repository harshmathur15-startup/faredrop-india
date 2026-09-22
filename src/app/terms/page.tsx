import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Terms & Conditions — Travelbaby',
  description:
    'The terms and conditions governing your use of Travelbaby (travelbaby.in), India’s curated flight-deal discovery and alerts service.',
}

const LAST_UPDATED = '22 September 2026'
const CONTACT_EMAIL = 'hello@travelbaby.in'

// Shared typography
const H2 = 'text-xl font-black text-slate-900 mt-10 mb-3 scroll-mt-24'
const P = 'text-slate-700 leading-relaxed mb-4'
const UL = 'list-disc pl-5 space-y-1.5 text-slate-700 leading-relaxed mb-4'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/travel-baby-logo.png" alt="Travelbaby" width={45} height={45} className="h-11 w-auto drop-shadow" />
          <span className="font-black text-lg text-blue-900 tracking-tight">Travelbaby</span>
        </Link>
        <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">← Back home</Link>
      </nav>

      <div className="flex-1 px-5 py-12">
        <article className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Terms &amp; Conditions</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: {LAST_UPDATED}</p>

          <p className={P}>
            These Terms &amp; Conditions (“Terms”) form a legally binding agreement between you (“you”, “your”, or “User”)
            and Travelbaby (“Travelbaby”, “we”, “us”, or “our”), the operator of the website{' '}
            <span className="font-semibold">travelbaby.in</span> and its related pages, alerts, and services (together, the
            “Service”). Travelbaby is based in New Delhi, India. By accessing or using the Service, creating an account, or
            subscribing to a paid plan, you confirm that you have read, understood, and agree to be bound by these Terms and by
            our privacy practices described below. If you do not agree, please do not use the Service.
          </p>

          <h2 className={H2}>1. What Travelbaby is (and is not)</h2>
          <p className={P}>
            Travelbaby is a flight-deal <span className="font-semibold">discovery and alerts</span> platform. We monitor
            publicly available fares across many routes and surface deals we believe are noteworthy for travellers in India.
            We are <span className="font-semibold">not</span> an airline, a travel agent, a tour operator, or an online travel
            agency (OTA), and we do <span className="font-semibold">not</span> sell, issue, book, or hold flight tickets or any
            other travel product.
          </p>
          <p className={P}>
            When you act on a deal, you are taken to a third party (for example Google Flights, an airline, or an OTA) to search,
            price, and complete any booking. Your booking is a contract between you and that third party, on their terms. Travelbaby
            is not a party to, and has no responsibility for, that transaction.
          </p>

          <h2 className={H2}>2. Fare information &amp; accuracy</h2>
          <p className={P}>
            Airfares are dynamic and change constantly. Prices, availability, routings, timings, and other details shown on the
            Service are <span className="font-semibold">indicative</span>, are sourced from third parties, and may be delayed,
            incomplete, or no longer available by the time you view or click them. We do not guarantee that any deal, price, seat,
            or fare class will be available at the point of booking.
          </p>
          <p className={P}>
            <span className="font-semibold">Always verify the final price, dates, baggage, and conditions on the airline or booking
            provider’s own page before you pay.</span> Travelbaby is not liable for any difference between a price shown on the
            Service and the price offered by a third party, or for any deal that has expired or sold out.
          </p>

          <h2 className={H2}>3. Eligibility &amp; accounts</h2>
          <ul className={UL}>
            <li>You must be at least 18 years old and legally capable of entering into a binding contract under Indian law.</li>
            <li>You agree to provide accurate, current information when you sign up and to keep it updated.</li>
            <li>You are responsible for all activity under your account and for keeping your login credentials secure. Notify us promptly of any unauthorised use.</li>
            <li>You may not share, sell, or transfer your account or subscription to anyone else.</li>
          </ul>

          <h2 className={H2}>4. Free alerts &amp; communications</h2>
          <p className={P}>
            By subscribing to alerts or creating an account, you consent to receive deal alerts and service-related messages from
            us by email and, where you have opted in, by WhatsApp or other channels. You can unsubscribe from marketing messages
            at any time using the link in the email or by contacting us. We may still send you essential account, billing, and
            legal notices.
          </p>

          <h2 className={H2}>5. Subscriptions, fees &amp; billing</h2>
          <ul className={UL}>
            <li>Some features are offered under paid subscription plans, as described on our <Link href="/pricing" className="text-blue-700 font-semibold hover:underline">Pricing</Link> page. The plan, price, and billing frequency applicable to you are those displayed at the time of purchase.</li>
            <li>Fees are stated in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise. A GST-compliant invoice is issued for paid subscriptions where applicable.</li>
            <li>Paid subscriptions are <span className="font-semibold">recurring</span> and renew automatically at the end of each billing cycle until cancelled. By subscribing, you authorise us and our payment partner to charge your chosen payment method on each renewal.</li>
            <li>Payments are processed securely by <span className="font-semibold">Razorpay</span>. We do not store your full card or bank details; those are handled by the payment partner under their own terms and applicable RBI rules.</li>
            <li>We may change subscription pricing or plan features. Any change to your recurring price will be notified to you in advance and will apply only from a following billing cycle; you may cancel before it takes effect.</li>
          </ul>

          <h2 className={H2}>6. Cancellation &amp; refunds</h2>
          <ul className={UL}>
            <li>You can cancel a paid subscription at any time from <Link href="/account" className="text-blue-700 font-semibold hover:underline">your account</Link> settings, or by emailing us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-700 font-semibold hover:underline">{CONTACT_EMAIL}</a>.</li>
            <li>Cancellation stops future renewals. Your paid access continues until the end of the billing period you have already paid for; it is not cut off immediately.</li>
            <li>Because access continues for the period you paid for, subscription fees are generally <span className="font-semibold">non-refundable</span> for the current or past periods, except where a refund is required by law or is expressly agreed by us in writing (for example, a duplicate charge or a proven billing error).</li>
            <li>To request a refund in such cases, contact us at {CONTACT_EMAIL} within 7 days of the charge with your account and payment details. Approved refunds are made to the original payment method and may take 5–7 business days to reflect, depending on your bank and the payment partner.</li>
          </ul>

          <h2 className={H2}>7. Marketplace roles (creators &amp; agents)</h2>
          <p className={P}>
            Travelbaby also connects travel creators and travel agents. If you participate as a creator or agent, additional
            terms — including commission, payout, and content rules — may apply and, where separately agreed, will govern that
            relationship in addition to these Terms. Commissions are payable only on genuinely confirmed bookings as defined in
            those arrangements.
          </p>

          <h2 className={H2}>8. Acceptable use</h2>
          <p className={P}>You agree not to:</p>
          <ul className={UL}>
            <li>scrape, crawl, harvest, resell, or systematically extract deals, data, or content from the Service;</li>
            <li>use the Service for any unlawful, fraudulent, or infringing purpose, or to transmit malware;</li>
            <li>attempt to gain unauthorised access to the Service, other accounts, or our systems, or interfere with their normal operation;</li>
            <li>misrepresent your identity or impersonate any person or entity.</li>
          </ul>

          <h2 className={H2}>9. Intellectual property</h2>
          <p className={P}>
            The Service, including its content, curation, design, logos, and the “Travelbaby” name, is owned by us or our licensors
            and is protected by applicable laws. We grant you a limited, personal, non-exclusive, non-transferable, revocable
            licence to use the Service for your own non-commercial use. You may not copy, modify, distribute, or create derivative
            works without our prior written consent. Airline names, third-party marks, and destination imagery belong to their
            respective owners.
          </p>

          <h2 className={H2}>10. User-submitted content</h2>
          <p className={P}>
            If you submit content to us (such as deal requests, reviews, or messages), you grant us a non-exclusive, royalty-free,
            worldwide licence to use it to operate and improve the Service. You are responsible for what you submit and confirm you
            have the right to share it. We may remove content that violates these Terms or applicable law.
          </p>

          <h2 className={H2}>11. Third-party links &amp; services</h2>
          <p className={P}>
            The Service links to and relies on third-party websites and services (airlines, Google Flights, OTAs, payment and
            messaging providers). We do not control and are not responsible for their content, availability, pricing, policies, or
            practices. Your use of a third-party service is governed by that party’s own terms and privacy policy.
          </p>

          <h2 className={H2}>12. Disclaimers</h2>
          <p className={P}>
            The Service is provided on an “as is” and “as available” basis, without warranties of any kind, whether express or
            implied, including as to fare accuracy, availability, merchantability, fitness for a particular purpose, or
            uninterrupted access. We do not warrant that any deal will result in a successful or lower-priced booking, or that the
            Service will be error-free.
          </p>

          <h2 className={H2}>13. Limitation of liability</h2>
          <p className={P}>
            To the maximum extent permitted by law, Travelbaby and its team will not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or for any loss arising from bookings, cancellations, fare changes,
            missed deals, travel disruptions, or your dealings with third parties. Our total aggregate liability to you for any
            claim relating to the Service will not exceed the amount you paid us for the subscription in the twelve (12) months
            before the event giving rise to the claim (or ₹1,000, if you have not paid us anything).
          </p>

          <h2 className={H2}>14. Indemnity</h2>
          <p className={P}>
            You agree to indemnify and hold harmless Travelbaby from any claims, losses, liabilities, and expenses (including
            reasonable legal fees) arising out of your misuse of the Service, your breach of these Terms, or your violation of any
            law or third-party right.
          </p>

          <h2 className={H2}>15. Privacy</h2>
          <p className={P}>
            We collect and process personal data — such as your name, email, phone number, and usage information — to operate the
            Service, send alerts, process payments, and improve our product. We use trusted processors (including our hosting,
            email, analytics, and payment partners) and do not sell your personal data. Payment details are handled by our payment
            partner and are not stored by us. You may request access to, correction of, or deletion of your data by contacting us
            at {CONTACT_EMAIL}. By using the Service you consent to this processing.
          </p>

          <h2 className={H2}>16. Suspension &amp; termination</h2>
          <p className={P}>
            We may suspend or terminate your access to the Service, with or without notice, if you breach these Terms or use the
            Service in a way that may cause harm or legal exposure. You may stop using the Service at any time and cancel any paid
            plan as described above. Sections that by their nature should survive termination (including intellectual property,
            disclaimers, limitation of liability, and governing law) will continue to apply.
          </p>

          <h2 className={H2}>17. Changes to these Terms or the Service</h2>
          <p className={P}>
            We may update these Terms or the Service from time to time. When we make material changes, we will update the “Last
            updated” date above and, where appropriate, notify you. Your continued use of the Service after changes take effect
            means you accept the updated Terms.
          </p>

          <h2 className={H2}>18. Governing law &amp; jurisdiction</h2>
          <p className={P}>
            These Terms are governed by the laws of India. Subject to any applicable consumer-protection rights, the courts at
            New Delhi, India will have exclusive jurisdiction over any dispute arising out of or in connection with these Terms or
            the Service.
          </p>

          <h2 className={H2}>19. Grievance redressal &amp; contact</h2>
          <p className={P}>
            In accordance with applicable Indian law, any grievance regarding the Service, your data, or these Terms may be raised
            with our grievance contact by email at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-700 font-semibold hover:underline">{CONTACT_EMAIL}</a>. We aim
            to acknowledge grievances within 48 hours and to resolve them within a reasonable time. For general queries you can
            also reach us via our <Link href="/contact" className="text-blue-700 font-semibold hover:underline">Contact</Link> page.
          </p>

          <h2 className={H2}>20. General</h2>
          <ul className={UL}>
            <li>If any provision of these Terms is found unenforceable, the remaining provisions continue in full effect.</li>
            <li>Our failure to enforce any right is not a waiver of that right.</li>
            <li>You may not assign these Terms; we may assign them to a successor or affiliate.</li>
            <li>We are not liable for failures caused by events beyond our reasonable control (force majeure).</li>
            <li>These Terms, together with any plan-specific or role-specific terms we provide, are the entire agreement between you and us regarding the Service.</li>
          </ul>

          <p className="text-slate-500 text-sm mt-10 pt-6 border-t border-gray-100">
            By using Travelbaby, you acknowledge that you have read and agree to these Terms &amp; Conditions.
          </p>
        </article>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-5 py-8 text-center text-sm text-slate-400 bg-white">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/terms" className="hover:text-slate-600">Terms</Link>
          <Link href="/about" className="hover:text-slate-600">About</Link>
          <Link href="/contact" className="hover:text-slate-600">Contact</Link>
        </div>
        <p>© {new Date().getFullYear()} Travelbaby. Built with ❤️ for Indian travellers.</p>
      </footer>
    </main>
  )
}
