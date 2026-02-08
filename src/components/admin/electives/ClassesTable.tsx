'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updateClassSession } from '@/app/actions/electives'
import { toast } from 'sonner'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ClassesTable({ classes, offeringId }: { classes: any[], offeringId: string }) {
    const [selectedClass, setSelectedClass] = useState<any>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleStatusChange = async (classId: string, newStatus: string) => {
        try {
            await updateClassSession(classId, { status: newStatus as any })
            toast.success(`Class marked as ${newStatus}`)
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await updateClassSession(selectedClass.id, {
                date: formData.get('date') as string,
                start_time: formData.get('start_time') as string,
                end_time: formData.get('end_time') as string,
                status: formData.get('status') as any
            })
            toast.success("Class updated")
            setIsEditOpen(false)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const openEdit = (cls: any) => {
        setSelectedClass(cls)
        setIsEditOpen(true)
    }

    return (
        <div className="border rounded-md">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Class Session</DialogTitle>
                    </DialogHeader>
                    {selectedClass && (
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input name="date" type="date" defaultValue={selectedClass.date} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select name="status" defaultValue={selectedClass.status}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                            <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input name="start_time" type="time" defaultValue={selectedClass.start_time} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input name="end_time" type="time" defaultValue={selectedClass.end_time} required />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>Update Class</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {classes.map((cls) => (
                        <TableRow key={cls.id}>
                            <TableCell>{cls.date}</TableCell>
                            <TableCell>{cls.start_time} - {cls.end_time}</TableCell>
                            <TableCell>
                                <Badge variant={
                                    cls.status === 'CANCELLED' ? 'destructive' :
                                        cls.status === 'COMPLETED' ? 'default' :
                                            cls.status === 'RESCHEDULED' ? 'secondary' : 'outline'
                                }>
                                    {cls.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => openEdit(cls)}>Edit / Reschedule</Button>

                                    {cls.status === 'SCHEDULED' && (
                                        <Button size="sm" variant="destructive" onClick={() => handleStatusChange(cls.id, 'CANCELLED')}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
