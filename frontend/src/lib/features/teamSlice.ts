import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/api/supabase';

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamState {
  members: TeamMember[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TeamState = {
  members: [],
  loading: 'idle',
  error: null,
};

export const fetchMyTeam = createAsyncThunk(
  'team/fetchMyTeam',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('invited_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch team members';
      return rejectWithValue(errorMessage);
    }
  }
);

export const inviteTeamMember = createAsyncThunk(
  'team/inviteTeamMember',
  async ({ email, role, invitedBy }: { email: string; role: string; invitedBy: string }, { rejectWithValue }) => {
    try {
      // For now, we'll just create the invitation without checking if user exists
      // In a real implementation, you'd check if the user exists and handle accordingly
      const teamMemberData = {
        user_id: null, // Will be set when user accepts invitation
        email,
        role: role || 'member',
        status: 'pending',
        invited_by: invitedBy,
      };

      const { data, error } = await supabase
        .from('team_members')
        .insert(teamMemberData)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Insert failed - no data returned');
      return data[0];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite team member';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateTeamMemberRole = createAsyncThunk(
  'team/updateTeamMemberRole',
  async ({ memberId, role }: { memberId: string; role: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Update failed - team member not found');
      return data[0];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team member role';
      return rejectWithValue(errorMessage);
    }
  }
);

export const removeTeamMember = createAsyncThunk(
  'team/removeTeamMember',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return memberId;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove team member';
      return rejectWithValue(errorMessage);
    }
  }
);

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTeam.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchMyTeam.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.members = action.payload;
      })
      .addCase(fetchMyTeam.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default teamSlice.reducer;
