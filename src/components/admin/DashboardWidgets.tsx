import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserX, UserCheck, UserPlus, Clock } from 'lucide-react';

interface AbsentStudent {
    id: string;
    name: string;
    grade?: string;
}

interface NewAdmission {
    id: string;
    name: string;
    date: string;
    type: 'JOINING' | 'UPCOMING' | 'FINISHING';
    program?: string;
}

interface PresentEmployee {
    id: string;
    name: string;
    role: string;
    checkInTime?: string;
}

export function AbsentStudentsCard({ students }: { students: AbsentStudent[] }) {
    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-destructive">
                    <UserX className="h-5 w-5" /> Today Absent Students
                </CardTitle>
            </CardHeader>
            <CardContent>
                {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <UserX className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground text-sm">Attendance Not Marked Yet !</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {students.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-2 bg-red-50/50 rounded-lg border border-red-100">
                                <div>
                                    <p className="font-medium text-sm text-gray-900">{student.name}</p>
                                    {student.grade && <p className="text-xs text-gray-500">{student.grade}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function PresentEmployeesCard({ employees }: { employees: PresentEmployee[] }) {
    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-brand-olive">
                    <UserCheck className="h-5 w-5" /> Today Present Employees
                </CardTitle>
            </CardHeader>
            <CardContent>
                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground text-sm">Attendance Not Marked Yet !</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {employees.map(emp => (
                            <div key={emp.id} className="flex items-center justify-between p-2 bg-green-50/50 rounded-lg border border-green-100">
                                <div>
                                    <p className="font-medium text-sm text-gray-900">{emp.name}</p>
                                    <p className="text-xs text-gray-500">{emp.role}</p>
                                </div>
                                {emp.checkInTime && (
                                    <span className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded border">
                                        {new Date(emp.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function NewAdmissionsCard({ admissions }: { admissions: NewAdmission[] }) {
    const joining = admissions.filter(a => a.type === 'JOINING');
    const upcoming = admissions.filter(a => a.type === 'UPCOMING');
    const finishing = admissions.filter(a => a.type === 'FINISHING');

    const hasData = admissions.length > 0;

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-brand-purple">
                    <UserPlus className="h-5 w-5" /> New Admissions & Exits
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!hasData ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <UserPlus className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground text-sm">No Activity This Month</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {joining.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Joining This Month</h4>
                                <div className="space-y-2">
                                    {joining.map(a => (
                                        <div key={a.id} className="flex justify-between text-sm p-2 bg-purple-50/50 rounded border border-purple-100">
                                            <span className="font-medium text-gray-800">{a.name}</span>
                                            <span className="text-gray-500 text-xs">{new Date(a.date).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {upcoming.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Upcoming Next Month</h4>
                                <div className="space-y-2">
                                    {upcoming.map(a => (
                                        <div key={a.id} className="flex justify-between text-sm p-2 bg-blue-50/50 rounded border border-blue-100">
                                            <span className="font-medium text-gray-800">{a.name}</span>
                                            <span className="text-gray-500 text-xs">{new Date(a.date).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {finishing.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Finishing This Month</h4>
                                <div className="space-y-2">
                                    {finishing.map(a => (
                                        <div key={a.id} className="flex justify-between text-sm p-2 bg-orange-50/50 rounded border border-orange-100">
                                            <span className="font-medium text-gray-800">{a.name}</span>
                                            <span className="text-gray-500 text-xs">{new Date(a.date).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
