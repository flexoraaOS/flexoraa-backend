import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../src/lib/features/authSlice';
import ProfilePage from '../src/app/dashboard/profile/page';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock Supabase client to prevent actual API calls
jest.mock('../src/lib/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                plan_name: 'Pro Plan',
                status: 'active',
                current_period_start: '2024-01-01T00:00:00Z',
                current_period_end: '2024-12-31T23:59:59Z'
              },
              error: null
            })),
          })),
        })),
        order: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        single: jest.fn(() => Promise.resolve({
          data: {
            agent_name: 'Test Agent',
            agent_persona: 'Professional'
          },
          error: null
        })),
      })),
    })),
  },
}));

// Mock the components used in the profile page
jest.mock('../src/components/dashboard/CompanyDetailsForm', () => ({
  CompanyDetailsForm: () => <div data-testid="company-details-form">Company Details Form</div>,
}));

jest.mock('../src/components/dashboard/BuyCreditDialogue', () => ({
  BuyCreditsDialog: ({ children }: { children: React.ReactNode }) => <div data-testid="buy-credits-dialog">{children}</div>,
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: initialState,
  });
};

describe('Profile Page', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore({
      auth: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: 'https://example.com/avatar.jpg',
            has_leados_access: true,
            has_agentos_access: true,
            leados_limit: 2000,
            agentos_limit: 5000,
          },
          created_at: '2024-01-01T00:00:00Z',
        },
        isAdmin: false,
        isManager: false,
        loading: 'succeeded',
        error: null,
      },
    });
  });

  test('renders profile page with user information', async () => {
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );

    // Check if main heading is rendered
    expect(screen.getByText('My Profile')).toBeInTheDocument();

    // Check if user name is displayed
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Check if email is displayed
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    // Check if role is displayed
    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  test('renders edit profile button', async () => {
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );

    // Check if edit profile button is present
    const editButton = screen.getByText('Edit Profile');
    expect(editButton).toBeInTheDocument();
  });

  test('opens edit profile modal when edit button is clicked', async () => {
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Check if modal opens
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    // Check if form fields are present
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
  });

  test('renders usage quotas section', async () => {
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Usage Quotas')).toBeInTheDocument();
    });

    // Check if usage information is displayed
    expect(screen.getByText('LeadOS Verifications')).toBeInTheDocument();
    expect(screen.getByText('AgentOS Conversations')).toBeInTheDocument();
  });

  test('renders AI persona section', async () => {
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );

    // Check if AI persona section is rendered
    expect(screen.getByText('AI Persona')).toBeInTheDocument();

    // Wait for data to load and check persona details
    await waitFor(() => {
      expect(screen.getByText('Agent Name')).toBeInTheDocument();
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });
  });

  test('renders billing section', async () => {
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );

    // Check if billing section is rendered
    expect(screen.getByText('Billing & Payments')).toBeInTheDocument();

    // Wait for subscription data
    await waitFor(() => {
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    });
  });

  test('renders help and support section', async () => {
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );

    // Check if help section is rendered
    expect(screen.getByText('Help & Support')).toBeInTheDocument();

    // Check if help links are present
    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByText('Community Forum')).toBeInTheDocument();
  });

  test('renders company details form', async () => {
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );

    // Check if company details form is rendered
    await waitFor(() => {
      expect(screen.getByTestId('company-details-form')).toBeInTheDocument();
    });
  });
});
