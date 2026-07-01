import { redirect } from 'next/navigation'

// Unified auth lives at /signup (Google + email OTP + profile gate).
// /login redirects there so there's a single sign-in experience.
export default function LoginPage() {
  redirect('/signup')
}
