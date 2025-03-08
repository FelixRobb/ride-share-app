"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Bug, Loader, ArrowLeft, CheckCircle } from "lucide-react"

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
        <div className="container px-4 py-8 mx-auto">
            <Card className="w-full max-w-3xl mx-auto shadow-lg border-t-4 border-t-primary">
                <CardHeader className="pb-6">
                    <div className="flex justify-between items-center">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/dashboard")}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            size="sm"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <div className="bg-primary/10 text-primary rounded-full p-1.5">
                            <Bug className="h-5 w-5" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold mt-4">Report a Bug</CardTitle>
                    <CardDescription className="text-base mt-1">
                        Help us improve by reporting any bugs or issues you encounter
                    </CardDescription>
                </CardHeader>

                {isSuccess ? (
                    <CardContent className="pt-4 pb-8 text-center space-y-6">
                        <div className="mx-auto bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Bug Report Submitted</h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Thank you for your report. Our team will investigate the issue as soon as possible.
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsSuccess(false)}
                            className="mt-4"
                        >
                            Submit Another Report
                        </Button>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            <Alert className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900/50">
                                <AlertDescription className="flex items-start text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Please provide as much detail as possible to help us reproduce and fix the issue.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium">Bug Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Brief description of the issue"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="focus-visible:ring-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="severity" className="text-sm font-medium">Severity</Label>
                                <Select value={formData.severity} onValueChange={(value) => handleSelectChange("severity", value)}>
                                    <SelectTrigger className="focus-visible:ring-primary">
                                        <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                    <SelectContent className="max-w-[70vw] mx-auto overflow-hidden text-ellipsis whitespace-nowrap">
                                        <SelectItem value="low" className="flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                            <span className="truncate">Low - Minor issue, doesn&apos;t affect functionality</span>
                                        </SelectItem>
                                        <SelectItem value="medium" className="flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                                            <span className="truncate">Medium - Affects functionality but has workarounds</span>
                                        </SelectItem>
                                        <SelectItem value="high" className="flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                                            <span className="truncate">High - Major functionality is broken</span>
                                        </SelectItem>
                                        <SelectItem value="critical" className="flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                            <span className="truncate">Critical - Application crashes or data loss</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Detailed explanation of what happened"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    required
                                    className="focus-visible:ring-primary resize-y min-h-[100px]"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum 10 characters. Please be specific about what you were doing when the bug occurred.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="steps_to_reproduce" className="text-sm font-medium">Steps to Reproduce</Label>
                                <Textarea
                                    id="steps_to_reproduce"
                                    name="steps_to_reproduce"
                                    placeholder="1. Go to... 2. Click on... 3. Observe that..."
                                    value={formData.steps_to_reproduce}
                                    onChange={handleChange}
                                    rows={3}
                                    className="focus-visible:ring-primary resize-y"
                                />
                            </div>

                            <div className="bg-muted/40 p-4 rounded-lg space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">System Information (Automatically Detected)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="device_info" className="text-xs text-muted-foreground">Device Info</Label>
                                        <Input
                                            id="device_info"
                                            name="device_info"
                                            value={formData.device_info || ""}
                                            onChange={handleChange}
                                            disabled
                                            className="text-xs bg-background/50 text-muted-foreground"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="browser_info" className="text-xs text-muted-foreground">Browser Info</Label>
                                        <Input
                                            id="browser_info"
                                            name="browser_info"
                                            value={formData.browser_info || ""}
                                            onChange={handleChange}
                                            disabled
                                            className="text-xs bg-background/50 text-muted-foreground truncate"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-2 pb-6 px-6">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.push("/dashboard")}
                                className="w-full sm:w-auto order-2 sm:order-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full sm:w-auto order-1 sm:order-2 ${formData.severity ? `bg-${formData.severity === 'critical' ? 'red' : formData.severity === 'high' ? 'orange' : formData.severity === 'medium' ? 'amber' : 'green'}-600 hover:bg-${formData.severity === 'critical' ? 'red' : formData.severity === 'high' ? 'orange' : formData.severity === 'medium' ? 'amber' : 'green'}-700` : ''
                                    }`}
                            >
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
        </div>
    )
}