import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Terms & Conditions — Travelbaby',
  description:
    'Terms and Conditions governing access to and use of travelbaby.in, Travelbaby memberships, deal alerts, personalised searches, concierge assistance and related services.',
}

const LAST_UPDATED = '22 September 2026'

// Shared typography
const H2 = 'text-sm font-black text-slate-900 mt-8 mb-2 scroll-mt-24'
const P = 'text-slate-700 leading-relaxed mb-4'
const UL = 'list-disc pl-5 space-y-1.5 text-slate-700 leading-relaxed mb-4'

type Block =
  | { type: 'p'; text: string; lead?: string }
  | { type: 'ul'; items: string[] }
  | { type: 'address'; lines: string[] }

type Section = { n: number; title: string; blocks: Block[] }

const INTRO =
  'These Terms and Conditions govern access to and use of travelbaby.in, Travelbaby memberships, deal alerts, personalised searches, concierge assistance and related services. Please read them together with the Privacy Policy, Cookie Policy and Refund and Cancellation Policy displayed on the Platform.'

const DISCLOSURE =
  'Travelbaby helps users discover and evaluate travel opportunities. Unless Travelbaby expressly states otherwise for a particular service, Travelbaby does not sell, issue or fulfil airline tickets, hotel reservations or other underlying travel services. A user who selects a deal may be redirected to an airline, online travel agency, hotel or other independent provider to complete the booking and payment. That provider’s price and terms govern the booking, including changes, cancellations and refunds.'

