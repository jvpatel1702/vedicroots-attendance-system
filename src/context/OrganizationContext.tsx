'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabaseClient';

export interface Organization {
    id: string;
    name: string;
    type: string;
    logo_url?: string;
}

interface OrganizationContextType {
    organizations: Organization[];
    selectedOrganization: Organization | null;
    setSelectedOrganization: (org: Organization) => void;
    isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchOrganizations() {
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('*')
                    .order('name');

                if (error) {
                    console.error('Error fetching organizations:', error);
                    return;
                }

                if (data && data.length > 0) {
                    setOrganizations(data);
                    // Default to first organization if none selected
                    // Ideally we could persist this in localStorage
                    const savedOrgId = localStorage.getItem('selectedOrganizationId');
                    const savedOrg = data.find(o => o.id === savedOrgId);

                    setSelectedOrganization(savedOrg || data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch organizations', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchOrganizations();
    }, []);

    // Persist selection
    useEffect(() => {
        if (selectedOrganization) {
            localStorage.setItem('selectedOrganizationId', selectedOrganization.id);
        }
    }, [selectedOrganization]);

    return (
        <OrganizationContext.Provider value={{
            organizations,
            selectedOrganization,
            setSelectedOrganization,
            isLoading
        }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
}
