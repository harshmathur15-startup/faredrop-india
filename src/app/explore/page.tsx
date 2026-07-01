import { redirect } from 'next/navigation'

// Explore is temporarily disabled / hidden from users.
// Original implementation preserved at /explore-page-original.tsx.bak — restore when re-enabling.
export default function ExplorePage() {
  redirect('/')
}
