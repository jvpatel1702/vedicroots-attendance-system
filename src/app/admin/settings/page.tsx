'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import GeneralSettings from '@/components/admin/settings/GeneralSettings';
import AcademicYears from '@/components/admin/settings/AcademicYears';
import GradesManagement from '@/components/admin/settings/GradesManagement';
import LocationsManagement from '@/components/admin/settings/LocationsManagement';
import OrganizationsManagement from '@/components/admin/settings/OrganizationsManagement';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'years', label: 'Academic Years' },
        { id: 'grades', label: 'Grades' },
        { id: 'locations', label: 'Locations' },
        { id: 'org', label: 'Organization' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSettings />;
            case 'years': return <AcademicYears />;
            case 'grades': return <GradesManagement />;
            case 'locations': return <LocationsManagement />;
            case 'org': return <OrganizationsManagement />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage your school configuration and preferences.</p>
            </div>

            <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-brand-olive text-brand-olive'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in duration-300">
                {renderContent()}
            </div>
        </div>
    );
}
