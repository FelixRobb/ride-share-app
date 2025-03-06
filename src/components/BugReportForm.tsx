"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Bug, Loader } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { submitBugReport } from "@/utils/api"
import type { BugReportFormData } from "@/types"
import { useRouter } from "next/navigation"

export default function BugReportForm() {
    const [formData, setFormData] = useState<BugReportFormData>({
        title: "",
        description: "",
        steps_to_reproduce: "",
        severity: "medium",
        device_info: "",
        browser_info: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()


    // Get browser and device info automatically
    useEffect(() => {
        const browserInfo = `${navigator.userAgent}`
        const deviceInfo = `${window.innerWidth}x${window.innerHeight}, ${window.devicePixelRatio}x, ${navigator.platform}`

        setFormData((prev) => ({
            ...prev,
            browser_info: browserInfo,
            device_info: deviceInfo,
        }))
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            toast.error("Please provide a title for the bug report")
            return
        }

        if (!formData.description.trim() || formData.description.length < 10) {
            toast.error("Please provide a detailed description of the bug")
            return
        }

        setIsSubmitting(true)

        try {
            await submitBugReport(formData)
            setIsSuccess(true)
            toast.success("Bug report submitted successfully")

            // Reset form after success
            setTimeout(() => {
                setFormData({
                    title: "",
                    description: "",
                    steps_to_reproduce: "",
                    severity: "medium",
                    device_info: formData.device_info,
                    browser_info: formData.browser_info,
                })
                setIsSuccess(false)
            }, 3000)
        } catch {
            toast.error("Failed to submit bug report. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="mb-4">
                    Back to Dashboard
                </Button>
                <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    Report a Bug
                </CardTitle>
                <CardDescription>Help us improve by reporting any bugs or issues you encounter</CardDescription>
            </CardHeader>

            {isSuccess ? (
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full p-3 w-12 h-12 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium">Bug Report Submitted</h3>
                    <p className="text-sm text-muted-foreground">
                        Thank you for your report. Our team will investigate the issue as soon as possible.
                    </p>
                    <Button variant="outline" onClick={() => setIsSuccess(false)} className="mt-4">
                        Submit Another Report
                    </Button>
                </CardContent>
            ) : (
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900">
                            <AlertDescription>
                                Please provide as much detail as possible to help us reproduce and fix the issue.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label htmlFor="title">Bug Title</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Brief description of the issue"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Detailed explanation of what happened"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimum 10 characters. Please be specific about what you were doing when the bug occurred.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="steps_to_reproduce">Steps to Reproduce</Label>
                            <Textarea
                                id="steps_to_reproduce"
                                name="steps_to_reproduce"
                                placeholder="1. Go to... 2. Click on... 3. Observe that..."
                                value={formData.steps_to_reproduce}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="severity">Severity</Label>
                            <Select value={formData.severity} onValueChange={(value) => handleSelectChange("severity", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low - Minor issue, doesn&apos;t affect functionality</SelectItem>
                                    <SelectItem value="medium">Medium - Affects functionality but has workarounds</SelectItem>
                                    <SelectItem value="high">High - Major functionality is broken</SelectItem>
                                    <SelectItem value="critical">Critical - Application crashes or data loss</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="device_info">Device Info</Label>
                                <Input
                                    id="device_info"
                                    name="device_info"
                                    value={formData.device_info || ""}
                                    onChange={handleChange}
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="browser_info">Browser Info</Label>
                                <Input
                                    id="browser_info"
                                    name="browser_info"
                                    value={formData.browser_info || ""}
                                    onChange={handleChange}
                                    disabled
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Bug className="mr-2 h-4 w-4" />
                                    Submit Bug Report
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            )}
        </Card>
    )
}

