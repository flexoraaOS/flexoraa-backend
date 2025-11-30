'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Edit, Building2, MapPin, FileText, Tag } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchCompanyDetails, CompanyDetails } from '@/lib/features/companyDetailsSlice';
import { CompanyDetailsForm } from '@/components/dashboard/CompanyDetailsForm';
import { supabase } from '@/lib/api/supabase';

export default function CompanyDetailsCard() {
    const [isEditing, setIsEditing] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const { data: companyDetails, loading, error, isInitialized } = useSelector((state: RootState) => state.companyDetails);
    const isLoading = loading === "pending";

    // Fetch company details from Redux store
    useEffect(() => {
        const loadCompanyDetails = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                dispatch(fetchCompanyDetails(user.id));
            }
        };

        loadCompanyDetails();
    }, [dispatch]);

    const handleEditSuccess = (details: CompanyDetails) => {
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Details
                    </CardTitle>
                    <CardDescription>Loading company information...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (isEditing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Edit Company Details
                    </CardTitle>
                    <CardDescription>Update your company&apos;s legal and billing information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CompanyDetailsForm onSuccess={handleEditSuccess} onCancel={handleCancelEdit} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Company Details
                        </CardTitle>
                        <CardDescription>Manage your company&apos;s legal and billing information.</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {companyDetails ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    Company Information
                                </div>
                                <div className="pl-6 space-y-1">
                                    <p className="text-sm"><span className="font-medium">Name:</span> {companyDetails.company_name}</p>
                                    <p className="text-sm"><span className="font-medium">Type:</span> {companyDetails.company_type}</p>
                                    <p className="text-sm"><span className="font-medium">Industry:</span> {companyDetails.sector}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    Location
                                </div>
                                <div className="pl-6 space-y-1">
                                    <p className="text-sm"><span className="font-medium">Country:</span> {companyDetails.country}</p>
                                    {companyDetails.state && (
                                        <p className="text-sm"><span className="font-medium">State:</span> {companyDetails.state}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                Tax Information
                            </div>
                            <div className="pl-6 space-y-1">
                                {companyDetails.gst_number && (
                                    <p className="text-sm"><span className="font-medium">GST Number:</span> {companyDetails.gst_number}</p>
                                )}
                                <p className="text-sm"><span className="font-medium">GST Rate:</span> {companyDetails.gst_rate}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Company Details</h3>
                        <p className="text-muted-foreground mb-4">
                            You haven&apos;t added any company details yet. Click the edit button to get started.
                        </p>
                        <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Add Company Details
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
