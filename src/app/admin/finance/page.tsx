'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateTeacherPay } from '@/lib/actions/finance'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function FinancePage() {
    const [teacherId, setTeacherId] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const handleCalculate = async () => {
        if (!teacherId || !startDate || !endDate) {
            toast.error("Please fill all fields")
            return
        }
        setLoading(true)
        try {
            const data = await calculateTeacherPay(teacherId, startDate, endDate)
            setResult(data)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Finance & Payroll Test</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Teacher Pay Calculator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Teacher ID</Label>
                            <Input value={teacherId} onChange={e => setTeacherId(e.target.value)} placeholder="UUID" />
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <Button onClick={handleCalculate} disabled={loading}>
                        {loading ? 'Calculating...' : 'Calculate Pay'}
                    </Button>

                    {result && (
                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-semibold text-lg mb-2">Total Pay: ${result.totalPay.toFixed(2)}</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Offering</TableHead>
                                        <TableHead>Conducted Sessions</TableHead>
                                        <TableHead>Cancelled (Teacher Absent)</TableHead>
                                        <TableHead>Rate</TableHead>
                                        <TableHead>Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.breakdown.map((item: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell>{item.offering}</TableCell>
                                            <TableCell>{item.sessions}</TableCell>
                                            <TableCell className="text-red-500">{item.cancelled}</TableCell>
                                            <TableCell>${item.rate}</TableCell>
                                            <TableCell>${item.total.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
