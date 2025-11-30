import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/api/supabase-client";
import { toast } from "sonner";

export interface CompanyDetails {
  id?: string;
  created_at?: string;
  company_name: string;
  company_type: string;
  country: string;
  state?: string;
  gst_number?: string;
  gst_rate: string;
  sector: string;
}

interface CompanyDetailsState {
  data: CompanyDetails | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  isInitialized: boolean;
}

const initialState: CompanyDetailsState = {
  data: null,
  loading: "idle",
  error: null,
  isInitialized: false,
};

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

// Async thunk to fetch company details
export const fetchCompanyDetails = createAsyncThunk<
  { companyDetails: CompanyDetails | null },
  string,
  { rejectValue: string }
>("companyDetails/fetchCompanyDetails", async (userId, { rejectWithValue }) => {
  try {
    const supabase = createClient();
    const { data: company, error } = await supabase
      .from("company")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching company details:", error);
      return rejectWithValue("Failed to load company details");
    }

    return { companyDetails: company || null };
  } catch (error) {
    console.error("Error loading company details:", error);
    const errorMessage = getErrorMessage(
      error,
      "Failed to load company details"
    );
    return rejectWithValue(errorMessage);
  }
});

// Async thunk to save company details
export const saveCompanyDetails = createAsyncThunk<
  { companyDetails: CompanyDetails },
  { userId: string; companyDetails: CompanyDetails },
  { rejectValue: string }
>(
  "companyDetails/saveCompanyDetails",
  async ({ userId, companyDetails }, { rejectWithValue }) => {
    const toastId = toast.loading("Saving company details...");

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("company")
        .upsert(
          {
            id: userId, // Use user ID as the primary key
            company_name: companyDetails.company_name,
            company_type: companyDetails.company_type,
            country: companyDetails.country,
            state: companyDetails.state,
            gst_number: companyDetails.gst_number,
            gst_rate: companyDetails.gst_rate,
            sector: companyDetails.sector,
          },
          {
            onConflict: "id", // Handle conflicts on the id column
            ignoreDuplicates: false, // We want to update if record exists
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Error saving to Supabase:", error);
        toast.error("Failed to save company details", { id: toastId });
        return rejectWithValue("Failed to save company details to database");
      }

      toast.success("Company details saved successfully!", { id: toastId });
      return { companyDetails: data };
    } catch (error) {
      console.error("Error saving company details:", error);
      const errorMessage = getErrorMessage(
        error,
        "Failed to save company details"
      );
      toast.error(errorMessage, { id: toastId });
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk to update company details
export const updateCompanyDetails = createAsyncThunk<
  { companyDetails: CompanyDetails },
  { userId: string; companyDetails: CompanyDetails },
  { rejectValue: string }
>(
  "companyDetails/updateCompanyDetails",
  async ({ userId, companyDetails }, { rejectWithValue }) => {
    const toastId = toast.loading("Updating company details...");

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("company")
        .update({
          company_name: companyDetails.company_name,
          company_type: companyDetails.company_type,
          country: companyDetails.country,
          state: companyDetails.state,
          gst_number: companyDetails.gst_number,
          gst_rate: companyDetails.gst_rate,
          sector: companyDetails.sector,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating to Supabase:", error);
        toast.error("Failed to update company details", { id: toastId });
        return rejectWithValue("Failed to update company details to database");
      }

      toast.success("Company details updated successfully!", { id: toastId });
      return { companyDetails: data };
    } catch (error) {
      console.error("Error updating company details:", error);
      const errorMessage = getErrorMessage(
        error,
        "Failed to update company details"
      );
      toast.error(errorMessage, { id: toastId });
      return rejectWithValue(errorMessage);
    }
  }
);

const companyDetailsSlice = createSlice({
  name: "companyDetails",
  initialState,
  reducers: {
    clearCompanyDetails: (state) => {
      state.data = null;
      state.error = null;
      state.loading = "idle";
    },
    setCompanyDetailsLoading: (
      state,
      action: PayloadAction<"idle" | "pending" | "succeeded" | "failed">
    ) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyDetails.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(fetchCompanyDetails.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload.companyDetails;
        state.isInitialized = true;
      })
      .addCase(fetchCompanyDetails.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload || "Failed to fetch company details";
        state.isInitialized = true;
      })
      .addCase(saveCompanyDetails.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(saveCompanyDetails.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload.companyDetails;
      })
      .addCase(saveCompanyDetails.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload || "Failed to save company details";
      })
      .addCase(updateCompanyDetails.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(updateCompanyDetails.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload.companyDetails;
      })
      .addCase(updateCompanyDetails.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload || "Failed to update company details";
      });
  },
});

export const { clearCompanyDetails, setCompanyDetailsLoading } =
  companyDetailsSlice.actions;
export default companyDetailsSlice.reducer;
