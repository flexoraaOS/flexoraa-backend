import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

// Create a noop storage for SSR
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Use noop storage on server, real storage on client
const storage = typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

import authReducer from "./features/authSlice";
import feedbackReducer from "./features/feedbackSlice";
import contactReducer from "./features/contactSlice";
import leadsReducer from "./features/leadsSlice";
import contactsReducer from "./features/contactsSlice";
import campaignReducer from "./features/campaignSlice";
import teamReducer from "./features/teamSlice";
import orderReducer from "./features/orderSlice";
import credentialsReducer from "./features/credentialsSlice";
import conversationReducer from "./features/conversationSlice";
import companyDetailsReducer from "./features/companyDetailsSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  feedback: feedbackReducer,
  contact: contactReducer,
  leads: leadsReducer,
  contacts: contactsReducer,
  campaign: campaignReducer,
  team: teamReducer,
  order: orderReducer,
  credentials: credentialsReducer,
  conversations: conversationReducer,
  companyDetails: companyDetailsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create the persistor object
export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
