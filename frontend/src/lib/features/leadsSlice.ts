import { createSlice, createAsyncThunk, PayloadAction, isRejectedWithValue } from '@reduxjs/toolkit';
import { supabase } from '@/lib/api/supabase';
import { toast } from 'sonner';
import { Lead, LeadStages, getErrorMessage } from '../types/leadTypes';
import type { RootState } from '../store';

interface LeadsState {
  list: Lead[];
  current?: Lead | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: LeadsState = {
  list: [],
  current: null,
  loading: 'idle',
  error: null,
};

export const fetchLeads = createAsyncThunk<
  Lead[],
  { campaignId?: string | null; limit?: number; userId?: string } | undefined,
  { rejectValue: string }
>('leads/fetchAll', async (payload, { rejectWithValue }) => {
  const toastId = toast.loading('Loading leads...');
  try {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

    if (payload?.campaignId) {
      query = query.eq('campaign_id', payload.campaignId);
    }
    
    if (payload?.userId) {
      query = query.eq('user_id', payload.userId);
    }

    if (payload?.limit) {
      query = query.limit(payload.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    toast.success('Leads loaded', { id: toastId });
    return (data as Lead[]) || [];
  } catch (error) {
    const msg = getErrorMessage(error, 'Failed to load leads.');
    toast.error(msg, { id: toastId });
    return rejectWithValue(msg);
  }
});

export const createLead = createAsyncThunk<Lead, Partial<Lead>, { rejectValue: string }>(
  'leads/create',
  async (payload, { rejectWithValue }) => {
    const toastId = toast.loading('Creating lead...');
    try {
      const { data, error } = await supabase.from('leads').insert([payload]).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Insert failed - no data returned');
      toast.success('Lead created', { id: toastId });
      return data[0] as Lead;
    } catch (error) {
      const msg = getErrorMessage(error, 'Create lead failed.');
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

export const updateLead = createAsyncThunk<
  Lead,
  { id: string; changes: Partial<Lead> },
  { rejectValue: string }
>('leads/update', async ({ id, changes }, { rejectWithValue }) => {
  const toastId = toast.loading('Updating lead...');
  try {
    const { data, error } = await supabase.from('leads').update(changes).eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Update failed - lead not found');
    toast.success('Lead updated', { id: toastId });
    return data[0] as Lead;
  } catch (error) {
    const msg = getErrorMessage(error, 'Update lead failed.');
    toast.error(msg, { id: toastId });
    return rejectWithValue(msg);
  }
});

export const deleteLead = createAsyncThunk<string, string, { rejectValue: string }>(
  'leads/delete',
  async (id, { rejectWithValue }) => {
    const toastId = toast.loading('Deleting lead...');
    try {
      const { data, error } = await supabase.from('leads').delete().eq('id', id).select();
      if (error) throw error;
      toast.success('Lead deleted', { id: toastId });
      return data && data.length > 0 ? (data[0] as Lead).id : id;
    } catch (error) {
      const msg = getErrorMessage(error, 'Delete lead failed.');
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

export const assignLeadToCampaign = createAsyncThunk<
  Lead,
  { leadId: string; campaignId: string },
  { rejectValue: string }
>('leads/assignToCampaign', async ({ leadId, campaignId }, { rejectWithValue }) => {
  const toastId = toast.loading('Assigning lead...');
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ campaign_id: campaignId })
      .eq('id', leadId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Lead not found');
    toast.success('Lead assigned', { id: toastId });
    return data[0] as Lead;
  } catch (error) {
    const msg = getErrorMessage(error, 'Assign failed.');
    toast.error(msg, { id: toastId });
    return rejectWithValue(msg);
  }
});

export const scheduleFollowUp = createAsyncThunk<
  Lead,
  { id: string; followupDate: string; followupTime: string },
  { rejectValue: string }
>(
  'leads/scheduleFollowUp',
  async ({ id, followupDate, followupTime }, { rejectWithValue }) => {
    const toastId = toast.loading('Scheduling follow-up...');
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ followup_date: followupDate, followup_time: followupTime })
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Lead not found');
      toast.success('Follow-up scheduled!', { id: toastId });
      return data[0] as Lead;
    } catch (error) {
      const msg = getErrorMessage(error, 'Failed to schedule follow-up.');
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);


export const scheduleBooking = createAsyncThunk<
  Lead,
  { id: string; booked_timestamp: string },
  { rejectValue: string }
>(
  'leads/scheduleBooking',
  async ({ id, booked_timestamp }, { rejectWithValue }) => {
    const toastId = toast.loading('Scheduling booking...');

    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ booked_timestamp, stage:"booked" })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Lead not found');

      toast.success('Booking scheduled!', { id: toastId });
      return data[0] as Lead;
    } catch (error) {
      const msg = getErrorMessage(error, 'Failed to schedule booking.');
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

export const updateLeadStage = createAsyncThunk<
  Lead,
  { leadId: string; stage: LeadStages },
  { rejectValue: string }
>('leads/updateStage', async ({ leadId, stage }, { rejectWithValue }) => {
  const toastId = toast.loading(`Updating stage to "${stage}"...`);
  try {
    const updates: Partial<Lead> = { stage: stage as unknown as string };

    // If stage === 'converted' (case-insensitive), set closed = true
    if (String(stage).toLowerCase() === 'converted') {
      updates.closed = true;
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Lead not found');

    toast.success('Lead stage updated!', { id: toastId });
    return data[0] as Lead;
  } catch (error) {
    const msg = getErrorMessage(error, 'Failed to update lead stage.');
    toast.error(msg, { id: toastId });
    return rejectWithValue(msg);
  }
});

export const addNote = createAsyncThunk<
  Lead,
  { leadId: string; note: string },
  { rejectValue: string }
>('leads/addNote', async ({ leadId, note }, { rejectWithValue }) => {
  const toastId = toast.loading('Saving note...');
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ note: note })
      .eq('id', leadId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Lead not found');

    toast.success('Note saved!', { id: toastId });
    return data[0] as Lead;
  } catch (error) {
    const msg = getErrorMessage(error, 'Failed to save note.');
    toast.error(msg, { id: toastId });
    return rejectWithValue(msg);
  }
});

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setCurrentLead: (state, action: PayloadAction<Lead | null>) => {
      state.current = action.payload;
    },
    clearLeadsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Failed to fetch leads';
      })
      .addCase(createLead.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list = [action.payload, ...state.list];
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Create lead failed';
      })
      .addCase(updateLead.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list = state.list.map((l) => (l.id === action.payload.id ? action.payload : l));
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Update lead failed';
      })
      .addCase(deleteLead.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list = state.list.filter((l) => l.id !== action.payload);
        if (state.current?.id === action.payload) state.current = null;
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Delete lead failed';
      })
      .addCase(assignLeadToCampaign.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(assignLeadToCampaign.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list = state.list.map((l) => (l.id === action.payload.id ? action.payload : l));
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(assignLeadToCampaign.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Assign lead failed';
      })
      // old  follow-up scheduling cases
      .addCase(scheduleFollowUp.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(scheduleFollowUp.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list = state.list.map((l) => (l.id === action.payload.id ? action.payload : l));
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(scheduleFollowUp.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Schedule follow-up failed';
      })
      // booking timestamp cases 
      .addCase(scheduleBooking.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(scheduleBooking.fulfilled, (state, action: PayloadAction<Lead>) => {
        state.loading = 'succeeded';
        state.list = state.list.map((lead) =>
          lead.id === action.payload.id ? action.payload : lead
        );
        if (state.current?.id === action.payload.id) {
          state.current = action.payload;
        }
      })
      .addCase(scheduleBooking.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Failed to schedule booking';
      })
      // update lead stage cases 
      .addCase(updateLeadStage.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(updateLeadStage.fulfilled, (state, action: PayloadAction<Lead>) => {
        state.loading = 'succeeded';

       
        const payload: Lead = { ...action.payload };
        if (String(payload.stage ?? '').toLowerCase() === 'converted' && !payload.closed) {
          payload.closed = true;
        }

        state.list = state.list.map((lead) => (lead.id === payload.id ? payload : lead));
        if (state.current?.id === payload.id) {
          state.current = payload;
        }
      })
      .addCase(updateLeadStage.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Failed to update lead stage';
      })
      // Add Note cases
      .addCase(addNote.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(addNote.fulfilled, (state, action: PayloadAction<Lead>) => {
        state.loading = 'succeeded';
        state.list = state.list.map((lead) =>
          lead.id === action.payload.id ? action.payload : lead
        );
        if (state.current?.id === action.payload.id) {
          state.current = action.payload;
        }
      })
      .addCase(addNote.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Failed to save note';
      });
  },
});

export const { setCurrentLead, clearLeadsError } = leadsSlice.actions;

export const selectLeads = (state: RootState) => state.leads.list;
export const selectLeadsLoading = (state: RootState) => state.leads.loading === 'pending';
export const selectLeadsError = (state: RootState) => state.leads.error;

export default leadsSlice.reducer;
