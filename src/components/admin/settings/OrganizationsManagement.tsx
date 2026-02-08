'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { useOrganization } from '@/context/OrganizationContext';

export default function OrganizationsManagement() {
    const { selectedOrganization, isLoading } = useOrganization();

    if (isLoading) return <div className="text-gray-500">Loading organization...</div>;

    return (
        <Card className="max-w-4xl">
            <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>View your organization's profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {selectedOrganization ? (
                    <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-olive border border-gray-200">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{selectedOrganization.name}</h3>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-brand-olive text-white text-xs px-2 py-1 rounded-md uppercase tracking-wider font-bold">
                                    {selectedOrganization.type}
                                </span>
                                <span className="text-gray-400 text-sm">ID: {selectedOrganization.id}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-red-500">No organization selected. Please select one from the header.</div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
                    <p>To edit organization details, please contact system support.</p>
                </div>
            </CardContent>
        </Card>
    );
}

