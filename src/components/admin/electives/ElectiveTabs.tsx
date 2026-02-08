'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SubjectsList from './SubjectsList'
import OfferingsList from './OfferingsList'

export default function ElectiveTabs({ subjects, offerings }: { subjects: any[], offerings: any[] }) {
    return (
        <Tabs defaultValue="offerings" className="w-full">
            <TabsList>
                <TabsTrigger value="offerings">Class Offerings</TabsTrigger>
                <TabsTrigger value="subjects">Subjects (Master Data)</TabsTrigger>
            </TabsList>
            <TabsContent value="offerings" className="mt-4">
                <OfferingsList offerings={offerings} subjects={subjects} />
            </TabsContent>
            <TabsContent value="subjects" className="mt-4">
                <SubjectsList subjects={subjects} />
            </TabsContent>
        </Tabs>
    )
}
