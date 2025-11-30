import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/api/supabase-client";
import { toast } from "sonner";
import { Campaign, getErrorMessage } from "../types/leadTypes";
import { RootState } from "../store";

interface CampaignState {
  list: Campaign[];
  current?: Campaign | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CampaignState = {
  list: [],
  current: null,
  loading: "idle",
  error: null,
};

export const fetchCampaigns = createAsyncThunk<
  Campaign[],
  void,
  { rejectValue: string }
>("campaigns/fetchAll", async (_, { rejectWithValue }) => {
  const toastId = toast.loading("Loading campaigns...");
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    toast.success("Campaigns loaded", { id: toastId });
    return data || [];
  } catch (error) {
    const msg = getErrorMessage(error, "Failed to load campaigns.");
    toast.error(msg, { id: toastId });
    return rejectWithValue(msg);
  }
});

export const createCampaign = createAsyncThunk<
  Campaign,
  Partial<Campaign>,
  { rejectValue: string; state: RootState }
>(
  "campaigns/create",
  async (payload, { rejectWithValue, getState }) => {
    const toastId = toast.loading("Creating campaign...");

    const user = getState().auth.user;

    if (!user) {
      const msg = "You must be logged in to create a campaign.";
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }

    try {
      const supabase = createClient();
      const campaignData = { ...payload, user_id: user.id };

      const { data, error } = await supabase
        .from("campaigns")
        .insert([campaignData]) 
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Insert failed - no data returned');

      toast.success("Campaign created", { id: toastId });
      return data[0];
    } catch (error) {
      const msg = getErrorMessage(error, "Create campaign failed.");
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

export const updateCampaign = createAsyncThunk<
  Campaign,
  { id: string; changes: Partial<Campaign> },
  { rejectValue: string }
>("campaigns/update", async ({ id, changes }, { rejectWithValue }) => {
  const toastId = toast.loading("Updating campaign...");
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .update(changes)
      .eq("id", id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Update failed - campaign not found');
    toast.success("Campaign updated", { id: toastId });
    return data[0];
  } catch (error) {
    const msg = getErrorMessage(error, "Update campaign failed.");
    toast.error(msg, { id: toastId });
    return rejectWithValue(msg);
  }
});

export const deleteCampaign = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("campaigns/delete", async (id, { rejectWithValue }) => {
  const toastId = toast.loading("Deleting campaign...");
  try {
    const supabase = createClient();
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) throw error;
    toast.success("Campaign deleted", { id: toastId });
    return id;
  } catch (error) {
    const msg = getErrorMessage(error, "Delete campaign failed.");
    toast.error(msg, { id: toastId });
    return rejectWithValue(msg);
  }
});

const campaignSlice = createSlice({
  name: "campaigns",
  initialState,
  reducers: {
    setCurrentCampaign: (state, action: PayloadAction<Campaign | null>) => {
      state.current = action.payload;
    },
    clearCampaignError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload || "Failed to fetch campaigns";
      })
      .addCase(createCampaign.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.list.unshift(action.payload);
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload || "Create campaign failed";
      })
      .addCase(updateCampaign.pending, (state) => {
        state.loading = "pending";
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.list = state.list.map((c) =>
          c.id === action.payload.id ? action.payload : c
        );
        if (state.current?.id === action.payload.id)
          state.current = action.payload;
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload || "Update campaign failed";
      })
      .addCase(deleteCampaign.pending, (state) => {
        state.loading = "pending";
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.list = state.list.filter((c) => c.id !== action.payload);
        if (state.current?.id === action.payload) state.current = null;
      })
      .addCase(deleteCampaign.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload || "Delete campaign failed";
      });
  },
});

export const { setCurrentCampaign, clearCampaignError } = campaignSlice.actions;
export default campaignSlice.reducer;
