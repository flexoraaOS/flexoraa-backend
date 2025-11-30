"use client";
import React, { useState, useTransition, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks'; 
import {
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  setCurrentCampaign,
} from '@/lib/features/campaignSlice';
import { Campaign } from '@/lib/types/leadTypes';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

// Icons
import { Wand2, Loader2, FileEdit, Trash2, Save, PlusCircle, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Template = {
  id: string;
  name: string;
  content: string;
};

type TemplateType = 'INITIAL_OUTREACH' | 'RE_ENGAGEMENT';
type ToneType = 'Friendly' | 'Professional' | 'Direct' | 'Casual';

type CampaignFormState = {
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: 'draft' | 'active' | 'paused' | 'archived';
};

const initialTemplates: Record<TemplateType, Template[]> = {
  INITIAL_OUTREACH: [
    { id: 'init-1', name: 'Standard Intro', content: 'Hi {{lead_name}}, I\'m from [Your Company]. I saw you were interested in our services. Would you be free for a quick chat this week?' },
    { id: 'init-2', name: 'Friendly Opener', content: 'Hello {{lead_name}}! Reaching out from [Your Company]. We have something special that might interest you. Got a moment to connect?' },
  ],
  RE_ENGAGEMENT: [
    { id: 're-1', name: 'Inactive Check-in', content: 'Hi {{lead_name}}, it\'s been a while! We\'ve made some exciting updates at [Your Company] and thought you might be interested. Would you like to hear more?' },
  ],
};

const initialCampaignFormState: CampaignFormState = {
  name: '',
  description: '',
  start_date: null,
  end_date: null,
  status: 'active',
};

export default function AiMessagingPage() {
  const dispatch = useAppDispatch();
  const { list: campaignList, current: currentCampaign, loading } = useAppSelector((state) => state.campaign);
  const isSaving = loading === 'pending';

  const [businessInfo, setBusinessInfo] = useState('');
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTab, setActiveTab] = useState<TemplateType>('INITIAL_OUTREACH');
  const [reEngagementTone, setReEngagementTone] = useState<ToneType>('Friendly');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isPending, startTransition] = useTransition();

  const [campaignForm, setCampaignForm] = useState<CampaignFormState>(initialCampaignFormState);

  const [panelWidth, setPanelWidth] = useState<number>(360);
  const panelMin = 280;
  const panelMax = 720;
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  useEffect(() => {
    if (currentCampaign) {
      setCampaignForm({
        name: currentCampaign.name,
        description: currentCampaign.description ?? '',
        start_date: currentCampaign.start_date ? currentCampaign.start_date.split('T')[0] : null,
        end_date: currentCampaign.end_date ? currentCampaign.end_date.split('T')[0] : null,
        status: currentCampaign.status,
      });
    } else {
      setCampaignForm(initialCampaignFormState);
    }
  }, [currentCampaign]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const dx = e.clientX - startXRef.current;
      let newW = startWidthRef.current - dx;
      if (newW < panelMin) newW = panelMin;
      if (newW > panelMax) newW = panelMax;
      setPanelWidth(newW);
    };
    const handleMouseUp = () => {
      resizingRef.current = false;
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const onStartResize = (e: React.MouseEvent) => {
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
  };

  const handleFormChange = (patch: Partial<CampaignFormState>) => {
    setCampaignForm(prev => ({ ...prev, ...patch }));
  };
  
  const handleSaveCampaign = () => {
    if (!campaignForm.name || campaignForm.name.trim() === '') {
      toast.error('Campaign name is required.');
      return;
    }
    
    const payload = { ...campaignForm };

    if (currentCampaign) {
      dispatch(updateCampaign({ id: currentCampaign?.id, changes: payload }));
    } else {
      dispatch(createCampaign(payload as Partial<Campaign>)).then((action) => {
        if (createCampaign.fulfilled.match(action)) {
          dispatch(setCurrentCampaign(action.payload));
        }
      });
    }
  };

  const handleDeleteCampaign = () => {
    if (!currentCampaign) return;

    toast.warning(`Are you sure you want to delete "${currentCampaign.name}"?`, {
        action: {
            label: 'Confirm Delete',
            onClick: () => dispatch(deleteCampaign(currentCampaign?.id)),
        },
        duration: 8000,
    });
  };

  const handleTemplateContentChange = (content: string) => {
    if (editingTemplate) {
        setEditingTemplate({...editingTemplate, content});
    }
  }

  const saveTemplate = () => {
    if(editingTemplate) {
        const newTemplates = templates[activeTab].map(t => t?.id === editingTemplate?.id ? editingTemplate : t)
        setTemplates(prev => ({...prev, [activeTab]: newTemplates}));
        setEditingTemplate(null);
        toast.success("Template Saved!");
    }
  }

  const TemplateEditor = ({template, onContentChange, onSave}: {template: Template, onContentChange: (content: string) => void, onSave: () => void}) => {
    return (
        <div className="p-4 border rounded-lg bg-secondary/30 mt-2 space-y-3">
            <h4 className="font-semibold">{template.name}</h4>
            <Textarea 
                value={template.content}
                onChange={(e) => onContentChange(e.target.value)}
                rows={5}
                className="bg-background focus-visible:ring-1"
            />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                <Button size="sm" onClick={onSave}><Save className="mr-2 h-4 w-4"/> Save</Button>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">AI Messaging Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Teach the AI about your business to generate personalized WhatsApp messages for your leads.
        </p>
      </div>
      
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 flex gap-8">
          {/* this is for campaigns  */}
          {/* <div className="relative" style={{ width: panelWidth }}> */}
            {/* <div onMouseDown={onStartResize} className="absolute top-0 -left-2 h-full w-4 cursor-col-resize group" title="Drag to resize">
              <div className="h-full w-0.5 bg-border mx-auto group-hover:bg-primary transition-colors" />
            </div> */}
            {/* <Card className="h-full">
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Select a campaign to edit or create a new one.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="campaign-select">Active Campaign</Label>
                        <Select
                            value={currentCampaign?.id ?? 'new'}
                            onValueChange={(value) => {
                                if (value === 'new') {
                                    dispatch(setCurrentCampaign(null));
                                } else {
                                    const selected = campaignList.find(c => c?.id === value);
                                    dispatch(setCurrentCampaign(selected || null));
                                }
                            }}
                        >
                            <SelectTrigger id="campaign-select">
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">
                                    <span className="flex items-center gap-2 text-primary">
                                        <PlusCircle className="h-4 w-4"/> Create New Campaign
                                    </span>
                                </SelectItem>
                                {campaignList.map(c => (
                                    <SelectItem key={c?.id} value={c?.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      value={campaignForm.name}
                      onChange={(e) => handleFormChange({ name: e.target.value })}
                      placeholder="My Spring Campaign"
                    />

                    <Label htmlFor="campaign-desc">Description</Label>
                    <Textarea id="campaign-desc" rows={4} value={campaignForm.description ?? ''} onChange={(e) => handleFormChange({ description: e.target.value })} />

                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !campaignForm.start_date && "text-muted-foreground")}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {campaignForm.start_date ? format(new Date(campaignForm.start_date), "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={campaignForm.start_date ? new Date(campaignForm.start_date) : undefined}
                                    onSelect={(date) => handleFormChange({ start_date: date ? format(date, 'yyyy-MM-dd') : null })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor="end-date">End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !campaignForm.end_date && "text-muted-foreground")}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {campaignForm.end_date ? format(new Date(campaignForm.end_date), "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={campaignForm.end_date ? new Date(campaignForm.end_date) : undefined}
                                    onSelect={(date) => handleFormChange({ end_date: date ? format(date, 'yyyy-MM-dd') : null })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={campaignForm.status} onValueChange={(v) => handleFormChange({ status: v as CampaignFormState['status'] })}>
                        <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <div>
                         {currentCampaign && (
                             <Button variant="destructive" size="sm" onClick={handleDeleteCampaign} disabled={isSaving}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                         )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => dispatch(setCurrentCampaign(null))} disabled={isSaving}>New</Button>
                            <Button onClick={handleSaveCampaign} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                {currentCampaign ? 'Update' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card> */}
          {/* </div> */}

          <div className="flex-1 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Business Information</CardTitle>
                <CardDescription>Provide context for the AI.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="business-info">About Your Business</Label>
                  <Textarea
                    id="business-info"
                    placeholder="Describe your company, products, services, and target audience..."
                    rows={8}
                    value={businessInfo}
                    onChange={(e) => setBusinessInfo(e.target.value)}
                  />
                  <Button className="w-full">
                    <Save className="mr-2 h-4 w-4"/> Save Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 lg:col-span-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Messaging Templates</CardTitle>
                <CardDescription>Manage your WhatsApp message templates.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TemplateType)} className="w-full">
                  <TabsList>
                    <TabsTrigger value="INITIAL_OUTREACH">Initial Outreach</TabsTrigger>
                    <TabsTrigger value="RE_ENGAGEMENT">Re-engagement</TabsTrigger>
                  </TabsList>
                  <div className="py-4 flex gap-4 items-center">
                    <Button disabled={isPending}>
                      {isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generating...</>
                      ) : (
                        <><Wand2 className="mr-2 h-4 w-4" /> Generate New Template</>
                      )}
                    </Button>
                    {activeTab === 'RE_ENGAGEMENT' && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tone-select">Tone:</Label>
                        <Select value={reEngagementTone} onValueChange={(v) => setReEngagementTone(v as ToneType)}>
                          <SelectTrigger id="tone-select" className="w-[180px]">
                            <SelectValue placeholder="Select a tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Friendly">Friendly</SelectItem>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Direct">Direct</SelectItem>
                            <SelectItem value="Casual">Casual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {Object.keys(templates).map(key => (
                    <TabsContent key={key} value={key}>
                      <div className="space-y-3">
                        {templates[key as TemplateType].map((template) => (
                          <div key={template?.id}>
                              { editingTemplate?.id === template?.id ? (
                                <TemplateEditor template={editingTemplate} onContentChange={handleTemplateContentChange} onSave={saveTemplate} />
                              ) : (
                                <div className="p-3 border rounded-lg hover:bg-secondary/30 transition-colors flex justify-between items-center">
                                  <div className="flex-1">
                                    <p className="font-medium">{template.name}</p>
                                    <p className="text-sm text-muted-foreground truncate max-w-md">{template.content}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(template)}><FileEdit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive/80 hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}