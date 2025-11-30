import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
  name: 'order',
  initialState: { items: [] },
  reducers: {
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    clearItems: (state) => {
      state.items = [];
    },
  },
});

export const { addItem, clearItems } = orderSlice.actions;
export default orderSlice.reducer;
