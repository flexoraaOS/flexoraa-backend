import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  isCampaignModalOpen: boolean;
  isLeadModalOpen: boolean;
  isContactModalOpen: boolean;
  selectedId?: string | null;
  toastCount: number;
}

const initialState: UIState = {
  isCampaignModalOpen: false,
  isLeadModalOpen: false,
  isContactModalOpen: false,
  selectedId: null,
  toastCount: 0,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openCampaignModal: (
      state,
      action: PayloadAction<string | null | undefined>
    ) => {
      state.isCampaignModalOpen = true;
      state.selectedId = action.payload ?? null;
    },
    closeCampaignModal: (state) => {
      state.isCampaignModalOpen = false;
      state.selectedId = null;
    },
    openLeadModal: (
      state,
      action: PayloadAction<string | null | undefined>
    ) => {
      state.isLeadModalOpen = true;
      state.selectedId = action.payload ?? null;
    },
    closeLeadModal: (state) => {
      state.isLeadModalOpen = false;
      state.selectedId = null;
    },
    openContactModal: (
      state,
      action: PayloadAction<string | null | undefined>
    ) => {
      state.isContactModalOpen = true;
      state.selectedId = action.payload ?? null;
    },
    closeContactModal: (state) => {
      state.isContactModalOpen = false;
      state.selectedId = null;
    },
    incrementToastCount: (state) => {
      state.toastCount += 1;
    },
    resetToastCount: (state) => {
      state.toastCount = 0;
    },
  },
});

export const {
  openCampaignModal,
  closeCampaignModal,
  openLeadModal,
  closeLeadModal,
  openContactModal,
  closeContactModal,
  incrementToastCount,
  resetToastCount,
} = uiSlice.actions;

export default uiSlice.reducer;
