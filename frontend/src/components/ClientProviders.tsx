'use client';

import { store } from '@/lib/store';
import { Provider } from 'react-redux';

import { useEffect } from 'react';
import { createClient } from '@/lib/api/supabase-client';
import { getUser } from '@/lib/features/authSlice';
import { ThemeProvider } from './ThemeProvider';

function SupabaseListener() {
  const dispatch = store.dispatch;

  useEffect(() => {
    const supabase = createClient();

    dispatch(getUser());

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        dispatch(getUser());
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}


export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SupabaseListener />
          {children}
        </ThemeProvider>
    </Provider>
  );
}
