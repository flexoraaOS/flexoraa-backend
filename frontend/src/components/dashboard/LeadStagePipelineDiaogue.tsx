import React from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { toast } from 'sonner';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Save,
    Flame,
    Target,
    Phone,
    UserCheck,
    FileText,
    CheckCircle,
    XCircle,
    HelpCircle,
} from 'lucide-react';
import { Lead, LeadStages } from '@/lib/types/leadTypes';
import { LEAD_STAGES } from '@/lib/types/constants';
import { updateLeadStage } from '@/lib/features/leadsSlice';
import { cn } from '@/lib/utils';

export interface LeadPipelineDialogProps {
    lead: Lead;
    pipelineStages?: LeadStages[];
    children: React.ReactNode;
    onUpdated?: (updatedLead: Lead) => void;
}

const pretty = (s?: string) =>
    typeof s === 'string' && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s ?? '—';

const stageConfig = {
    new: { icon: Target, description: 'A fresh lead, yet to be contacted.' },
    contacted: { icon: Phone, description: 'Initial contact has been made.' },
    qualified: { icon: UserCheck, description: 'Lead has been vetted and is a good fit.' },
    proposal: { icon: FileText, description: 'A proposal has been sent to the lead.' },
    converted: { icon: CheckCircle, description: 'Lead has successfully become a customer.' },
    lost: { icon: XCircle, description: 'Lead is no longer a prospect.' },
};

const LeadStagePipelineDialog: React.FC<LeadPipelineDialogProps> = ({
    lead,
    pipelineStages = LEAD_STAGES as unknown as LeadStages[],
    children,
    onUpdated,
}) => {
    const dispatch = useAppDispatch();
    const initialStage = (lead.stage ?? pipelineStages[0] ?? 'new') as LeadStages;
    const [open, setOpen] = React.useState(false);
    const [currentStage, setCurrentStage] = React.useState<LeadStages>(initialStage);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            setCurrentStage((lead.stage ?? pipelineStages[0] ?? 'new') as LeadStages);
        }
    }, [lead.stage, pipelineStages, open]);

    const handleStageChange = (newStage: LeadStages) => {
        setCurrentStage(newStage);
    };

    const handleSave = async () => {
        if (!lead.id) {
            toast.error('Lead ID is missing.');
            return;
        }
        setSaving(true);
        const toastId = toast.loading('Updating lead stage...');
        try {
            const updated = await dispatch(updateLeadStage({ leadId: lead.id, stage: currentStage })).unwrap();
            toast.success('Stage updated successfully!', { id: toastId });
            setOpen(false);
            onUpdated?.(updated);
        } catch (err) {
            const msg = typeof err === 'string' ? err : (err as any)?.message ?? 'Failed to update stage';
            toast.error(msg, { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] border-0 bg-card/80 shadow-2xl backdrop-blur-lg rounded-2xl overflow-y-auto">
                <DialogHeader className="px-1 sm:px-6">
                    <DialogTitle className="text-lg sm:text-xl truncate">
                        Lead Pipeline: {lead.name ?? lead.phone_number}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Tap a stage to move the lead, then save your changes.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-1 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 py-4 sm:py-6">
                        {pipelineStages.map((stage, idx) => {
                            const isActive = currentStage === stage;
                            const config = stageConfig[stage as keyof typeof stageConfig] || {
                                icon: HelpCircle,
                                description: 'No description available.',
                            };
                            const Icon = config.icon;

                            return (
                                <div
                                    key={String(stage)}
                                    onClick={() => handleStageChange(stage)}
                                    style={{ animationDelay: `${idx * 75}ms` }}
                                    className={cn(
                                        'group animate-in fade-in zoom-in-95 fill-mode-backwards',
                                        'flex flex-col p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-300 ease-in-out',
                                        'touch-manipulation select-none',
                                        'min-h-[120px] sm:min-h-[140px]',
                                        isActive
                                            ? 'border-primary/50 bg-primary/10 ring-2 ring-primary shadow-lg shadow-primary/20'
                                            : 'border-border/50 bg-background/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98] sm:hover:-translate-y-1',
                                    )}
                                >
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Icon
                                            className={cn(
                                                'h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-colors',
                                                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80',
                                            )}
                                        />
                                        <h3 className="font-semibold text-base sm:text-lg">{pretty(stage)}</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-3 flex-1">
                                        {config.description}
                                    </p>

                                    {isActive && (
                                        <div className="mt-3 sm:mt-4">
                                            <Card className="w-full bg-background/70 shadow-lg animate-in fade-in-50 zoom-in-95 backdrop-blur-sm">
                                                <CardContent className="p-2 sm:p-3 space-y-1 sm:space-y-2 text-center">
                                                    <p
                                                        className="font-semibold text-xs sm:text-sm truncate"
                                                        title={lead.name ?? lead.phone_number}
                                                    >
                                                        {lead.name ?? lead.phone_number}
                                                    </p>
                                                    <Badge variant="secondary" className="text-xs">
                                                        <Flame className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-400" />
                                                        Score: {lead.conversation_score ?? '—'}
                                                    </Badge>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 px-1 sm:px-6">
                    <Button 
                        variant="ghost" 
                        onClick={() => setOpen(false)} 
                        disabled={saving}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving || currentStage === initialStage}
                        className="w-full sm:w-auto"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Save Stage
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LeadStagePipelineDialog;