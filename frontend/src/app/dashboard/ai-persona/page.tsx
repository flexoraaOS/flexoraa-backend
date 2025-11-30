'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAppSelector } from '@/lib/hooks';
import { supabase } from '@/lib/api/supabase';

// Import child components
import CoreIdentityForm from './CoreIdentityForm';
import KnowledgeBaseUploader from './KnowledgeBaseUploader';
import AgentManagement from './AgentManagement';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

const N8N_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
  'https://echo123.app.n8n.cloud/webhook-test/upload-pdf';

export default function AiPersonaPage() {
  // State
  const [agentName, setAgentName] = useState('Sales Assistant');
  const [agentPersona, setAgentPersona] = useState('sales');
  const [businessInfo, setBusinessInfo] = useState(
    'Flexoraa is a leading provider of AI automation solutions for businesses...'
  );
  const [stagedFile, setStagedFile] = useState<File | null>(null);

  // **UPDATED**: State is now specifically for the file upload action
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User data from Redux
  const auth = useAppSelector((state: any) => state.auth);
  const userId = auth?.user?.id || auth?.user?.uid || auth?.id || auth?.user?.sub || null;
  const userEmail = auth?.user?.email || auth?.user?.email_address || auth?.email || auth?.user?.user_metadata?.email || null;
  const userName = auth?.user?.name || auth?.user?.full_name || auth?.user?.user_metadata?.full_name || null;

  // Load existing AI persona data on component mount
  useEffect(() => {
    const loadAiPersona = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('agent_name, agent_persona, business_info')
          .eq('id', userId)
          .maybeSingle(); // Use maybeSingle to handle no results gracefully

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error loading AI persona:', error);
          toast.error('Failed to load AI configuration');
          return;
        }

        if (profileData) {
          if (profileData.agent_name) setAgentName(profileData.agent_name);
          if (profileData.agent_persona) setAgentPersona(profileData.agent_persona);
          if (profileData.business_info) setBusinessInfo(profileData.business_info);
        }
      } catch (err) {
        console.error('Error loading AI persona:', err);
        toast.error('Failed to load AI configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadAiPersona();
  }, [userId]);

  // File handling functions (no changes here)
  const validateAndSetFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File too large. Max 25MB.');
      return;
    }
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.');
      return;
    }
    setStagedFile(file);
  };

  const clearStagedFile = () => {
    setStagedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Cleared selected file');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0] ?? null);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    validateAndSetFile(e.dataTransfer.files?.[0] ?? null);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  
  const uploadToN8n = async () => {
    if (!stagedFile) {
      toast.error('No file selected to upload.');
      return;
    }
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', stagedFile, stagedFile.name);
      form.append('agent_name', agentName);
      form.append('agent_persona', agentPersona);
      form.append('business_info', businessInfo);
      if (userId) form.append('user_id', String(userId));
      if (userEmail) form.append('email', String(userEmail));
      if (userName) form.append('name', String(userName));

      const res = await fetch(N8N_WEBHOOK_URL, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());

      toast.success('PDF processed successfully!');
      clearStagedFile();
    } catch (err) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };


  const handleSave = async () => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    // Basic validation
    if (!agentName.trim()) {
      toast.error("Agent name is required");
      return;
    }

    if (!agentPersona) {
      toast.error("Please select an agent persona");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          agent_name: agentName.trim(),
          agent_persona: agentPersona,
          business_info: businessInfo.trim(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving AI persona:', error);
        toast.error("Failed to save AI configuration");
        return;
      }

      toast.success("AI Configuration Saved!", {
        description: "Your AI agent's persona has been updated.",
      });
    } catch (err) {
      console.error('Error saving AI persona:', err);
      toast.error("Failed to save AI configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">AI Persona &amp; Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">
          Train your AI agent by providing it with your business's unique voice...
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <CoreIdentityForm
            agentName={agentName}
            setAgentName={setAgentName}
            agentPersona={agentPersona}
            setAgentPersona={setAgentPersona}
            businessInfo={businessInfo}
            setBusinessInfo={setBusinessInfo}
          />
          {/* **UPDATED**: Passing the dedicated upload function and state */}
          <KnowledgeBaseUploader
            stagedFile={stagedFile}
            isUploading={isUploading}
            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            onFileChange={handleFileChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClear={clearStagedFile}
            onUpload={uploadToN8n}
          />
        </div>

        <div className="lg:col-span-1 space-y-8 sticky top-24">
          <AgentManagement />
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
