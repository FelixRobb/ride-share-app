"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Bug, CheckCircle, Clock, Eye, Filter, Loader, RefreshCw, XCircle } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { BugReport, BugReportStats } from "@/types"

export default function BugReportManagement() {
  // State
  const [bugReports, setBugReports] = useState<BugReport[]>([])
  const [stats, setStats] = useState<BugReportStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Dialog states
  const [selectedBugReport, setSelectedBugReport] = useState<BugReport | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("")
  const [adminNotes, setAdminNotes] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch bug reports - memoized to avoid recreation on each render
  const fetchBugReports = useCallback(async (page = 1, status = "") => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/admin/bug-reports?page=${page}&status=${status}`)

      if (!response.ok) {
        throw new Error("Failed to fetch bug reports")
      }

      const data = await response.json()
      setBugReports(data.bugReports)
      setTotalPages(data.pagination.totalPages)
      setCurrentPage(data.pagination.page)
    } catch {
      toast.error("Failed to load bug reports")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Fetch bug report statistics - memoized
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/bug-reports/stats")

      if (!response.ok) {
        throw new Error("Failed to fetch bug report statistics")
      }

      const data = await response.json()
      setStats(data)
    } catch {
      toast.error("Failed to load bug report statistics")
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchBugReports(currentPage, statusFilter)
    fetchStats()
  }, [currentPage, statusFilter, fetchBugReports, fetchStats])

  // Handle refresh
  const handleRefresh = () => {
    fetchBugReports(currentPage, statusFilter)
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

  // View bug report details
  const handleViewBugReport = (bugReport: BugReport) => {
    setSelectedBugReport(bugReport)
    setViewDialogOpen(true)
  }

  // Open update dialog
  const handleOpenUpdateDialog = (bugReport: BugReport) => {
    setSelectedBugReport(bugReport)
    setNewStatus(bugReport.status)
    setAdminNotes(bugReport.admin_notes || "")
    setUpdateDialogOpen(true)
  }

  // Update bug report status
  const handleUpdateBugReport = async () => {
    if (!selectedBugReport) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/bug-reports/${selectedBugReport.id}`, {
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
        throw new Error("Failed to update bug report")
      }

      toast.success("Bug report updated successfully")
      setUpdateDialogOpen(false)

      // Refresh bug reports
      fetchBugReports(currentPage, statusFilter)
    } catch {
      toast.error("Failed to update bug report")
    } finally {
      setIsUpdating(false)
    }
  }

  // Reset dialog states when closed
  const handleViewToUpdateTransition = (bugReport: BugReport) => {
    setViewDialogOpen(false);
    setTimeout(() => {
      setSelectedBugReport(bugReport);
      setNewStatus(bugReport.status);
      setAdminNotes(bugReport.admin_notes || "");
      setUpdateDialogOpen(true);
    }, 100);
  }

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    // Small delay to prevent UI flicker
    setTimeout(() => setSelectedBugReport(null), 200);
  }

  const handleUpdateDialogClose = () => {
    setUpdateDialogOpen(false)
    // Don't reset selectedBugReport here as it might be needed for view dialog
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            New
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <Eye className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Low
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Medium
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
            High
          </Badge>
        )
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Critical
          </Badge>
        )
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Bug Report Management</h2>
        <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
          {isRefreshing ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="bugs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bugs">Bug Reports</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="bugs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Bug Reports</CardTitle>
                  <CardDescription>Manage and respond to user-reported bugs</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reports</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
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
              ) : bugReports.length === 0 ? (
                <div className="text-center py-8">
                  <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No bug reports found</h3>
                  <p className="text-muted-foreground mt-2">
                    {statusFilter
                      ? `There are no ${statusFilter} bug reports at this time.`
                      : "There are no bug reports at this time."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bugReports.map((bugReport) => (
                          <TableRow key={bugReport.id}>
                            <TableCell className="font-medium">{bugReport.title}</TableCell>
                            <TableCell>{bugReport.user_name}</TableCell>
                            <TableCell>{getSeverityBadge(bugReport.severity)}</TableCell>
                            <TableCell>{getStatusBadge(bugReport.status)}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {new Date(bugReport.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewBugReport(bugReport)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleOpenUpdateDialog(bugReport)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Update
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
                      <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
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
              <CardTitle>Bug Report Statistics</CardTitle>
              <CardDescription>Overview of bug reporting activity</CardDescription>
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
                        <CardTitle className="text-lg">Total Bug Reports</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{stats.totalBugs}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Open Bugs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{stats.openBugs}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Resolution Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          {stats.totalBugs > 0
                            ? `${Math.round(((stats.totalBugs - stats.openBugs) / stats.totalBugs) * 100)}%`
                            : "0%"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Bugs by Severity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {stats.bySeverity.map((item) => (
                            <div key={item.severity} className="flex items-center justify-between">
                              <span className="capitalize">{item.severity}</span>
                              <Badge variant="outline">{item.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Bugs by Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {stats.byStatus.map((item) => (
                            <div key={item.status} className="flex items-center justify-between">
                              <span className="capitalize">{item.status.replace("_", " ")}</span>
                              <Badge variant="outline">{item.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Bug Report Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={handleViewDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-lg overflow-auto w-11/12">
          <DialogHeader>
            <DialogTitle>Bug Report Details</DialogTitle>
            <DialogDescription>Detailed information about the bug report</DialogDescription>
          </DialogHeader>

          {selectedBugReport && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Title</h3>
                    <p className="font-medium mb-4">{selectedBugReport.title}</p>

                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <div className="mb-4">{getStatusBadge(selectedBugReport.status)}</div>

                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Severity</h3>
                    <div className="mb-4">{getSeverityBadge(selectedBugReport.severity)}</div>

                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Reported On</h3>
                    <p className="mb-4">{new Date(selectedBugReport.created_at).toLocaleString()}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Reporter</h3>
                    <p className="mb-4">{selectedBugReport.user_name}</p>

                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Device Info</h3>
                    <p className="mb-4 text-sm break-words">{selectedBugReport.device_info || "Not provided"}</p>

                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Browser Info</h3>
                    <p className="mb-4 text-sm break-words">{selectedBugReport.browser_info || "Not provided"}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">{selectedBugReport.description}</div>
                </div>

                {selectedBugReport.steps_to_reproduce && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Steps to Reproduce</h3>
                    <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                      {selectedBugReport.steps_to_reproduce}
                    </div>
                  </div>
                )}


                {selectedBugReport.admin_notes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Admin Notes</h3>
                    <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">{selectedBugReport.admin_notes}</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleViewDialogClose}>
              Close
            </Button>
            <Button onClick={() => handleViewToUpdateTransition(selectedBugReport!)}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Bug Report Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={handleUpdateDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-lg overflow-auto w-11/12">
          <DialogHeader>
            <DialogTitle>Update Bug Report Status</DialogTitle>
            <DialogDescription>Change the status of this bug report and add admin notes</DialogDescription>
          </DialogHeader>

          {selectedBugReport && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Current Status</h3>
                <div>{getStatusBadge(selectedBugReport.status)}</div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">New Status</h3>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                        New
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-blue-500" />
                        In Progress
                      </div>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Resolved
                      </div>
                    </SelectItem>
                    <SelectItem value="closed">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                        Closed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Admin Notes</h3>
                <Textarea
                  placeholder="Add notes about this bug report (internal only)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">These notes are only visible to administrators.</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleUpdateDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBugReport} disabled={isUpdating}>
              {isUpdating ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

