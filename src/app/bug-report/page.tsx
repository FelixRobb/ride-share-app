"use client"

import { useSession } from "next-auth/react"
import BugReportForm from "@/components/BugReportForm"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"


export default function BugReportPage() {
    const router = useRouter()
    const { status } = useSession()

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    return (
        <Layout>
            <BugReportForm />
        </Layout>
    )
}

