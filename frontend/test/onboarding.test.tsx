import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import credentialsReducer from '../src/lib/features/credentialsSlice';
import authReducer from '../src/lib/features/authSlice';
import { OnboardingPage } from '../src/app/onboarding/page';
import { WhatsAppConnectDialog } from '../src/app/onboarding/WhatsAppConnectDialog';
import { InstagramConnectDialog } from '../src/app/onboarding/InstagramConnectDialogue';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: () => 'leados',
  }),
}));

// Mock Supabase client to prevent actual API calls
jest.mock('../src/lib/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      credentials: credentialsReducer,
      auth: authReducer,
    },
    preloadedState: initialState,
  });
};

describe('Onboarding Flow', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    // Initialize store with 'idle' loading state to prevent automatic fetch
    store = createMockStore({
      auth: { user: { id: 'test-user' }, loading: 'idle', error: null },
      credentials: { data: null, loading: 'idle', error: null },
    });
  });

  test('renders WhatsAppConnectDialog with "Connect with Meta" button', async () => {
    render(
      <Provider store={store}>
        <WhatsAppConnectDialog onConnected={() => {}}>
          <button>Open WhatsApp Dialog</button>
        </WhatsAppConnectDialog>
      </Provider>
    );

    fireEvent.click(screen.getByText('Open WhatsApp Dialog'));
    
    // Wait for the dialog to render with the Connect button
    await waitFor(() => {
      expect(screen.getByText('Connect with Meta')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Or connect manually')).not.toBeInTheDocument();
  });

  test('renders InstagramConnectDialog with "Connect with Meta" button', async () => {
    render(
      <Provider store={store}>
        <InstagramConnectDialog onConnected={() => {}}>
          <button>Open Instagram Dialog</button>
        </InstagramConnectDialog>
      </Provider>
    );

    fireEvent.click(screen.getByText('Open Instagram Dialog'));
    
    // Wait for the dialog to render with the Connect button
    await waitFor(() => {
      expect(screen.getByText('Connect with Meta')).toBeInTheDocument();
    });
  });

  test('shows connected status when credentials exist', async () => {
    store = createMockStore({
      auth: { user: { id: 'test-user' }, loading: 'idle', error: null },
      credentials: {
        data: { 
          id: 'test-cred-id',
          user_id: 'test-user',
          business_manager_id: 'test-bm-id',
          business_account_id: 'test-ba-id',
          phone_number_id: 'test-phone-id',
          meta_access_token: 'test-token',
          created_at: new Date().toISOString(),
        },
        loading: 'succeeded',
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <WhatsAppConnectDialog onConnected={() => {}}>
          <button>Open WhatsApp Dialog</button>
        </WhatsAppConnectDialog>
      </Provider>
    );

    fireEvent.click(screen.getByText('Open WhatsApp Dialog'));
    
    // Wait for the connected status to appear
    await waitFor(() => {
      expect(screen.getByText('Account Connected')).toBeInTheDocument();
    });
  });
});