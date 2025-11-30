import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/api/supabase';
import { toast } from 'sonner';
import { Contact, getErrorMessage } from '../types/leadTypes';

interface ContactsState {
  list: Contact[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ContactsState = {
  list: [],
  loading: 'idle',
  error: null,
};

export const fetchContacts = createAsyncThunk<Contact[], void, { rejectValue: string }>(
  'contacts/fetchAll',
  async (_, { rejectWithValue }) => {
    const toastId = toast.loading('Loading contacts...');
    try {
      const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      toast.success('Contacts loaded', { id: toastId });
      return data || [];
    } catch (error) {
      const msg = getErrorMessage(error, 'Failed to load contacts.');
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

export const createContact = createAsyncThunk<Contact, Partial<Contact>, { rejectValue: string }>(
  'contacts/create',
  async (payload, { rejectWithValue }) => {
    const toastId = toast.loading('Creating contact...');
    try {
      const { data, error } = await supabase.from('contacts').insert([payload]).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Insert failed - no data returned');
      toast.success('Contact created', { id: toastId });
      return data[0];
    } catch (error) {
      const msg = getErrorMessage(error, 'Create contact failed.');
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

export const updateContact = createAsyncThunk<Contact, { id: string; changes: Partial<Contact> }, { rejectValue: string }>(
  'contacts/update',
  async ({ id, changes }, { rejectWithValue }) => {
    const toastId = toast.loading('Updating contact...');
    try {
      const { data, error } = await supabase.from('contacts').update(changes).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Update failed - contact not found');
      toast.success('Contact updated', { id: toastId });
      return data[0];
    } catch (error) {
      const msg = getErrorMessage(error, 'Update contact failed.');
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

export const deleteContact = createAsyncThunk<string, string, { rejectValue: string }>(
  'contacts/delete',
  async (id, { rejectWithValue }) => {
    const toastId = toast.loading('Deleting contact...');
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Contact deleted', { id: toastId });
      return id;
    } catch (error) {
      const msg = getErrorMessage(error, 'Delete contact failed.');
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    clearContactsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Failed to load contacts';
      })
      .addCase(createContact.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list.unshift(action.payload);
      })
      .addCase(createContact.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Create contact failed';
      })
      .addCase(updateContact.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list = state.list.map((c) => (c.id === action.payload.id ? action.payload : c));
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Update contact failed';
      })
      .addCase(deleteContact.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.list = state.list.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Delete contact failed';
      });
  },
});

export const { clearContactsError } = contactsSlice.actions;
export default contactsSlice.reducer;