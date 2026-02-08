'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input' // Actually use a Combobox if possible
import { Label } from '@/components/ui/label'
import { enrollStudentInElective, getElectiveEnrollments } from '@/app/actions/electives'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// This component will likely be a child of OfferingsList or a separate page
// Ideally: Admin clicks "Manage Enrollments" on an offering.
// For now, let's make it a Dialog that opens from the OfferingsList table row.

type EnrollmentManagerProps = {
    offeringId: string
    offeringName: string
}

export default function EnrollmentManager({ offeringId, offeringName }: EnrollmentManagerProps) {
    const [open, setOpen] = useState(false)
    const [enrollments, setEnrollments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [studentId, setStudentId] = useState('')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

    // We need a way to search/select students. 
    // For MVP, simple ID input or we fetch all students? 
    // Fetching all students might be heavy. Let's assume there is a student picker or we just input ID for now.
    // Actually, let's use a simple text input for Student ID for the first pass, as search is complex.
    // OR we can fetch a list of students for the grade?

    // Better: Helper function to fetch enrollments when dialog opens
    const fetchEnrollments = async () => {
        setLoading(true)
        try {
            const data = await getElectiveEnrollments(offeringId)
            setEnrollments(data || [])
        } catch (e) {
            toast.error("Failed to load enrollments")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) fetchEnrollments()
    }

    const handleEnroll = async () => {
        if (!studentId || !startDate) return
        try {
            await enrollStudentInElective(studentId, offeringId, startDate)
            toast.success("Student enrolled")
            setStudentId('')
            fetchEnrollments()
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Manage Enrollments</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Enrollments for {offeringName}</DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 items-end mb-4 border-b pb-4">
                    <div className="space-y-2 flex-1">
                        <Label>Student ID (UUID)</Label>
                        <Input
                            placeholder="Student UUID"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleEnroll} disabled={!studentId}>Enroll</Button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : enrollments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No active enrollments</TableCell>
                                </TableRow>
                            ) : (
                                enrollments.map(enr => (
                                    <TableRow key={enr.id}>
                                        <TableCell>{enr.student?.first_name} {enr.student?.last_name}</TableCell>
                                        <TableCell>{enr.start_date}</TableCell>
                                        <TableCell>{enr.end_date || '-'}</TableCell>
                                        <TableCell>{enr.status}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="text-red-500">Drop</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}
