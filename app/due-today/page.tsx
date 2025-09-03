'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLeads } from '../context/LeadContext';
import { useRouter } from 'next/navigation';
import LeadTable from '../components/LeadTable';

export default function DueTodayPage() {
  const router = useRouter();
  const { leads, deleteLead, setLeads } = useLeads();
  const [activeTab, setActiveTab] = useState<'today' | 'overdue'>('today');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Handle URL parameters for tab selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab === 'overdue') {
      setActiveTab('overdue');
    }
  }, []);

  // Helper function to parse DD-MM-YYYY format dates
  const parseFollowUpDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    try {
      // Handle DD-MM-YYYY format
      const dateParts = dateString.split('-');
      if (dateString.includes('-') && dateParts[0] && dateParts[0].length <= 2) {
        const [day, month, year] = dateString.split('-');
        if (day && month && year) {
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      // Handle other date formats
      return new Date(dateString);
    } catch {
      return null;
    }
  };

  // Filter leads based on follow-up dates
  const todayLeads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leads.filter(lead => {
      if (lead.isDeleted || lead.isDone || !lead.followUpDate) return false;
      
      const followUpDate = parseFollowUpDate(lead.followUpDate);
      if (!followUpDate) return false;
      
      followUpDate.setHours(0, 0, 0, 0);
      return followUpDate.getTime() === today.getTime();
    });
  }, [leads]);

  const overdueLeads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leads.filter(lead => {
      if (lead.isDeleted || lead.isDone || !lead.followUpDate) return false;
      
      const followUpDate = parseFollowUpDate(lead.followUpDate);
      if (!followUpDate) return false;
      
      followUpDate.setHours(0, 0, 0, 0);
      return followUpDate < today;
    });
  }, [leads]);

  // Handle lead click
  const handleLeadClick = (lead: any) => {
    localStorage.setItem('editingLead', JSON.stringify(lead));
    router.push(`/add-lead?mode=edit&id=${lead.id}`);
  };

  // Handle lead selection
  const handleLeadSelection = (leadId: string, checked: boolean) => {
    const newSelected = new Set(selectedLeads);
    if (checked) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeads(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    const currentLeads = activeTab === 'today' ? todayLeads : overdueLeads;
    if (checked) {
      setSelectedLeads(new Set(currentLeads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  // Handle bulk delete - no password protection
  const handleBulkDeleteClick = () => {
    if (selectedLeads.size === 0) return;
    
    // Direct deletion without password protection
    selectedLeads.forEach(leadId => {
      deleteLead(leadId);
    });
    
    setSelectedLeads(new Set());
  };

  // Action buttons for the table
  const renderActionButtons = (lead: any) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        localStorage.setItem('editingLead', JSON.stringify(lead));
        router.push(`/add-lead?mode=edit&id=${lead.id}`);
      }}
      className={`px-3 py-1 text-sm rounded-md transition-colors ${
        activeTab === 'today' 
          ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
          : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      Update Status
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-White-800">Due Today & Overdue Follow-ups</h1>
          <p className="text-gray-600 mt-2">Manage leads with follow-ups due today or overdue</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Due Today</h3>
              <p className="text-3xl font-bold text-yellow-600">{todayLeads.length}</p>
              <p className="text-sm text-gray-500 mt-1">Leads with follow-ups scheduled for today</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Overdue</h3>
              <p className="text-3xl font-bold text-red-600">{overdueLeads.length}</p>
              <p className="text-sm text-gray-500 mt-1">Leads with overdue follow-ups</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('today')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'today'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Due Today ({todayLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overdue'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overdue ({overdueLeads.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'today' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Due Today</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSelectAll(selectedLeads.size === todayLeads.length ? false : true)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    {selectedLeads.size === todayLeads.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedLeads.size > 0 && (
                    <button
                      onClick={handleBulkDeleteClick}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete Selected ({selectedLeads.size})
                    </button>
                  )}
                </div>
              </div>
              <LeadTable
                leads={todayLeads}
                onLeadClick={handleLeadClick}
                selectedLeads={selectedLeads}
                onLeadSelection={handleLeadSelection}
                showActions={true}
                actionButtons={renderActionButtons}
                emptyMessage="No leads with follow-ups due today"
              />
            </div>
          )}

          {activeTab === 'overdue' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Overdue Follow-ups</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSelectAll(selectedLeads.size === overdueLeads.length ? false : true)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    {selectedLeads.size === overdueLeads.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedLeads.size > 0 && (
                    <button
                      onClick={handleBulkDeleteClick}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete Selected ({selectedLeads.size})
                    </button>
                  )}
                </div>
              </div>
              <LeadTable
                leads={overdueLeads}
                onLeadClick={handleLeadClick}
                selectedLeads={selectedLeads}
                onLeadSelection={handleLeadSelection}
                showActions={true}
                actionButtons={renderActionButtons}
                emptyMessage="No overdue follow-ups"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
