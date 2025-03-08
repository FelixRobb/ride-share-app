"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"

import Layout from "@/components/Layout"
import type { User } from "@/types"
import AuthLoader from "@/components/AuthLoader"


const EditRidePage = dynamic(() => import("@/components/EditRidePage"), { ssr: false })

export default function EditRide() {

  const router = useRouter()
  const { id } = useParams()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return <AuthLoader />
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  if (!currentUser) {
    return <div>Error: User not found</div>
  }

  return (
    <Layout>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        <EditRidePage currentUser={currentUser} rideId={id as string} />
      </Suspense>
    </Layout>
  )
}

