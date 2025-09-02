'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface MobileNumber {
  id: string;
  number: string;
  isMain: boolean;
}

export interface Lead {
  id: string;
  kva: string;
  connectionDate: string;
  consumerNumber: string;
  company: string;
  clientName: string;
  mobileNumbers: MobileNumber[]; // Updated to support multiple mobile numbers
  mobileNumber: string; // Keep for backward compatibility
  companyLocation?: string; // New field for company location
  unitType: 'New' | 'Existing' | 'Other'; // Renamed from status for unit type
  marketingObjective?: string;
  budget?: string;
  timeline?: string;
  status: 'New' | 'Contacted' | 'In Progress' | 'Follow-up' | 'Closed - Won' | 'Closed - Lost';
  contactOwner?: string;
  lastActivityDate: string;
  followUpDate: string;
  finalConclusion?: string;
  notes?: string;
  isDone: boolean;
  activities?: Activity[];
  mandateStatus?: 'Pending' | 'In Progress' | 'Completed';
  documentStatus?: 'Pending Documents' | 'Documents Submitted' | 'Documents Reviewed' | 'Signed Mandate';
}

export interface Activity {
  id: string;
  leadId: string;
  description: string;
  timestamp: string;
}

interface LeadContextType {
  leads: Lead[];
  addLead: (lead: Lead) => void;
  updateLead: (updatedLead: Lead) => void;
  deleteLead: (id: string) => void;
  markAsDone: (id: string) => void;
  addActivity: (leadId: string, description: string) => void;
  getFilteredLeads: (filters: LeadFilters) => Lead[];
  savedViews: SavedView[];
  addSavedView: (view: SavedView) => void;
  deleteSavedView: (id: string) => void;
}

export interface LeadFilters {
  status?: Lead['status'][];
  followUpDateStart?: string;
  followUpDateEnd?: string;
  searchTerm?: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: LeadFilters;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export function LeadProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  // Load leads from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('leads');
      if (stored) {
        setLeads(JSON.parse(stored));
      }
      
      const storedViews = localStorage.getItem('savedViews');
      if (storedViews) {
        setSavedViews(JSON.parse(storedViews));
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, []);

  // Save leads to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('leads', JSON.stringify(leads));
  }, [leads]);
  
  // Save views to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedViews', JSON.stringify(savedViews));
  }, [savedViews]);

  const addLead = (lead: Lead) => {
    console.log('Adding lead:', lead);
    setLeads(prev => {
      const newLeads = [...prev, lead];
      console.log('Updated leads:', newLeads);
      return newLeads;
    });
  };
  
  const updateLead = (updatedLead: Lead) => {
    setLeads(prev => 
      prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead)
    );
  };
  
  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  const markAsDone = (id: string) => {
    setLeads(prev =>
      prev.map(l => (l.id === id ? { ...l, isDone: true } : l))
    );
  };
  
  const addActivity = (leadId: string, description: string) => {
    const newActivity = {
      id: crypto.randomUUID(),
      leadId,
      description,
      timestamp: new Date().toISOString()
    };
    
    setLeads(prev => 
      prev.map(lead => {
        if (lead.id === leadId) {
          const activities = lead.activities || [];
          return {
            ...lead,
            activities: [...activities, newActivity],
            lastActivityDate: new Date().toISOString()
          };
        }
        return lead;
      })
    );
  };
  
  const getFilteredLeads = (filters: LeadFilters): Lead[] => {
    return leads.filter(lead => {
      // Filter by status
      if (filters.status && filters.status.length > 0 && !filters.status.includes(lead.status)) {
        return false;
      }
      
      // Filter by follow-up date range
      if (filters.followUpDateStart && lead.followUpDate < filters.followUpDateStart) {
        return false;
      }
      if (filters.followUpDateEnd && lead.followUpDate > filters.followUpDateEnd) {
        return false;
      }
      
      // Search term (search in name, company, email, notes, etc.)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        
        // Check if it's a phone number search (only digits)
        if (/^\d+$/.test(filters.searchTerm)) {
          // Search in all mobile numbers
          const allMobileNumbers = [
            lead.mobileNumber, // backward compatibility
            ...(lead.mobileNumbers || []).map(m => m.number)
          ];
          
          for (const mobileNumber of allMobileNumbers) {
            if (mobileNumber) {
              const phoneDigits = mobileNumber.replace(/[^0-9]/g, '');
              if (phoneDigits.includes(filters.searchTerm)) {
                return true;
              }
            }
          }
        }
        
        // Regular text search
        const allMobileNumbers = [
          lead.mobileNumber, // backward compatibility
          ...(lead.mobileNumbers || []).map(m => m.number)
        ].filter(Boolean);
        
        const searchableFields = [
          lead.clientName,
          lead.company,
          ...allMobileNumbers,
          lead.consumerNumber,
          lead.kva,
          lead.companyLocation,
          lead.notes,
          lead.finalConclusion
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        return searchableFields.some(field => field?.includes(searchTerm));
      }
      
      return true;
    });
  };
  
  const addSavedView = (view: SavedView) => {
    setSavedViews(prev => [...prev, view]);
  };
  
  const deleteSavedView = (id: string) => {
    setSavedViews(prev => prev.filter(view => view.id !== id));
  };

  return (
    <LeadContext.Provider value={{
      leads,
      addLead,
      updateLead,
      deleteLead,
      markAsDone,
      addActivity,
      getFilteredLeads,
      savedViews,
      addSavedView,
      deleteSavedView
    }}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error('useLeads must be used inside LeadProvider');
  return ctx;
}