const SECTIONS: Section[] = [
  {
    n: 1,
    title: 'About Travelbaby and acceptance',
    blocks: [
      { type: 'p', text: 'The Platform is operated by Poonam Mathur, a sole proprietor carrying on business under the trade name Travelbaby, GSTIN 07AAIPM7726P1ZZ (Travelbaby, we, us or our). Platform means the Travelbaby website, web application, communications, membership services and any related feature through which these Terms are made available.' },
      { type: 'p', text: 'By accessing or using the Platform, creating an account, purchasing a membership or other Travelbaby service, or clicking to accept these Terms, you enter into a binding agreement with Travelbaby. If you do not agree, do not use the Platform. If you use the Platform for another person or an organisation, you confirm that you are authorised to bind that person or organisation.' },
      { type: 'p', text: 'You must be at least 18 years old and legally capable of entering into a contract to create an account or purchase a paid service. The Platform is not directed to children. A parent or lawful guardian must independently manage any travel research relating to a child.' },
    ],
  },
  {
    n: 2,
    title: 'Travelbaby services',
    blocks: [
      { type: 'p', text: 'Travelbaby is a travel discovery and membership platform. Depending on the plan and features available at the relevant time, Travelbaby may provide:' },
      { type: 'ul', items: [
        'curated flight or travel deals and deal pages;',
        'fare discovery, comparison and personalised search tools;',
        'email, WhatsApp, SMS or in-product alerts chosen by the user;',
        'membership-based search limits, deal access or premium features;',
        'concierge, research or travel-planning assistance;',
        'information about loyalty programmes, credit cards, points, insurance, hotels and related travel products; and',
        'other discovery or planning tools described on the Platform.',
      ] },
      { type: 'p', text: 'Travelbaby may use automated tools, algorithms, third-party data and human review. A statement that a deal is verified means only that it was checked in the manner and at the time stated; it does not guarantee later availability or price.' },
    ],
  },
  {
    n: 3,
    title: 'Travelbaby is not the travel supplier',
    blocks: [
      { type: 'p', text: 'Unless expressly stated otherwise, Travelbaby is not an airline, hotel, online travel agency, tour operator, insurer, bank, payment network or other supplier of an underlying third-party product. When a user proceeds to a third-party site, the contract for that product is solely between the user and the third-party provider.' },
      { type: 'p', text: 'The third-party provider is responsible for inventory, booking acceptance, ticketing, payment for its product, service delivery, schedule changes, cancellations, baggage, refunds, customer support and compliance with its own obligations. Travelbaby may provide information or reasonable assistance, but doing so does not make Travelbaby a party to the booking or responsible for the provider’s acts or omissions.' },
      { type: 'p', text: 'A link, listing, ranking or reference to a provider is not an endorsement or warranty. Users must review the provider’s terms, privacy practices, fees and policies before transacting.' },
    ],
  },
  {
    n: 4,
    title: 'Fares, availability and deal descriptions',
    blocks: [
      { type: 'p', text: 'Travel prices are dynamic and time-sensitive. A fare or other price displayed by Travelbaby reflects information available when it was identified, captured or last refreshed. Travelbaby does not guarantee that a displayed fare, seat, fare class, route, date or itinerary will remain available when the user attempts to book.' },
      { type: 'p', text: 'A final price may differ because of inventory, taxes, currency conversion, passenger type, baggage, seats, meals, payment method, convenience fees, promotional conditions, provider pricing, data latency or technical error. The final price and booking details displayed by the third-party provider immediately before payment prevail. Users must independently verify all material details before purchase.' },
      { type: 'p', text: 'Descriptions such as deal, great fare, attractive fare, rare fare, best fare, lowest fare, effective price or starting from express Travelbaby’s assessment or the limited scope stated with the claim. They do not mean the fare is the lowest price available from every provider at every time. A starting-from price may apply only to limited dates, inventory, passenger types or payment conditions.' },
      { type: 'p', text: 'Travelbaby may correct or remove inaccurate, expired or incomplete information at any time. No displayed deal constitutes an offer by Travelbaby to issue or fulfil the underlying travel service.' },
    ],
  },
  {
    n: 5,
    title: 'Third-party information and links',
    blocks: [
      { type: 'p', text: 'The Platform may receive or display information from airlines, online travel agencies, data providers, banks, loyalty programmes and other third parties. Travelbaby uses reasonable efforts to present useful information but does not control all third-party data and cannot warrant that it is always complete, current or error-free.' },
      { type: 'p', text: 'Third-party sites and services are outside Travelbaby’s control. Travelbaby is not responsible for their availability, security, content, accessibility, cookies, data practices, transactions or performance. Users access them at their own discretion and subject to their terms.' },
    ],
  },
  {
    n: 6,
    title: 'Accounts and credentials',
    blocks: [
      { type: 'p', text: 'Certain features require an account. You must provide accurate, current information; keep credentials confidential; restrict access to your devices; and promptly notify Travelbaby of suspected unauthorised access. You are responsible for activity through your account to the extent caused by your acts or failure to take reasonable precautions.' },
      { type: 'p', text: 'Travelbaby may require verification, refuse registration, or temporarily restrict an account where reasonably necessary for security, fraud prevention, payment verification, legal compliance or investigation of a suspected breach. Travelbaby will not ask for your password through unsolicited messages.' },
    ],
  },
  {
    n: 7,
    title: 'Memberships and feature entitlements',
    blocks: [
      { type: 'p', text: 'Travelbaby may offer free and paid plans. The price, billing period, included features, usage limits and material plan conditions shown at checkout form part of these Terms. A membership is personal, non-transferable and may not be shared, resold or used to operate a commercial travel service unless Travelbaby agrees in writing.' },
      { type: 'p', text: 'Travelbaby may improve, replace or discontinue features. It will provide reasonable advance notice of a material adverse change to an active paid plan where practicable. Minor changes, security changes, beta features and changes required by law may take effect immediately.' },
    ],
  },
  {
    n: 8,
    title: 'Payments, taxes and invoices',
    blocks: [
      { type: 'p', text: 'Payments made directly to Travelbaby are for Travelbaby memberships, digital services, concierge services or another Travelbaby service expressly identified at checkout. Unless expressly stated otherwise, Travelbaby does not collect payment for airline tickets, hotels or other third-party travel products.' },
      { type: 'p', text: 'Travelbaby may use authorised payment processors, including Razorpay. The processor may apply its own terms and security controls. Travelbaby does not ordinarily receive or store complete card, bank-account or UPI credentials. You authorise Travelbaby and its processor to charge the selected payment method for the amount disclosed at checkout.' },
      { type: 'p', text: 'Prices are stated in Indian rupees and include or exclude applicable taxes as disclosed. Travelbaby may issue an invoice using the account and billing information supplied by the user. You must provide accurate GST or billing details before invoice generation; changes after issuance may not be possible.' },
      { type: 'p', text: 'Travelbaby may reject or reverse a transaction affected by failed authorisation, duplicate processing, manifest error, suspected fraud, sanctions, unlawful activity or a payment-provider instruction. You must not initiate an unjustified chargeback. This does not restrict a lawful dispute or statutory remedy.' },
    ],
  },
  {
    n: 9,
    title: 'Recurring subscriptions',
    blocks: [
      { type: 'p', text: 'Where checkout identifies a plan as recurring, the plan renews for the stated billing period until cancelled. By subscribing, you authorise recurring charges through the payment method and mandate approved by you, subject to applicable payment-system and regulatory requirements.' },
      { type: 'p', text: 'Travelbaby will disclose the price and renewal frequency before purchase. Any increase to the recurring price will apply prospectively after the notice or authentication required by law. If you do not accept a future renewal, cancel before that renewal is processed.' },
      { type: 'p', text: 'You may cancel through the account controls made available on the Platform or by emailing travelbabyin@gmail.com. Cancellation stops future renewals and ordinarily leaves access active until the end of the already-paid period.' },
    ],
  },
  {
    n: 10,
    title: 'Refunds for Travelbaby services',
    blocks: [
      { type: 'p', text: 'Unless the checkout terms state otherwise or applicable law requires a refund, fees for an activated membership period are non-refundable because digital access is made available immediately. Cancellation does not retrospectively cancel the current billing period.' },
      { type: 'p', text: 'Travelbaby will review a refund request for a duplicate charge, proven billing error, failure to provide the purchased Travelbaby service, or another ground required by law. Submit the request to travelbabyin@gmail.com with the account email and transaction reference. If approved, the refund will be sent to the original payment method; bank or payment-provider processing times are outside Travelbaby’s control.' },
      { type: 'p', text: 'Any more specific refund terms displayed at checkout prevail for the relevant service, but nothing in these Terms limits a non-excludable consumer right.' },
    ],
  },
  {
    n: 11,
    title: 'Third-party booking changes and refunds',
    blocks: [
      { type: 'p', text: 'For a booking completed with a third-party provider, all cancellation, rescheduling, no-show, refund, credit, chargeback, baggage, seat and service disputes are governed by that provider’s terms and applicable law. The user must ordinarily contact and pursue the provider that accepted payment. Travelbaby is not required to fund a third-party refund from its own resources.' },
    ],
  },
  {
    n: 12,
    title: 'Concierge and assistance',
    blocks: [
      { type: 'p', text: 'Concierge and research services are advisory unless a written service description expressly states otherwise. Travelbaby may identify or compare options, explain publicly available information, or help a user navigate a provider’s booking flow. The user remains responsible for reviewing and approving all details and completing the booking.' },
      { type: 'p', text: 'A concierge response is based on the user’s instructions and information available at the time. Travelbaby does not guarantee visas, entry, booking acceptance, savings, upgrades, reward availability or any particular travel outcome.' },
    ],
  },
  {
    n: 13,
    title: 'Credit cards, loyalty points and financial information',
    blocks: [
      { type: 'p', text: 'Information about credit cards, rewards, miles, transfer ratios, loyalty status, insurance or effective travel cost is general information and comparison content, not investment, legal, tax, banking, insurance or regulated financial advice. Product eligibility, benefits, exclusions, fees, redemption inventory and programme rules may change. Users must verify the current terms with the relevant issuer or programme before acting.' },
      { type: 'p', text: 'Travelbaby may receive an affiliate fee or other compensation if a user selects or purchases a partner offer. Sponsored or commercially promoted placements will be identified where required by law. Compensation does not guarantee suitability for a particular user.' },
    ],
  },
  {
    n: 14,
    title: 'Travel documents, health and destination requirements',
    blocks: [
      { type: 'p', text: 'The user is solely responsible for confirming names, dates, airports, itinerary, baggage, fare rules, passports, visas, transit permissions, immigration requirements, vaccination or health requirements, insurance, customs rules and destination restrictions. Such requirements can change without notice. Travelbaby does not guarantee boarding, visa approval, immigration clearance or entry.' },
      { type: 'p', text: 'Travelbaby does not provide medical, safety or government advice. Users should consult official authorities and qualified advisers where appropriate.' },
    ],
  },
  {
    n: 15,
    title: 'Alerts and communications',
    blocks: [
      { type: 'p', text: 'Travelbaby may send account, security, billing, transactional and legal communications necessary to provide the service. Optional deal alerts and marketing messages are sent through channels selected or consented to by the user, such as email or WhatsApp. Users may withdraw from optional marketing using the provided controls, without affecting service messages that remain necessary for an active account or transaction.' },
      { type: 'p', text: 'Alerts are informational and may be delayed, filtered or undelivered because of network, device, messaging-provider or contact-setting issues. Receipt of an alert does not reserve a fare or guarantee availability.' },
    ],
  },
  {
    n: 16,
    title: 'Privacy and personal data',
    blocks: [
      { type: 'p', text: 'Travelbaby processes personal data in accordance with its Privacy Policy and applicable law. The Privacy Policy describes the categories of personal data processed, purposes, lawful basis or consent where applicable, recipients, retention, security safeguards, cross-border processing where relevant, user rights and contact channels.' },
      { type: 'p', text: 'Acceptance of these Terms is not blanket consent to every use of personal data. Where consent is required, Travelbaby may present a separate, clear notice and affirmative choice. A user may withdraw consent using the means described in the Privacy Policy, subject to lawful processing already completed and consequences explained at the time of withdrawal.' },
      { type: 'p', text: 'If you provide another person’s personal data, including traveller details, you confirm that you are authorised to do so and have provided any required notice. Do not submit sensitive or unnecessary information through free-text fields or support messages.' },
      { type: 'p', text: 'Travelbaby may use service providers for hosting, analytics, communications, customer support, security and payments under appropriate contractual and security arrangements. No internet service is completely secure; users must also protect their accounts and devices.' },
    ],
  },
  {
    n: 17,
    title: 'Cookies and analytics',
    blocks: [
      { type: 'p', text: 'Travelbaby may use essential cookies and similar technologies needed for authentication, security, preferences and Platform operation. Non-essential analytics or advertising technologies will be governed by the Cookie Policy and available consent controls where required. Browser settings may affect certain features.' },
    ],
  },
  {
    n: 18,
    title: 'Acceptable use',
    blocks: [
      { type: 'p', text: 'You must not use or assist another person to use the Platform to:' },
      { type: 'ul', items: [
        'commit fraud, violate law, infringe rights or misrepresent identity or affiliation;',
        'interfere with security, availability or another user’s access;',
        'introduce malware, harmful code or excessive requests;',
        'probe, scan or test non-public systems, APIs, databases or infrastructure without written authorisation;',
        'obtain access through another person’s credentials or circumvent authentication, payment, plan or usage controls;',
        'generate false activity, manipulate rankings, misuse promotions or exploit manifest errors;',
        'copy, frame, mirror, republish or commercially exploit the Platform except as expressly permitted; or',
        'use the Platform in a way that creates legal, security, reputational or operational risk for Travelbaby or its users.',
      ] },
    ],
  },
  {
    n: 19,
    title: 'Prohibition on scraping, crawling and automated access',
    blocks: [
      { type: 'p', text: 'Except with Travelbaby’s prior written authorisation, you must not directly or indirectly:' },
      { type: 'ul', items: [
        'use a robot, bot, spider, crawler, scraper, script, browser-automation tool, data-mining tool or automated agent to access, query, monitor, extract or copy the Platform;',
        'systematically collect, download, aggregate, reproduce or compile fares, routes, dates, availability, deal information, rankings, alerts, recommendations or other Platform content;',
        'create or enrich a database, price-comparison service, travel-deal service, commercial dataset or competing product using data obtained from Travelbaby;',
        'use Travelbaby content or data to train, test, evaluate, ground or improve an artificial-intelligence or machine-learning system;',
        'circumvent rate limits, access restrictions, authentication, CAPTCHA, robots instructions or technical protection measures;',
        'use multiple accounts, identities, IP addresses, proxies or similar means to evade restrictions;',
        'reverse engineer, decompile or attempt to derive non-public source code, algorithms, data structures or deal-selection methods, except to the limited extent a restriction is prohibited by law; or',
        'permit, procure or enable any other person to do the foregoing.',
      ] },
      { type: 'p', text: 'Travelbaby grants bona fide public search-engine operators a limited, revocable permission to crawl publicly accessible pages solely to create general public search indexes, subject to robots.txt and other technical instructions. This permission does not extend to travel aggregators, price-comparison services, data brokers, AI crawlers, model training, commercial datasets or competing services.' },
      { type: 'p', text: 'Travelbaby may apply proportionate technical and legal measures against unauthorised automated access, including rate limits, access blocks, account suspension and preservation of evidence. Nothing in this section prohibits an activity that applicable law does not permit Travelbaby to restrict.' },
    ],
  },
  {
    n: 20,
    title: 'Intellectual property and licence',
    blocks: [
      { type: 'p', text: 'The Platform and Travelbaby content are owned by or licensed to Travelbaby. Protected materials include the Travelbaby name, logo, mascot, software, interface, text, graphics, original compilations, curated fare collections, deal datasets, historical pricing observations, route and date combinations, rankings, annotations, alerts, selection methods and presentation.' },
      { type: 'p', text: 'Subject to these Terms, Travelbaby grants each user a limited, revocable, non-exclusive, non-transferable licence to access the Platform for personal, non-commercial travel discovery. No ownership right is transferred. Third-party names and marks remain the property of their owners.' },
      { type: 'p', text: 'Feedback may be used by Travelbaby without restriction or payment, provided Travelbaby does not identify the user publicly without permission. Feedback does not transfer ownership of the user’s pre-existing intellectual property.' },
    ],
  },
  {
    n: 21,
    title: 'Beta and experimental features',
    blocks: [
      { type: 'p', text: 'A feature labelled beta, preview, experimental or similar may be incomplete, change without notice, and contain errors. Such features are provided for evaluation and may be withdrawn. Users should not rely on them for time-critical, safety-critical or irreversible decisions.' },
    ],
  },
  {
    n: 22,
    title: 'Platform availability and changes',
    blocks: [
      { type: 'p', text: 'Travelbaby aims to provide reliable service but does not guarantee uninterrupted, secure or error-free access. Maintenance, internet failures, cyber incidents, data-provider issues, third-party outages and events beyond reasonable control may affect availability. Travelbaby may change, suspend or discontinue a feature for operational, security, legal or commercial reasons.' },
    ],
  },
  {
    n: 23,
    title: 'Suspension and termination',
    blocks: [
      { type: 'p', text: 'Travelbaby may restrict, suspend or terminate access where reasonably necessary because of a material breach, fraud, unlawful conduct, non-payment, security risk, abuse, repeated chargebacks, infringement or harm to the Platform or another person. Where appropriate, Travelbaby may provide notice and an opportunity to cure.' },
      { type: 'p', text: 'A user may stop using the Platform and request account closure as described in the Privacy Policy. Subscription cancellation is governed by Sections 9 and 10. Provisions that by their nature should survive termination, including payment obligations, intellectual property, restrictions on data extraction, disclaimers, liability, indemnity and dispute provisions, continue to apply.' },
    ],
  },
  {
    n: 24,
    title: 'Disclaimers',
    blocks: [
      { type: 'p', text: 'The Platform is provided on an as-available and reasonable-efforts basis. To the maximum extent permitted by law, Travelbaby does not warrant that all information will always be accurate or complete, every search will identify the lowest fare, any deal will remain bookable, any saving will be achieved, third-party services will perform, or the Platform will be uninterrupted or free from harmful components.' },
      { type: 'p', text: 'Nothing in these Terms excludes a guarantee, warranty, duty or consumer right that cannot lawfully be excluded. Travelbaby remains responsible for its own obligations to the extent required by law.' },
    ],
  },
  {
    n: 25,
    title: 'Limitation of liability',
    blocks: [
      { type: 'p', text: 'To the maximum extent permitted by law, Travelbaby is not liable for indirect, incidental, special, punitive or consequential loss, loss of profit, opportunity, goodwill or data, or the cost of substitute travel, arising from use of the Platform. Travelbaby is not responsible for loss caused solely by an independent provider, the user’s failure to verify details, or an event outside Travelbaby’s reasonable control.' },
      { type: 'p', text: 'Where Travelbaby is legally liable in connection with a paid Travelbaby service, its aggregate liability arising from that service will not exceed the total amount paid by the user to Travelbaby for that service during the 12 months preceding the event giving rise to the claim.' },
      { type: 'p', text: 'The exclusions and cap do not apply to fraud, wilful misconduct, gross negligence where it cannot be limited, breach of confidentiality or data-protection obligations to the extent liability cannot be limited, death or personal injury caused by negligence where applicable, or any liability or statutory remedy that applicable law does not permit Travelbaby to exclude or limit.' },
    ],
  },
  {
    n: 26,
    title: 'Indemnity',
    blocks: [
      { type: 'p', text: 'To the extent permitted by law, you will indemnify Travelbaby and its proprietor, personnel and service providers against third-party claims, losses and reasonable costs directly arising from your fraud, unlawful conduct, deliberate misuse of the Platform, infringement of third-party rights, unauthorised extraction or commercial use of Platform content, or material breach of these Terms. This provision does not make a consumer responsible merely for ordinary lawful use or for loss caused by Travelbaby.' },
    ],
  },
  {
    n: 27,
    title: 'Force majeure',
    blocks: [
      { type: 'p', text: 'Travelbaby is not responsible for delay or failure caused by circumstances beyond its reasonable control, including natural disaster, epidemic, war, civil disturbance, government action, labour disruption, telecommunications or cloud outage, cyberattack not caused by Travelbaby’s failure to use legally required safeguards, or failure of a third-party data or payment network. This section does not excuse payment obligations already accrued or duties that cannot be excluded by law.' },
    ],
  },
  {
    n: 28,
    title: 'Complaints and grievance redressal',
    blocks: [
      { type: 'p', text: 'For a complaint about a Travelbaby service, contact the Grievance Officer with your name, account email, description of the issue, relevant transaction or screenshot, and the relief requested. Do not include card PINs, passwords or one-time passwords.' },
      { type: 'address', lines: [
        'Grievance Officer: Poonam Mathur',
        'Designation: Proprietor and Grievance Officer',
        'Business: Travelbaby',
        'Email: travelbabyin@gmail.com',
        'Telephone: +91 84485 33393',
        'Address: 291 RPS Sheikh Sarai Phase 1, New Delhi - 110017',
      ] },
      { type: 'p', text: 'Travelbaby will acknowledge a consumer grievance within 48 hours and endeavour to resolve it within one month of receipt, or within any shorter period required by applicable law. A user may also access the National Consumer Helpline or a competent consumer commission or other statutory forum where available.' },
    ],
  },
  {
    n: 29,
    title: 'Governing law and disputes',
    blocks: [
      { type: 'p', text: 'These Terms are governed by the laws of India. The parties should first attempt in good faith to resolve a dispute through the grievance process. Subject to non-excludable statutory rights of consumers, courts of competent jurisdiction in New Delhi will have jurisdiction.' },
      { type: 'p', text: 'Nothing in this section restricts a consumer from approaching a competent consumer commission or other statutory authority in a location or manner permitted by applicable law.' },
    ],
  },
  {
    n: 30,
    title: 'Changes to these Terms',
    blocks: [
      { type: 'p', text: 'Travelbaby may update these Terms to reflect changes in law, services, security, technology or business operations. The revised version will be posted with an updated effective date. A material change affecting an active paid subscription will be notified reasonably in advance where required or practicable. Continued use after the effective date constitutes acceptance of the revised Terms, but changes do not retrospectively remove accrued statutory rights.' },
    ],
  },
  {
    n: 31,
    title: 'General provisions',
    blocks: [
      { type: 'p', lead: 'Entire agreement.', text: 'These Terms, the Privacy Policy, Cookie Policy, Refund and Cancellation Policy, checkout disclosures and any service-specific terms form the agreement concerning the Platform. If service-specific terms conflict with these Terms, the service-specific terms prevail for that service.' },
      { type: 'p', lead: 'Severability.', text: 'If a provision is invalid or unenforceable, it will be modified only to the minimum extent necessary or severed, and the remaining provisions continue in effect.' },
      { type: 'p', lead: 'No waiver.', text: 'A failure or delay in enforcing a right is not a waiver. A waiver must be in writing and applies only to the stated circumstance.' },
      { type: 'p', lead: 'Assignment.', text: 'A user may not assign these Terms without Travelbaby’s written consent. Travelbaby may assign them in connection with a genuine transfer, restructuring or sale of the relevant business, subject to applicable law and without reducing consumer rights.' },
      { type: 'p', lead: 'No agency.', text: 'These Terms do not create a partnership, employment, fiduciary or agency relationship between the user and Travelbaby.' },
      { type: 'p', lead: 'Electronic records.', text: 'The user agrees that contracts, notices, invoices and communications may be provided electronically, subject to applicable law.' },
      { type: 'p', lead: 'Headings.', text: 'Headings aid navigation and do not limit the meaning of a provision.' },
    ],
  },
  {
    n: 32,
    title: 'Contact',
    blocks: [
      { type: 'address', lines: [
        'Travelbaby',
        'A sole proprietorship of Poonam Mathur',
        'GSTIN 07AAIPM7726P1ZZ',
        'Website www.travelbaby.in',
        'Email travelbabyin@gmail.com',
        'Telephone +91 84485 33393',
        'Address 291 RPS Sheikh Sarai Phase 1, New Delhi - 110017',
      ] },
    ],
  },
]

