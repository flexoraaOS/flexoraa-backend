// AddNoteDialog.tsx
'use client';

import React from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { addNote } from '@/lib/features/leadsSlice';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mic, Square, Save } from 'lucide-react';
import { Lead } from '@/lib/types/leadTypes';

interface AddNoteDialogProps {
  lead: Lead;
}

const AddNoteDialog: React.FC<AddNoteDialogProps> = ({ lead }) => {
  const [note, setNote] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);
  const dispatch = useDispatch();

  React.useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          setNote((prev) => prev + event.results[i][0].transcript + ' ');
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event?.error ?? event);
      toast.error(`Voice Error: ${event?.error ?? 'Unknown error'}`);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        if (recognitionRef.current && recognitionRef.current.stop) {
          recognitionRef.current.stop();
        }
      } catch {}
      finally {
        recognitionRef.current = null;
      }
    };
  }, []);

  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      toast.error('Voice Not Supported — your browser does not support voice recognition.');
      return;
    }

    try {
      if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
      } else {
        recognitionRef.current.start();
        setIsRecording(true);
      }
    } catch (err: any) {
      console.error('Recognition start/stop error', err);
      toast.error(err?.message ?? 'Failed to start/stop voice recognition.');
      setIsRecording(false);
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim()) {
      toast.error('Please enter or record a note before saving.');
      return;
    }

    try {
      if (isRecording && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    } catch {}

    setSaving(true);
    try {
      await (dispatch as any)(
        addNote({
          leadId: String(lead.id),
          note: String(note).trim(),
        })
      ).unwrap();

      setNote('');
      setOpen(false);
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Add Note
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note for {lead.name || lead.phone_number}</DialogTitle>
          <DialogDescription>
            Record key details from your conversation. You can type or use your voice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label htmlFor={`note-${lead.id}`}>Note</Label>
          <Textarea
            id={`note-${lead.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            placeholder="Enter notes here..."
          />

          <Button variant="outline" onClick={toggleRecording} className="w-full" type="button">
            {isRecording ? (
              <>
                <Square className="mr-2 h-4 w-4 text-red-500 animate-pulse" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" /> Record Note
              </>
            )}
          </Button>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>

          <Button onClick={handleSaveNote} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteDialog;
