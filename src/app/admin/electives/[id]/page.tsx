import { getElectiveClasses, getElectiveOfferings } from "@/lib/actions/electives"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import ClassesTable from "@/components/admin/electives/ClassesTable"

// Page to list all generated classes for an offering, allowing cancellations/rescheduling
export default async function OfferingManagementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const classes = await getElectiveClasses(id)

    // Fetch offering details
    const supabase = await createClient()
    const { data: offering } = await supabase.from('elective_offerings')
        .select('*, subject:elective_subjects(name)')
        .eq('id', id)
        .single()

    if (!offering) return <div>Offering not found</div>

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{offering.subject?.name} - Schedule</h1>
                    <p className="text-muted-foreground">
                        {offering.schedule_day}s at {offering.schedule_start_time}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/electives">
                        <Button variant="outline">Back to Offerings</Button>
                    </Link>
                </div>
            </div>

            <ClassesTable classes={classes} offeringId={id} />
        </div>
    )
}
