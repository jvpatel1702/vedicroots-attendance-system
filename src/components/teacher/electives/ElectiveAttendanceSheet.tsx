'use client'

import { getElectiveAttendanceSheet, markElectiveAttendance } from '@/app/actions/electives'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { useOrganization } from '@/context/OrganizationContext'
import { isDateHoliday, SchoolHoliday } from '@/lib/classroomUtils'

export default function ElectiveAttendanceSheet({ offeringId, offeringName, date }: { offeringId: string, offeringName?: string, date: string }) {
    const { selectedOrganization } = useOrganization()
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [teacherAbsent, setTeacherAbsent] = useState(false)
    const [saving, setSaving] = useState(false)
    const [todayHoliday, setTodayHoliday] = useState<SchoolHoliday | null>(null)

    useEffect(() => {
        loadData()
    }, [date, selectedOrganization])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await getElectiveAttendanceSheet(offeringId, date)
            setStudents(data)

            // Check for holiday
            if (selectedOrganization) {
                const { data: holidays } = await createClient()
                    .from('school_holidays')
                    .select('*')
                    .eq('organization_id', selectedOrganization.id)
                    .lte('start_date', date)
                    .gte('end_date', date)

                if (holidays && holidays.length > 0) {
                    setTodayHoliday(holidays[0] as SchoolHoliday)
                }
            }

            // Check if all are marked teacher absent? Or if any one is.
            const isTeacherAbsent = data.length > 0 && data.every(s => s.status === 'TEACHER_ABSENT')
            setTeacherAbsent(isTeacherAbsent)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChangeStatus = (enrollmentId: string, status: string) => {
        setStudents(prev => prev.map(s =>
            s.enrollment_id === enrollmentId ? { ...s, status: status } : s
        ))
    }

    const handleRolloverToggle = (enrollmentId: string, isRollover: boolean) => {
        setStudents(prev => prev.map(s =>
            s.enrollment_id === enrollmentId ? { ...s, is_rollover: isRollover } : s
        ))
    }

    const handleTeacherAbsentToggle = (val: boolean) => {
        setTeacherAbsent(val)
        if (val) {
            setStudents(prev => prev.map(s => ({ ...s, status: 'TEACHER_ABSENT', is_rollover: true })))
        } else {
            // Reset to unmarked or previous? Ideally just unmarked
            setStudents(prev => prev.map(s => ({ ...s, status: 'UNMARKED', is_rollover: false })))
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = students.map(s => ({
                enrollment_id: s.enrollment_id,
                date: date,
                status: s.status,
                is_rollover: s.is_rollover,
                rollover_note: s.rollover_note
            }))

            await markElectiveAttendance(payload)
            toast.success("Attendance saved")
        } catch (e: any) {
            toast.error("Error saving: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border font-sans">
                <div>
                    <h2 className="font-semibold text-gray-900">Class Attendance</h2>
                    <p className="text-sm text-muted-foreground">{date}</p>
                </div>
                
                {todayHoliday ? (
                    <div className="bg-brand-cream border border-brand-gold/30 px-4 py-2 rounded-lg flex items-center gap-3 text-brand-olive text-sm font-medium">
                        <span className="h-2 w-2 bg-brand-olive rounded-full animate-pulse" />
                        Today is a School Holiday: {todayHoliday.name}
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="teacherAbsent"
                                checked={teacherAbsent}
                                onChange={(e) => handleTeacherAbsentToggle(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-olive focus:ring-brand-olive"
                            />
                            <label htmlFor="teacherAbsent" className="font-medium text-sm cursor-pointer text-gray-700">Generic: Teacher Absent</label>
                        </div>
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="bg-brand-olive hover:bg-brand-olive/90"
                        >
                            {saving ? 'Saving...' : 'Submit Attendance'}
                        </Button>
                    </div>
                )}
            </div>

            {todayHoliday && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm flex items-center gap-3">
                    <p>Attendance records cannot be submitted for school holidays. If this is an error, please contact or check the holidays settings.</p>
                </div>
            )}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>School Status</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Rollover?</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center p-4">Loading...</TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center p-4 text-muted-foreground">No students enrolled</TableCell>
                                </TableRow>
                            ) : (
                                students.map(student => (
                                    <TableRow key={student.enrollment_id} className={student.school_status === 'ABSENT' ? 'bg-red-50' : ''}>
                                        <TableCell className="font-medium">
                                            {student.student.first_name} {student.student.last_name}
                                        </TableCell>
                                        <TableCell>
                                            {student.school_status === 'ABSENT' ? (
                                                <span className="text-red-600 font-bold text-xs px-2 py-1 bg-red-100 rounded">ABSENT IN SCHOOL</span>
                                            ) : (
                                                <span className="text-green-600 text-xs">{student.school_status}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={student.status}
                                                onValueChange={(val) => handleChangeStatus(student.enrollment_id, val)}
                                                disabled={teacherAbsent}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UNMARKED">Unmarked</SelectItem>
                                                    <SelectItem value="PRESENT">Present</SelectItem>
                                                    <SelectItem value="ABSENT">Absent</SelectItem>
                                                    <SelectItem value="LATE">Late</SelectItem>
                                                    <SelectItem value="TEACHER_ABSENT">Teacher Absent / Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={student.is_rollover || student.status === 'TEACHER_ABSENT'}
                                                    onChange={(e) => handleRolloverToggle(student.enrollment_id, e.target.checked)}
                                                    disabled={student.status === 'TEACHER_ABSENT'} // Auto-checked if Teacher Absent
                                                    className="h-4 w-4"
                                                />
                                                <span className="text-xs text-muted-foreground">Credit</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