// Linkify email / phone / website inside an address line.
function linkifyAddress(line: string): ReactNode {
  const regex = /([\w.+-]+@[\w.-]+\.\w{2,})|(\+91[\d ]{6,})|(www\.[\w.-]+)/g
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const tok = m[0]
    const cls = 'text-blue-700 font-semibold hover:underline'
    if (tok.includes('@')) out.push(<a key={key++} href={`mailto:${tok}`} className={cls}>{tok}</a>)
    else if (tok.startsWith('+91')) out.push(<a key={key++} href={`tel:${tok.replace(/\s/g, '')}`} className={cls}>{tok}</a>)
    else out.push(<a key={key++} href={`https://${tok}`} className={cls}>{tok}</a>)
    last = m.index + tok.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

function renderBlock(block: Block, i: number): ReactNode {
  if (block.type === 'ul') {
    return <ul key={i} className={UL}>{block.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
  }
  if (block.type === 'address') {
    return (
      <div key={i} className="text-slate-700 leading-relaxed mb-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
        {block.lines.map((ln, j) => (
          <p key={j} className={j === 0 ? 'font-semibold text-slate-900' : ''}>{linkifyAddress(ln)}</p>
        ))}
      </div>
    )
  }
  return (
    <p key={i} className={P}>
      {block.lead && <span className="font-semibold text-slate-900">{block.lead} </span>}
      {block.text}
    </p>
  )
}

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
        <article className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '10px' }}>
          <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Terms &amp; Conditions</h1>
          <p className="text-[10px] text-slate-500 mb-8">Last updated: {LAST_UPDATED}</p>

          <p className={P}>{INTRO}</p>

          {/* Important service disclosure */}
          <div className="my-6 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2">Important Service Disclosure</p>
            <p className="text-slate-700 leading-relaxed">{DISCLOSURE}</p>
          </div>

          {SECTIONS.map(section => (
            <section key={section.n}>
              <h2 className={H2}>{section.n}. {section.title}</h2>
              {section.blocks.map((b, i) => renderBlock(b, i))}
            </section>
          ))}

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
        <p>© {new Date().getFullYear()} Travelbaby · All rights reserved</p>
      </footer>
    </main>
  )
}
