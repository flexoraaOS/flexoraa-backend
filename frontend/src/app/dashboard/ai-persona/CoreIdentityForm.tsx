'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type CoreIdentityFormProps = {
    agentName: string;
    setAgentName: (value: string) => void;
    agentPersona: string;
    setAgentPersona: (value: string) => void;
    businessInfo: string;
    setBusinessInfo: (value: string) => void;
};

export default function CoreIdentityForm({
    agentName,
    setAgentName,
    agentPersona,
    setAgentPersona,
    businessInfo,
    setBusinessInfo,
}: CoreIdentityFormProps) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Core Identity</CardTitle>
                <CardDescription>Define the agent&apos;s name and its core personality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="agent-name">Agent Name</Label>
                        <Input
                            id="agent-name"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="agent-persona">Agent Persona</Label>
                        <Select value={agentPersona} onValueChange={setAgentPersona}>
                            <SelectTrigger id="agent-persona">
                                <SelectValue placeholder="Select a persona" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sales_proactive">Proactive Sales</SelectItem>
                                <SelectItem value="sales_persuasive">Persuasive Sales</SelectItem>
                                <SelectItem value="support_helpful">Helpful Support</SelectItem>
                                <SelectItem value="support_empathetic">Empathetic Support</SelectItem>
                            </SelectContent>
                        </Select>

                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="business-info">Business Information &amp; Guidelines</Label>
                    <Textarea
                        id="business-info"
                        rows={10}
                        value={businessInfo}
                        onChange={(e) => setBusinessInfo(e.target.value)}
                    />
                </div>


            </CardContent>
        </Card>
    );
}
