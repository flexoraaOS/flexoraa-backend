import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/api/supabase';
import { toast } from 'sonner';
import { getErrorMessage } from '../types/leadTypes';
import type { RootState } from '../store';

export interface Credential {
  id: string;
  user_id: string; 
  business_manager_id: string;
  business_account_id: string; 
  phone_number_id: string; 
  meta_access_token: string; 
  created_at: string;
}

type SaveCredentialsPayload = {
  id: string;
  business_manager_id: string;
  business_account_id: string;
  phone_number_id: string;
  meta_access_token: string;
};

interface CredentialsState {
  data: Credential | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CredentialsState = {
  data: null,
  loading: 'idle',
  error: null,
};

export const fetchCredentials = createAsyncThunk<
  Credential | null,
  string,
  { rejectValue: string }
>('credentials/fetch', async (userId, { rejectWithValue }) => {
  const toastId = toast.loading('Loading credentials...');
  try {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    
    if (data) {
        toast.success('Credentials loaded', { id: toastId });
    } else {
        toast.dismiss(toastId);
    }
    
    return data as Credential | null;
  } catch (error) {
    const msg = getErrorMessage(error, 'Failed to load credentials.');
    toast.error(msg, { id: toastId });
    return rejectWithValue(msg);
  }
});


const credentialsSlice = createSlice({
  name: 'credentials',
  initialState,
  reducers: {
    clearCredentialsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCredentials.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchCredentials.fulfilled, (state, action: PayloadAction<Credential | null>) => {
        state.loading = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchCredentials.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || 'Failed to fetch credentials';
      })
  },
});

export const { clearCredentialsError } = credentialsSlice.actions;

export const selectCredentials = (state: RootState) => state.credentials.data;
export const selectCredentialsLoading = (state: RootState) => state.credentials.loading === 'pending';
export const selectCredentialsError = (state: RootState) => state.credentials.error;

export default credentialsSlice.reducer;
