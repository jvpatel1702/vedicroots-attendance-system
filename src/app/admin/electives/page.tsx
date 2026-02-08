import { getElectiveSubjects, getElectiveOfferings } from '@/app/actions/electives'
import { getProfiles } from '@/app/actions/people' // Assuming this exists or similar
import { getAcademicYears } from '@/app/actions/academic-years' // Assuming
import ElectiveTabs from '@/components/admin/electives/ElectiveTabs'

export default async function ElectivesPage() {
    const subjects = await getElectiveSubjects()
    const offerings = await getElectiveOfferings()

    // We need teachers for the offering creation form
    // Fetching all profiles for now, will filter in UI or query
    // TODO: Create a specific action for fetching teachers if not exists.
    // For now passing empty array if not available, user can implement.

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Electives Management</h1>
            </div>

            <ElectiveTabs
                subjects={subjects}
                offerings={offerings}
            />
        </div>
    )
}
