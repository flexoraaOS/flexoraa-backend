import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  assignLeadToCampaign,
  scheduleFollowUp,
  setCurrentLead,
} from '@/lib/features/leadsSlice';
import { Lead } from '@/lib/types/leadTypes';

/**
 * Custom hook for interacting with the leads slice of the Redux store.
 * Provides state selectors and memoized dispatch functions.
 */
export const useLeads = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors to get data from the store
  const leads = useSelector((state: RootState) => state.leads.list);
  const currentLead = useSelector((state: RootState) => state.leads.current);
  const loading = useSelector((state: RootState) => state.leads.loading);
  const error = useSelector((state: RootState) => state.leads.error);

  // Memoized handler functions to dispatch actions
  const handleFetchLeads = useCallback((campaignId?: string | null) => {
    dispatch(fetchLeads({ campaignId }));
  }, [dispatch]);

  const handleCreateLead = useCallback((leadData: Partial<Lead>) => {
    return dispatch(createLead(leadData));
  }, [dispatch]);

  const handleUpdateLead = useCallback((id: string, changes: Partial<Lead>) => {
    return dispatch(updateLead({ id, changes }));
  }, [dispatch]);

  const handleDeleteLead = useCallback((id: string) => {
    return dispatch(deleteLead(id));
  }, [dispatch]);
  
  const handleAssignLeadToCampaign = useCallback((leadId: string, campaignId: string) => {
    return dispatch(assignLeadToCampaign({ leadId, campaignId }));
  }, [dispatch]);

  const handleScheduleFollowUp = useCallback((id: string, followupDate: string, followupTime: string) => {
    return dispatch(scheduleFollowUp({ id, followupDate, followupTime }));
  }, [dispatch]);

  const handleSetCurrentLead = useCallback((lead: Lead | null) => {
    dispatch(setCurrentLead(lead));
  }, [dispatch]);

  return {
    // State
    leads,
    currentLead,
    loading,
    error,
    // Handlers
    fetchLeads: handleFetchLeads,
    createLead: handleCreateLead,
    updateLead: handleUpdateLead,
    deleteLead: handleDeleteLead,
    assignLeadToCampaign: handleAssignLeadToCampaign,
    scheduleFollowUp: handleScheduleFollowUp,
    setCurrentLead: handleSetCurrentLead,
  };
};