'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { Loader2, QrCode, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function QRCodeSettingsPage() {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [qrValue, setQrValue] = useState<string | null>(null);

    useEffect(() => {
        if (selectedOrganization) {
            fetchQrConfig();
        }
    }, [selectedOrganization]);

    const fetchQrConfig = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('school_qr_config')
            .select('code_value')
            .eq('organization_id', selectedOrganization?.id)
            .eq('active', true)
            .maybeSingle();

        if (data) {
            setQrValue(data.code_value);
        } else {
            setQrValue(null);
        }
        setLoading(false);
    };

    const generateNewCode = async () => {
        if (!selectedOrganization) return;
        setGenerating(true);
        
        // Generate a random secure token
        const newToken = `vr_qr_${selectedOrganization.id}_${Math.random().toString(36).substring(2, 15)}`;

        // Check if config exists
        const { data: existing } = await supabase
            .from('school_qr_config')
            .select('id')
            .eq('organization_id', selectedOrganization.id)
            .maybeSingle();

        let error;
        if (existing) {
            const { error: updateError } = await supabase
                .from('school_qr_config')
                .update({ code_value: newToken, active: true })
                .eq('id', existing.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('school_qr_config')
                .insert({
                    organization_id: selectedOrganization.id,
                    code_value: newToken,
                    active: true
                });
            error = insertError;
        }

        if (error) {
            toast.error('Failed to generate QR code');
        } else {
            toast.success('QR code generated successfully');
            setQrValue(newToken);
        }
        setGenerating(false);
    };

    const generateQrImageUrl = (data: string) => {
        // Use a public API to generate the QR image for simplicity
        return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data)}&margin=20`;
    };

    const downloadQR = async () => {
        if (!qrValue) return;
        try {
            const url = generateQrImageUrl(qrValue);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `VedicRoots_Attendance_QR_${selectedOrganization?.name}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success('Downloaded successfully');
        } catch (e) {
            toast.error('Failed to download image');
        }
    };

    if (!selectedOrganization) {
        return <div className="p-8">Please select an organization.</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">QR Code Settings</h1>
                <p className="text-gray-500">Manage the attendance QR code for {selectedOrganization.name}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-10 flex flex-col md:flex-row gap-10 items-center justify-center">
                
                {/* Left side: Instructions */}
                <div className="flex-1 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <QrCode className="text-brand-olive" size={20} />
                            Location Verification QR
                        </h3>
                        <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                            Staff members can scan this QR code using their device camera on the Clock-In page. 
                            Scanning the code proves they are physically present at the school without needing GPS location access.
                        </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h4 className="font-medium text-gray-800 mb-2">Instructions:</h4>
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                            <li>Generate a new QR code (or use existing).</li>
                            <li>Download the high-resolution image.</li>
                            <li>Print it and laminate it.</li>
                            <li>Mount it at the staff entrance or front desk.</li>
                        </ol>
                    </div>
                </div>

                {/* Right side: QR Display */}
                <div className="w-full md:w-80 flex flex-col items-center space-y-4">
                    {loading ? (
                        <div className="w-64 h-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
                            <Loader2 className="animate-spin text-gray-400" />
                        </div>
                    ) : qrValue ? (
                        <>
                            <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl w-full flex justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={generateQrImageUrl(qrValue)} 
                                    alt="Attendance QR Code" 
                                    className="w-full max-w-[240px] h-auto object-contain rounded-lg"
                                />
                            </div>
                            
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={downloadQR}
                                    className="flex-1 flex items-center justify-center gap-2 bg-brand-olive hover:bg-brand-dark text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                                >
                                    <Download size={18} />
                                    Download
                                </button>
                                <button
                                    onClick={generateNewCode}
                                    disabled={generating}
                                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-medium transition-colors"
                                    title="Generate a new code (invalidates the old one)"
                                >
                                    {generating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-64 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50 space-y-4 p-6 text-center">
                            <QrCode size={48} className="text-gray-300" />
                            <p className="text-sm text-gray-500">No active QR code config found for this organization.</p>
                            <button
                                onClick={generateNewCode}
                                disabled={generating}
                                className="flex items-center justify-center gap-2 bg-brand-olive hover:bg-brand-dark text-white py-2 px-6 rounded-lg font-medium transition-colors"
                            >
                                {generating ? <Loader2 size={18} className="animate-spin" /> : 'Generate Now'}
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
