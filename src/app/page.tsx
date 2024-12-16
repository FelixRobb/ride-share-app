import { redirect } from 'next/navigation'
import WelcomePage from '@/components/WelcomePage'

export default function Home() {
  // Check if user is logged in
  const user = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null

  if (user) {
    redirect('/dashboard')
  }

  return <WelcomePage />
}

