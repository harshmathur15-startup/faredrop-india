import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Terms & Conditions — Travelbaby',
  description:
    'The Terms & Conditions governing access to and use of Travelbaby (travelbaby.in), a travel marketplace and technology platform.',
}

const LAST_UPDATED = '22 September 2026'
const CONTACT_EMAIL = 'travelbabyin@gmail.com'
const LEGAL_NAME = 'Poonam Mathur'
const GSTIN = '07AAIPM7726P1ZZ'

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
            Travelbaby is a travel marketplace and digital platform that enables users to discover, compare, and book
            travel-related products and services. These Terms and Conditions (“Terms”) govern access to and use of the Travelbaby
            website, mobile application, and related services (collectively, the “Platform”). By creating an account, browsing,
            searching, registering, booking, subscribing, or otherwise using the Platform, you agree to be bound by these Terms.
          </p>
          <p className={P}>
            Travelbaby connects users with third-party travel service providers, including airlines, hotels, tour operators,
            transport providers, and other partners (“Suppliers”). Travelbaby may also provide software tools, booking
            functionality, dashboards, and operational services to facilitate travel planning and transactions. Travelbaby acts as
            a marketplace and technology intermediary and is not the direct provider of the underlying travel services unless
            expressly stated.
          </p>

          <h2 className={H2}>1. Eligibility</h2>
          <p className={P}>
            You must be at least 18 years of age to use the Platform, or use it under the supervision of a parent or legal guardian
            where permitted by applicable law.
          </p>
          <p className={P}>You represent and warrant that:</p>
          <ul className={UL}>
            <li>you have full legal capacity to enter into and perform these Terms;</li>
            <li>the information you provide is accurate, complete, and current;</li>
            <li>you will not use the Platform for unlawful, fraudulent, abusive, or deceptive purposes;</li>
            <li>you are authorized to make bookings on behalf of yourself and any travellers included in your booking.</li>
          </ul>
          <p className={P}>
            If you are booking travel to, from, or within India, you agree to comply with applicable Indian laws, immigration
            requirements, airline rules, destination requirements, and all relevant travel restrictions.
          </p>

          <h2 className={H2}>2. Platform Role and Marketplace Nature</h2>
          <p className={P}>Travelbaby provides a digital marketplace and technical services that enable users to:</p>
          <ul className={UL}>
            <li>search and compare travel services;</li>
            <li>view pricing, availability, and itinerary details;</li>
            <li>book travel-related products and services;</li>
            <li>make payments and manage reservations;</li>
            <li>receive itinerary updates, notifications, and customer support.</li>
          </ul>
          <p className={P}>
            The contract for the travel service is generally between the user and the relevant Supplier. Travelbaby may act as an
            intermediary and payment facilitator for such services. In some cases, Travelbaby may issue a booking confirmation, but
            this does not alter the Supplier’s responsibility for service delivery, quality, safety, and compliance. Where the
            Platform surfaces a deal and directs you to a Supplier or third-party site to complete the booking, that booking is a
            contract between you and the third party on their terms.
          </p>

          <h2 className={H2}>3. Account Registration</h2>
          <p className={P}>
            To use certain features of the Platform, you may be required to create an account. You are responsible for:
          </p>
          <ul className={UL}>
            <li>maintaining the confidentiality of your account credentials;</li>
            <li>keeping your account information accurate and up to date;</li>
            <li>promptly notifying Travelbaby of any unauthorized use of your account.</li>
          </ul>
          <p className={P}>
            Travelbaby may suspend or terminate access if it reasonably believes that your account is being used fraudulently,
            illegally, or in violation of these Terms.
          </p>

          <h2 className={H2}>4. Booking, Pricing, and Availability</h2>
          <p className={P}>
            The Platform allows users to search and book flights, hotels, holiday packages, transfers, activities, and other
            travel-related services. Availability, pricing, taxes, fees, and terms are subject to change without notice.
          </p>
          <p className={P}>You are responsible for:</p>
          <ul className={UL}>
            <li>reviewing the full booking details before confirming payment;</li>
            <li>verifying names, dates, travel dates, passenger details, itinerary information, baggage allowances, and cancellation terms;</li>
            <li>ensuring that all travellers meet the necessary travel documentation, visa, and entry requirements.</li>
          </ul>
          <p className={P}>
            Travelbaby will make reasonable efforts to present accurate information, but pricing, availability, or booking details
            may be changed or corrected by Suppliers or payment systems. If an error, invalid rate, or incorrect booking
            information is identified, Travelbaby may cancel, amend, or correct the booking and notify the user as appropriate.
          </p>

          <h2 className={H2}>5. Payment Terms</h2>
          <p className={P}>
            Payments may be processed through Travelbaby or directly by the Supplier, depending on the booking flow. You agree to
            pay all amounts due for your bookings, including:
          </p>
          <ul className={UL}>
            <li>the price of the booked service;</li>
            <li>applicable taxes, duties, fees, and charges;</li>
            <li>booking, service, convenience, or processing fees disclosed at checkout;</li>
            <li>any additional amounts charged by Suppliers or payment partners.</li>
          </ul>
          <p className={P}>By making a payment, you confirm that:</p>
          <ul className={UL}>
            <li>the payment method is valid and authorized;</li>
            <li>you are authorized to use it;</li>
            <li>you accept the booking and the disclosed terms.</li>
          </ul>
          <p className={P}>
            Travelbaby may refuse or cancel a booking where payment authorization fails, fraud is suspected, or the booking
            violates these Terms or applicable law. Payments are processed securely by our payment partner (Razorpay). Travelbaby
            does not store your full card or bank details; those are handled by the payment partner under their own terms and
            applicable Reserve Bank of India (RBI) rules.
          </p>

          <h2 className={H2}>6. Subscriptions and Recurring Billing</h2>
          <p className={P}>
            In addition to any per-booking charges, Travelbaby offers paid membership subscriptions (for example, the Silver plan)
            that unlock additional features such as premium deals and alerts. The plan, price, and billing frequency applicable to
            you are those displayed on our <Link href="/pricing" className="text-blue-700 font-semibold hover:underline">Pricing</Link> page at the time of purchase.
          </p>
          <ul className={UL}>
            <li>Subscriptions are <span className="font-semibold">recurring</span> and renew automatically at the end of each billing cycle until cancelled. By subscribing, you authorise Travelbaby and our payment partner (Razorpay) to charge your chosen payment method on each renewal, in accordance with applicable RBI rules on recurring payments (e-mandates).</li>
            <li>Subscription fees are stated in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise. A GST-compliant invoice is issued for paid subscriptions where applicable.</li>
            <li>We may change subscription pricing or plan features. Any change to your recurring price will be notified to you in advance and will apply only from a following billing cycle; you may cancel before it takes effect.</li>
          </ul>

          <h2 className={H2}>7. Cancellations, Amendments, Refunds, and Travel Disruptions</h2>
          <p className={P}>
            Cancellation, amendment, and refund rules depend on the type of booking, the Supplier policy, fare conditions, and the
            timing of the request. Travelbaby does not guarantee refunds or rebooking in all cases.
          </p>
          <p className={P}>Refund eligibility may be affected by:</p>
          <ul className={UL}>
            <li>Supplier policies;</li>
            <li>airline, hotel, or travel operator terms;</li>
            <li>cancellation timing;</li>
            <li>service disruption, force majeure, or operational events;</li>
            <li>travel insurance coverage, where applicable.</li>
          </ul>
          <p className={P}>
            If a booking is cancelled by a Supplier, disrupted by weather, strike, operational issues, public health concerns,
            government action, or other unforeseen events, the refund or alternative arrangement will be governed by the Supplier’s
            policy and any applicable law.
          </p>
          <p className={P}>
            Where Travelbaby collects the payment on behalf of a Supplier, any refund processed by Travelbaby will be subject to the
            Supplier’s refund policy and the recovery of funds from the Supplier. Travelbaby is not obliged to provide a refund
            beyond the amounts actually recovered or any refund required by law.
          </p>
          <p className={P}>
            <span className="font-semibold">Subscription cancellation.</span> You can cancel a paid membership subscription at any
            time from <Link href="/account" className="text-blue-700 font-semibold hover:underline">your account</Link> settings, or
            by emailing us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-700 font-semibold hover:underline">{CONTACT_EMAIL}</a>.
            Cancellation stops future renewals; your paid access continues until the end of the billing period you have already paid
            for and is not cut off immediately. Because access continues for the period you paid for, subscription fees are generally
            <span className="font-semibold"> non-refundable</span> for the current or past periods, except where a refund is required
            by law or is expressly agreed by us in writing (for example, a duplicate charge or a proven billing error). To request a
            refund in such cases, contact us within 7 days of the charge; approved refunds are made to the original payment method
            and may take 5–7 business days to reflect.
          </p>

          <h2 className={H2}>8. Travel to India and Cross-Border Travel Requirements</h2>
          <p className={P}>If you are travelling to, from, or within India, you are solely responsible for:</p>
          <ul className={UL}>
            <li>confirming visa, immigration, passport, and transit requirements;</li>
            <li>ensuring all travel documents are valid before departure;</li>
            <li>complying with airline, immigration, destination, and transit requirements;</li>
            <li>understanding any local laws, restrictions, health advisories, or safety measures applicable to your trip.</li>
          </ul>
          <p className={P}>
            Travelbaby does not guarantee visa approval, immigration clearance, or entry permission. We are not responsible for
            denial of boarding, refusal of entry, or service disruption caused by missing or invalid documentation, regulatory
            restrictions, or compliance issues.
          </p>
          <p className={P}>
            Users booking international or cross-border travel are solely responsible for ensuring that all travellers:
          </p>
          <ul className={UL}>
            <li>meet the documentation requirements of the country of departure, transit, and destination;</li>
            <li>possess valid passports, visas, insurance, and supporting documents where required;</li>
            <li>comply with any health, customs, security, or regulatory requirements applicable to the trip.</li>
          </ul>

          <h2 className={H2}>9. Supplier Responsibility and Third-Party Liability</h2>
          <p className={P}>Suppliers are responsible for providing the booked goods and services, including:</p>
          <ul className={UL}>
            <li>airline or transport services;</li>
            <li>accommodation quality and standards;</li>
            <li>excursions, transfers, and local activities;</li>
            <li>package fulfilment and scheduling;</li>
            <li>compliance with Supplier policies and applicable law.</li>
          </ul>
          <p className={P}>
            Travelbaby does not control or guarantee the quality, safety, reliability, or availability of Supplier services. Any
            complaint, service issue, delay, cancellation, or non-performance must be raised directly with the Supplier, although
            Travelbaby may assist with escalation where feasible.
          </p>
          <p className={P}>You agree that:</p>
          <ul className={UL}>
            <li>Supplier terms and policies apply to your booking;</li>
            <li>the Supplier may require additional conditions, identity checks, waivers, or local instructions;</li>
            <li>Travelbaby may not be able to intervene in every service failure and may not be liable for issues outside its reasonable control.</li>
          </ul>

          <h2 className={H2}>10. User Conduct and Prohibited Activities</h2>
          <p className={P}>You agree not to:</p>
          <ul className={UL}>
            <li>use the Platform for unlawful, deceptive, or fraudulent activity;</li>
            <li>generate fake bookings, manipulate pricing, or misuse promotional offers;</li>
            <li>attempt to access or exploit Platform systems, APIs, data, or accounts without authorization;</li>
            <li>post or transmit harmful, unlawful, abusive, defamatory, or intrusive content;</li>
            <li>interfere with other users’ access to or use of the Platform;</li>
            <li>impersonate another person or misrepresent your identity or affiliation.</li>
          </ul>
          <p className={P}>
            Travelbaby may suspend or terminate your access if we determine that you have violated these Terms or acted in a manner
            that jeopardizes security, fairness, or platform integrity.
          </p>

          <h2 className={H2}>11. Account Security and Responsibility</h2>
          <p className={P}>You are responsible for:</p>
          <ul className={UL}>
            <li>maintaining the confidentiality of your account credentials;</li>
            <li>ensuring that your account details are accurate and current;</li>
            <li>promptly notifying Travelbaby of any unauthorized use of your account.</li>
          </ul>
          <p className={P}>
            Travelbaby may restrict or suspend access if it detects suspicious or unauthorized account activity.
          </p>

          <h2 className={H2}>12. Communications and Deal Alerts</h2>
          <p className={P}>
            By creating an account or subscribing to alerts, you consent to receive deal alerts and service-related messages from
            Travelbaby by email and, where you have opted in, by WhatsApp or other channels. You can unsubscribe from marketing
            messages at any time using the link in the email or by contacting us. We may still send you essential account, billing,
            security, and legal notices, which are not marketing and cannot be opted out of while you hold an account.
          </p>

          <h2 className={H2}>13. Privacy and Data Protection</h2>
          <p className={P}>
            Travelbaby processes personal data in accordance with applicable privacy and data protection laws, including the
            Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and related rules and regulations as
            applicable.
          </p>
          <p className={P}>
            By using the Platform, you consent to the collection, use, storage, processing, and sharing of your personal data as
            required to:
          </p>
          <ul className={UL}>
            <li>provide booking and account services;</li>
            <li>process payments and verify identity;</li>
            <li>communicate support, updates, and travel confirmations;</li>
            <li>prevent fraud and improve platform security;</li>
            <li>comply with legal and regulatory obligations.</li>
          </ul>
          <p className={P}>
            Travelbaby may share information with Suppliers, payment providers, support partners, and regulatory authorities where
            required to provide the service or comply with applicable law. Users are responsible for ensuring that any personal
            information they provide about other travellers is provided with proper consent and lawful basis.
          </p>

          <h2 className={H2}>14. SaaS Services and Platform Features</h2>
          <p className={P}>
            Travelbaby may also provide SaaS features, dashboards, analytics, and operational tools to businesses, agencies, and
            travel operators. Additional terms may apply for such services where specifically disclosed.
          </p>
          <p className={P}>Your use of SaaS features must comply with:</p>
          <ul className={UL}>
            <li>lawful business use;</li>
            <li>requested access scope and permissions;</li>
            <li>security obligations and account controls;</li>
            <li>restrictions on scraping, reverse engineering, or unauthorized automation.</li>
          </ul>
          <p className={P}>
            Travelbaby may update, discontinue, or modify features at any time in response to technical, security, business, or
            regulatory requirements. We aim to provide continuity, but no service is guaranteed to be uninterrupted or error-free.
          </p>

          <h2 className={H2}>15. Intellectual Property</h2>
          <p className={P}>
            The Platform, website design, software, branding, content, graphics, interfaces, databases, algorithms, and related
            materials are the proprietary property of Travelbaby or its licensors.
          </p>
          <p className={P}>
            You may use the Platform for lawful personal and business use in accordance with these Terms. You may not:
          </p>
          <ul className={UL}>
            <li>reproduce, distribute, resell, sublicense, or commercialize Platform content or features without written authorization;</li>
            <li>reverse engineer, decompile, or extract source code except as expressly permitted by law;</li>
            <li>use Travelbaby branding or materials in a way that implies endorsement without permission.</li>
          </ul>

          <h2 className={H2}>16. Warranties and Disclaimers</h2>
          <p className={P}>
            The Platform is provided on an “as is” and “as available” basis. Travelbaby makes no express or implied warranties
            beyond those expressly stated in these Terms, including warranties of merchantability, fitness for a particular
            purpose, non-infringement, or uninterrupted availability.
          </p>
          <p className={P}>
            To the maximum extent permitted by applicable law, Travelbaby disclaims any guarantee that the Platform will be
            error-free, secure, or uninterrupted.
          </p>

          <h2 className={H2}>17. Limitation of Liability</h2>
          <p className={P}>To the maximum extent permitted by applicable law:</p>
          <ul className={UL}>
            <li>Travelbaby shall not be liable for indirect, incidental, consequential, special, punitive, or loss-of-business damages;</li>
            <li>Travelbaby’s aggregate liability arising out of or in connection with the Platform or these Terms shall not exceed the total fees actually paid by the user to Travelbaby for the relevant booking or service, or INR 5,000, whichever is lower, unless a higher standard is imposed by applicable law.</li>
          </ul>
          <p className={P}>
            This limitation does not exclude liability for fraud, willful misconduct, gross negligence, death, personal injury
            caused by Travelbaby’s negligence, or any liability that cannot be excluded under applicable Indian law.
          </p>

          <h2 className={H2}>18. Indemnification</h2>
          <p className={P}>
            You agree to indemnify and hold harmless Travelbaby, its affiliates, directors, employees, and representatives from any
            claims, liabilities, losses, damages, costs, and expenses arising from:
          </p>
          <ul className={UL}>
            <li>your use of the Platform;</li>
            <li>your booking decisions or omissions;</li>
            <li>your breach of these Terms;</li>
            <li>inaccurate or fraudulent information supplied by you;</li>
            <li>any violation of third-party rights or applicable law.</li>
          </ul>
          <p className={P}>
            This indemnity applies to claims arising from your actions, omissions, misuse of the Platform, or non-compliance with
            Supplier rules and legal obligations.
          </p>

          <h2 className={H2}>19. Suspension and Termination</h2>
          <p className={P}>
            Travelbaby may suspend or terminate your access to the Platform at any time, with or without notice, if:
          </p>
          <ul className={UL}>
            <li>you violate these Terms;</li>
            <li>your conduct creates legal, operational, reputational, or security risk;</li>
            <li>payment or booking issues arise;</li>
            <li>required compliance or regulatory requirements are not met.</li>
          </ul>
          <p className={P}>
            Upon termination, your right to use the Platform ends, but these Terms continue to apply to any prior use and any
            obligations accrued before termination.
          </p>

          <h2 className={H2}>20. Force Majeure</h2>
          <p className={P}>
            Travelbaby shall not be liable for delays, suspension, failure, or inability to perform services caused by events
            beyond its reasonable control, including:
          </p>
          <ul className={UL}>
            <li>natural disasters, pandemics, or public health emergencies;</li>
            <li>strikes, civil unrest, war, terrorism, or government actions;</li>
            <li>airline or transport disruptions;</li>
            <li>weather, closures, travel restrictions, or supply chain failures;</li>
            <li>acts of God or other events outside reasonable control.</li>
          </ul>

          <h2 className={H2}>21. Governing Law and Dispute Resolution</h2>
          <p className={P}>
            These Terms are governed by and construed in accordance with the laws of India, without regard to conflict of law
            principles.
          </p>
          <p className={P}>
            Any dispute arising out of or relating to these Terms shall first be attempted to be resolved amicably through
            good-faith negotiation. If a resolution cannot be reached, the dispute shall be subject to the exclusive jurisdiction of
            the competent courts at New Delhi, India.
          </p>
          <p className={P}>
            For consumers who are booking travel services as natural persons and are resident outside India, nothing in these Terms
            shall exclude rights granted to them under applicable consumer protection laws, mandatory provisions of the jurisdiction
            in which they reside, or applicable international travel regulations, where such rights cannot be lawfully waived.
          </p>

          <h2 className={H2}>22. Changes to the Terms</h2>
          <p className={P}>
            Travelbaby may update these Terms from time to time to reflect changes in legal requirements, services, billing
            practices, or operational needs. Updated Terms will be posted on the Platform, and continued use after the effective
            date constitutes acceptance of the revised Terms.
          </p>
          <p className={P}>
            If material changes are made, Travelbaby will endeavor to notify users through the Platform or by email where
            appropriate.
          </p>

          <h2 className={H2}>23. Grievance Redressal</h2>
          <p className={P}>
            In accordance with the Information Technology Act, 2000 and the rules made thereunder, and the Consumer Protection
            (E-Commerce) Rules, 2020, any grievance regarding the Platform, your personal data, a booking, or these Terms may be
            raised with our Grievance Officer (the Proprietor) by email at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-700 font-semibold hover:underline">{CONTACT_EMAIL}</a>. We aim to
            acknowledge grievances within 48 hours and to resolve them within a reasonable time, and in any event within the
            timelines prescribed under applicable law.
          </p>

          <h2 className={H2}>24. Contact</h2>
          <p className={P}>
            For questions, complaints, support requests, payment issues, booking disputes, or legal notices, contact:
          </p>
          <div className="text-slate-700 leading-relaxed mb-4">
            <p className="font-semibold text-slate-900">Travelbaby</p>
            <p>A sole proprietorship of {LEGAL_NAME}, trading as “Travelbaby”.</p>
            <p>GSTIN: {GSTIN}</p>
            <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-700 font-semibold hover:underline">{CONTACT_EMAIL}</a></p>
            <p>Website: <a href="https://www.travelbaby.in" className="text-blue-700 font-semibold hover:underline">www.travelbaby.in</a></p>
          </div>

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
