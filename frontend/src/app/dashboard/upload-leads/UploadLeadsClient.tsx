'use client';

import React, { useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Loader2,
  CheckCircle,
  PlusCircle,
  Shield,
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/api/supabase';
import Link from 'next/link';

type Lead = { phone_number: string; status?: string };

export function UploadLeadsClient() {
  const [fileName, setFileName] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedLeads, setUploadedLeads] = useState<Lead[] | null>(null);
  const [singleLead, setSingleLead] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsvContent(reader.result as string);
    reader.readAsText(file);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  function parseCSV(text: string): Lead[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 1) return [];
    const headers = lines[0].split(',');
    const phoneIndex = headers.findIndex(
      h => h.trim().toLowerCase() === 'phone_number'
    );
    if (phoneIndex === -1) {
      toast.error('CSV must have a "phone_number" column');
      return [];
    }

    const leads: Lead[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      let raw = (values[phoneIndex] || '').trim();
      raw = raw.replace(/\D/g, ''); // digits only
      if (raw.length === 10) {
        leads.push({ phone_number: `+91${raw}` });
      }
    }
    return leads;
  }

  const uploadLeadsToSupabase = async (leads: Lead[]) => {
    try {
      const {
        data: { user },
        error: userErr
      } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('Not logged in');
      if (leads.length === 0) throw new Error('No valid leads found');

      const { error } = await supabase.from('leads').insert(
        leads.map(l => ({
          user_id: user.id,
          phone_number: l.phone_number,
          status: 'pending'
        }))
      );
      if (error) throw error;
      setUploadedLeads(leads);
      toast.success('Leads uploaded successfully');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Error uploading leads';
      toast.error(message);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvContent) return;
    setLoading(true);
    const leads = parseCSV(csvContent);
    await uploadLeadsToSupabase(leads);
    setLoading(false);
  };

  const handleSingleLeadUpload = async () => {
    const raw = singleLead.trim().replace(/\D/g, '');
    if (raw.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    const formatted = `+91${raw}`;
    setLoading(true);
    await uploadLeadsToSupabase([{ phone_number: formatted }]);
    setSingleLead('');
    setLoading(false);
  };

  const reset = () => {
    setFileName('');
    setCsvContent('');
    setUploadedLeads(null);
    setSingleLead('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Upload Leads</CardTitle>
          <CardDescription>
            Upload via CSV or enter a single lead manually.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {uploadedLeads ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-secondary/30 rounded-lg">
              <CheckCircle className="h-20 w-20 text-green-400" />
              <h3 className="text-2xl font-bold font-headline mb-2">
                Upload Successful!
              </h3>
              <p className="text-muted-foreground mb-4">
                {uploadedLeads.length} lead(s) uploaded.
              </p>
              <Button onClick={reset} className="mt-6">
                Upload Another
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CSV Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => handleFileChange(e.target.files!)}
              />
              <div
                className="relative block w-full rounded-lg border-2 border-dashed border-border p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={handleUploadClick}
                onDrop={e => {
                  e.preventDefault();
                  handleFileChange(e.dataTransfer.files);
                }}
                onDragOver={e => e.preventDefault()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <span className="mt-2 block text-sm font-semibold text-foreground">
                  {fileName
                    ? `Selected: ${fileName}`
                    : 'Click to upload or drag & drop CSV'}
                </span>
                <span className="text-xs text-muted-foreground">
                  CSV must contain &quot;phone_number&quot; column
                </span>
              </div>
              <Button
                onClick={handleCSVUpload}
                disabled={loading}
                className="w-full"
                variant="destructive"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading CSV…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV Leads
                  </>
                )}
              </Button>

              {/* Single Lead Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={singleLead}
                  onChange={e => setSingleLead(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                />
                <Button
                  onClick={handleSingleLeadUpload}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Add Lead
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  1
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your raw lead data (e.g., names and phone numbers).
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  2
                </div>
                <p className="text-sm text-muted-foreground">
                  LeadOS initiates automated, personalized conversations on
                  WhatsApp.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  3
                </div>
                <p className="text-sm text-muted-foreground">
                  The AI analyzes responses to gauge interest, intent, and
                  sentiment.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  4
                </div>
                <p className="text-sm text-muted-foreground">
                  Leads are scored and qualified, so your team can focus on the
                  hottest prospects.
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ensure your CSV has a column for{' '}
              <code className="bg-muted px-1.5 py-1 rounded-sm">
                phone_number
              </code>
              .
            </p>
            <a href="/sample-leads.csv" download>
              <Button variant="outline" className="w-full">
                <FileDown className="mr-2 h-4 w-4" />
                Download Sample CSV
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card className="bg-secondary/50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Data Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We take your data privacy seriously. Your uploaded data is
              processed securely and is never used for any purpose other than
              scoring your leads. Read our full{' '}
              <Link
                href="/privacy-policy"
                className="underline hover:text-primary"
              >
                Privacy Policy
              </Link>{' '}
              for more details.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
