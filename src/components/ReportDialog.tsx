"use client"

import { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, Loader } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { submitReport } from "@/utils/api"

interface ReportDialogProps {
    reportedId: string
    reportedName: string
    reportType: "user" | "ride"
    rideId?: string
    trigger: React.ReactNode
}

const userReportReasons = [
    { value: "inappropriate_behavior", label: "Inappropriate Behavior" },
    { value: "harassment", label: "Harassment" },
    { value: "suspicious_activity", label: "Suspicious Activity" },
    { value: "fake_profile", label: "Fake Profile" },
    { value: "other", label: "Other" },
]

const rideReportReasons = [
    { value: "no_show", label: "No Show" },
    { value: "unsafe_driving", label: "Unsafe Driving" },
    { value: "inappropriate_behavior", label: "Inappropriate Behavior" },
    { value: "incorrect_information", label: "Incorrect Information" },
    { value: "other", label: "Other" },
]

export function ReportDialog({ reportedId, reportedName, reportType, rideId, trigger }: ReportDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [reason, setReason] = useState("")
    const [details, setDetails] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const reasonOptions = reportType === "user" ? userReportReasons : rideReportReasons

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!reason) {
            toast.error("Please select a reason for your report")
            return
        }

        if (details.length < 10) {
            toast.error("Please provide more details about the issue")
            return
        }

        setIsSubmitting(true)

        try {
            await submitReport({
                reason,
                details,
                report_type: reportType,
                reported_id: reportedId,
                ride_id: rideId || null,
            })

            setIsSuccess(true)
            toast.success("Report submitted successfully")
            
        } catch {
            toast.error("Failed to submit report. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Reset form when dialog is closed
            setReason("")
            setDetails("")
            setIsSuccess(false)
        }
        setIsOpen(open)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[calc(100vh-25%)] rounded-lg">
                {!isSuccess ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Report {reportType === "user" ? "User" : "Ride"}</DialogTitle>
                            <DialogDescription>
                                Report {reportType === "user" ? reportedName : "this ride"} for violating community guidelines.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    False reports may result in action against your account. Please only submit genuine concerns.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <label htmlFor="reason" className="text-sm font-medium">
                                    Reason for report
                                </label>
                                <Select value={reason} onValueChange={setReason}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reasonOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="details" className="text-sm font-medium">
                                    Details
                                </label>
                                <Textarea
                                    id="details"
                                    placeholder="Please provide specific details about the issue..."
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    rows={5}
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum 10 characters. Be specific and include relevant information.
                                </p>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                    )}
                                    Submit Report
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <div className="py-6 text-center space-y-4">
                        <div className="mx-auto bg-green-100 text-green-800 rounded-full p-3 w-12 h-12 flex items-center justify-center">
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
                        <h3 className="text-lg font-medium">Report Submitted</h3>
                        <p className="text-sm text-muted-foreground">
                            Thank you for your report. Our team will review it as soon as possible.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

