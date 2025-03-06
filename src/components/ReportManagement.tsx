"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { CheckCircle, Clock, Eye, Filter, Loader, RefreshCw, ShieldAlert, XCircle } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Report } from "@/types"

interface ReportStats {
    totalReports: number
    pendingReports: number
    byType: { report_type: string; count: number }[]
    byStatus: { status: string; count: number }[]
    byReason: { reason: string; count: number }[]
}

export default function ReportManagement() {
    // State
    const [reports, setReports] = useState<Report[]>([])
    const [stats, setStats] = useState<ReportStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string>("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Dialog states
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
    const [newStatus, setNewStatus] = useState<string>("")
    const [adminNotes, setAdminNotes] = useState<string>("")
    const [isUpdating, setIsUpdating] = useState(false)

    // Fetch reports - memoized to avoid recreation on each render
    const fetchReports = useCallback(async (page = 1, status = "") => {
        try {
            setIsRefreshing(true)
            const response = await fetch(`/api/admin/reports?page=${page}&status=${status}`)

            if (!response.ok) {
                throw new Error("Failed to fetch reports")
            }

            const data = await response.json()
            setReports(data.reports)
            setTotalPages(data.pagination.totalPages)
            setCurrentPage(data.pagination.page)
        } catch {
            toast.error("Failed to load reports")
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    // Fetch report statistics - memoized
    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/reports/stats")

            if (!response.ok) {
                throw new Error("Failed to fetch report statistics")
            }

            const data = await response.json()
            setStats(data)
        } catch {
            toast.error("Failed to load report statistics")
        }
    }, [])

    // Initial data fetch
    useEffect(() => {
        fetchReports(currentPage, statusFilter)
        fetchStats()
    }, [currentPage, statusFilter, fetchReports, fetchStats])

    // Handle refresh
    const handleRefresh = () => {
        fetchReports(currentPage, statusFilter)
        fetchStats()
    }

    // Handle status filter change
    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value)
        setCurrentPage(1)
    }

    // Handle pagination
    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    // View report details
    const handleViewReport = (report: Report) => {
        setSelectedReport(report)
        setViewDialogOpen(true)
    }

    // Open update dialog
    const handleOpenUpdateDialog = (report: Report) => {
        setSelectedReport(report)
        setNewStatus(report.status)
        setAdminNotes("")
        setUpdateDialogOpen(true)
    }

    // Update report status
    const handleUpdateReport = async () => {
        if (!selectedReport) return

        setIsUpdating(true)
        try {
            const response = await fetch(`/api/admin/reports/${selectedReport.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: newStatus,
                    adminNotes,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to update report")
            }

            toast.success("Report updated successfully")
            setUpdateDialogOpen(false)

            // Refresh reports
            fetchReports(currentPage, statusFilter)
        } catch {
            toast.error("Failed to update report")
        } finally {
            setIsUpdating(false)
        }
    }

    // Reset dialog states when closed
    const handleViewDialogClose = () => {
        setViewDialogOpen(false)
        // Small delay to prevent UI flicker
    }

    const handleUpdateDialogClose = () => {
        setUpdateDialogOpen(false)
        // Don't reset selectedReport here as it might be needed for view dialog
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                )
            case "reviewed":
                return (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        <Eye className="h-3 w-3 mr-1" />
                        Reviewed
                    </Badge>
                )
            case "resolved":
                return (
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                    </Badge>
                )
            case "dismissed":
                return (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Dismissed
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    // Format reason for display
    const formatReason = (reason: string) => {
        return reason
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Report Management</h2>
                <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
                    {isRefreshing ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="reports" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle>User Reports</CardTitle>
                                    <CardDescription>Manage and respond to user reports</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Reports</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="reviewed">Reviewed</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="dismissed">Dismissed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="text-center py-8">
                                    <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium">No reports found</h3>
                                    <p className="text-muted-foreground mt-2">
                                        {statusFilter
                                            ? `There are no ${statusFilter} reports at this time.`
                                            : "There are no reports at this time."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Reporter</TableHead>
                                                    <TableHead>Reported</TableHead>
                                                    <TableHead className="hidden md:table-cell">Reason</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reports.map((report) => (
                                                    <TableRow key={report.id}>
                                                        <TableCell>
                                                            <Badge variant={report.report_type === "user" ? "default" : "secondary"}>
                                                                {report.report_type === "user" ? "User" : "Ride"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{report.reporter_name}</TableCell>
                                                        <TableCell>{report.reported_name}</TableCell>
                                                        <TableCell className="hidden md:table-cell">{formatReason(report.reason)}</TableCell>
                                                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            {new Date(report.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex space-x-2">
                                                                <Button variant="outline" onClick={() => handleViewReport(report)}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View Details
                                                                </Button>
                                                                <Button variant="outline" onClick={() => handleOpenUpdateDialog(report)}>
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Update Status
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Page {currentPage} of {totalPages}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handlePreviousPage}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleNextPage}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="statistics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Report Statistics</CardTitle>
                            <CardDescription>Overview of reporting activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!stats ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">Total Reports</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold">{stats.totalReports}</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">Pending Reports</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold">{stats.pendingReports}</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">Resolution Rate</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold">
                                                    {stats.totalReports > 0
                                                        ? `${Math.round(
                                                            ((stats.totalReports - stats.pendingReports) / stats.totalReports) * 100
                                                        )}%`
                                                        : "0%"}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">Reports by Type</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {stats.byType.map((item) => (
                                                        <div key={item.report_type} className="flex items-center justify-between">
                                                            <span className="capitalize">{item.report_type} Reports</span>
                                                            <Badge variant="outline">{item.count}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">Reports by Status</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {stats.byStatus.map((item) => (
                                                        <div key={item.status} className="flex items-center justify-between">
                                                            <span className="capitalize">{item.status}</span>
                                                            <Badge variant="outline">{item.count}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {stats.byReason.length > 0 && (
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">Reports by Reason</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {stats.byReason.map((item) => (
                                                        <div key={item.reason} className="flex items-center justify-between">
                                                            <span>{formatReason(item.reason)}</span>
                                                            <Badge variant="outline">{item.count}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* View Report Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={handleViewDialogClose}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-lg overflow-auto w-11/12">
                    <DialogHeader>
                        <DialogTitle>Report Details</DialogTitle>
                        <DialogDescription>Detailed information about the report</DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <ScrollArea className="max-h-[70vh]">
                            <div className="space-y-4 pr-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Report Type</h3>
                                        <Badge variant={selectedReport.report_type === "user" ? "default" : "secondary"} className="mb-4">
                                            {selectedReport.report_type === "user" ? "User Report" : "Ride Report"}
                                        </Badge>

                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                                        <div className="mb-4">{getStatusBadge(selectedReport.status)}</div>

                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Reported On</h3>
                                        <p className="mb-4">{new Date(selectedReport.created_at).toLocaleString()}</p>

                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Reason</h3>
                                        <p className="mb-4">{formatReason(selectedReport.reason)}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Reporter</h3>
                                        <p className="mb-4">{selectedReport.reporter_name}</p>

                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Reported User</h3>
                                        <p className="mb-4">{selectedReport.reported_name}</p>

                                        {selectedReport.ride_id && (
                                            <>
                                                <h3 className="text-sm font-medium text-muted-foreground mb-1">Related Ride</h3>
                                                <p className="mb-4">{selectedReport.ride_id}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Report Details</h3>
                                    <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">{selectedReport.details}</div>
                                </div>

                                {selectedReport.admin_notes && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Admin Notes</h3>
                                        <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">{selectedReport.admin_notes}</div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleViewDialogClose}>
                            Close
                        </Button>
                        <Button onClick={() => {
                            const reportToUpdate = selectedReport;
                            handleViewDialogClose();
                            setTimeout(() => handleOpenUpdateDialog(reportToUpdate!), 100);
                        }}>
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Report Dialog */}
            <Dialog open={updateDialogOpen} onOpenChange={handleUpdateDialogClose}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-lg overflow-auto w-11/12">
                    <DialogHeader>
                        <DialogTitle>Update Report Status</DialogTitle>
                        <DialogDescription>Change the status of this report and add admin notes</DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Current Status</h3>
                                <div>{getStatusBadge(selectedReport.status)}</div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">New Status</h3>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select new status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                                                Pending
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="reviewed">
                                            <div className="flex items-center">
                                                <Eye className="h-4 w-4 mr-2 text-blue-500" />
                                                Reviewed
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="resolved">
                                            <div className="flex items-center">
                                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                                Resolved
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="dismissed">
                                            <div className="flex items-center">
                                                <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                                                Dismissed
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Admin Notes</h3>
                                <Textarea
                                    placeholder="Add notes about this report (internal only)"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                    These notes are only visible to administrators.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleUpdateDialogClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateReport} disabled={isUpdating}>
                            {isUpdating ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}