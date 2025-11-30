import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../api/supabase';
import { RootState } from '../store';


// Define the type for the contact form data
interface ContactData {
  name: string;
  email: string;
  message: string;
}

// Define the type for this slice's state
interface ContactState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Define the initial state
const initialState: ContactState = {
  status: 'idle',
  error: null,
};

// Create the async thunk for submitting a contact message
export const submitContactForm = createAsyncThunk<
  any,
  ContactData,
  { rejectValue: string }
>(
  'contacts/submitContactForm',
  async (contactData, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select();

      if (error) {
        return rejectWithValue(error.message);
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'An unexpected error occurred');
    }
  }
);

// Create the contacts slice
const contactSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    resetContactStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitContactForm.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(submitContactForm.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(submitContactForm.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Submission failed';
      });
  },
});

export const { resetContactStatus } = contactSlice.actions;

// Selector for the contact state
export const selectContactState = (state: RootState) => state.contact;

export default contactSlice.reducer;
