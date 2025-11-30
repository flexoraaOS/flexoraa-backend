import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../api/supabase';
import { RootState } from '../store';

interface FeedbackData {
  name: string;
  email: string;
  feedback: string;
}

interface FeedbackState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: FeedbackState = {
  status: 'idle',
  error: null,
};

// Create the async thunk with proper types
export const submitFeedback = createAsyncThunk<
  any, 
  FeedbackData,
  { rejectValue: string } 
>(
  'feedback/submitFeedback',
  async (feedbackData, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert([feedbackData])
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

// Create the slice
const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    resetStatus: (state) => {
        state.status = 'idle';
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitFeedback.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(submitFeedback.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Submission failed';
      });
  },
});

export const { resetStatus } = feedbackSlice.actions;

// Optional: Create a typed selector
export const selectFeedbackState = (state: RootState) => state.feedback;

export default feedbackSlice.reducer;
