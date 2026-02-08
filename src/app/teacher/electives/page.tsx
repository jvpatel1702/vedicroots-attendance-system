import { getTeacherElectiveOfferings } from '@/app/actions/electives'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function TeacherElectivesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please login</div>

    const offerings = await getTeacherElectiveOfferings(user.id)

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">My Elective Classes</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {offerings.length === 0 ? (
                    <p className="text-muted-foreground col-span-full">You are not assigned to any elective classes.</p>
                ) : (
                    offerings.map((off: any) => (
                        <Link href={`/teacher/electives/${off.id}`} key={off.id}>
                            <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{off.name}</CardTitle>
                                        <Badge variant="outline">{off.subject?.name}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm font-medium">{off.day_of_week}</p>
                                    <p className="text-sm text-gray-500">{off.start_time} - {off.end_time}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {off.start_date} to {off.end_date}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
