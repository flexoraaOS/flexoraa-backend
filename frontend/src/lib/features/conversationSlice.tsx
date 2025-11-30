import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/api/supabase-client";
import { toast } from "sonner";
import { getErrorMessage } from "../types/leadTypes"; 

export interface Conversation {
  id: string; 
  created_at: string; 
  instagram?: string | null;
  whatsapp?: string | null;
  facebook?: string | null;
  gmail?: string | null;
  lead_id?: number | null;
  user_id: string; // 👈 add user ownership
}

interface ConversationState {
  list: Conversation[];
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ConversationState = {
  list: [],
  loading: "idle",
  error: null,
};

// ✅ Only fetch conversations belonging to the logged-in user
export const fetchConversations = createAsyncThunk<
  Conversation[],   
  void,             
  { rejectValue: string } 
>(
  "conversations/fetchAll",
  async (_, { rejectWithValue }) => {
    const toastId = toast.loading("Loading conversations...");
    try {
      const supabase = createClient();
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Fetch only conversations for this user
      const { data, error } = await supabase
        .from("conversation_channel") 
        .select("*")
        .eq("user_id", user.id) // 👈 filter by user_id
        .order("created_at", { ascending: false });

      if (error) throw error;

      toast.success("Conversations loaded successfully", { id: toastId });
      return data || [];
    } catch (error) {
      const msg = getErrorMessage(error, "Failed to load conversations.");
      toast.error(msg, { id: toastId });
      return rejectWithValue(msg);
    }
  }
);

const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    clearConversationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
        state.loading = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload || "An unknown error occurred";
      });
  },
});

export const { clearConversationError } = conversationsSlice.actions;
export default conversationsSlice.reducer;
