'use client';

import { useState, useMemo } from 'react';
import { useLeads } from '../context/LeadContext';
import { useRouter } from 'next/navigation';
import LeadTable from '../components/LeadTable';

export default function UpcomingPage() {
  const router = useRouter();
  const { leads, deleteLead } = useLeads();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'thisWeek'>('upcoming');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

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
  const upcomingLeads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    return leads.filter(lead => {
      if (lead.isDeleted || lead.isDone || !lead.followUpDate) return false;
      
      const followUpDate = parseFollowUpDate(lead.followUpDate);
      if (!followUpDate) return false;
      
      followUpDate.setHours(0, 0, 0, 0);
      return followUpDate > today && followUpDate <= sevenDaysLater;
    });
  }, [leads]);

  const thisWeekLeads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay())); // End of current week

    return leads.filter(lead => {
      if (lead.isDeleted || lead.isDone || !lead.followUpDate) return false;
      
      const followUpDate = parseFollowUpDate(lead.followUpDate);
      if (!followUpDate) return false;
      
      followUpDate.setHours(0, 0, 0, 0);
      return followUpDate > today && followUpDate <= endOfWeek;
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
    const currentLeads = activeTab === 'upcoming' ? upcomingLeads : thisWeekLeads;
    if (checked) {
      setSelectedLeads(new Set(currentLeads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDeleteClick = () => {
    if (selectedLeads.size === 0) return;
    // Removed password protection
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
        activeTab === 'upcoming' 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'
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
          <h1 className="text-3xl font-bold text-White-800">Upcoming Follow-ups</h1>
          <p className="text-gray-600 mt-2">Manage leads with upcoming follow-ups in the next 7 days</p>
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
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Next 7 Days</h3>
              <p className="text-3xl font-bold text-green-600">{upcomingLeads.length}</p>
              <p className="text-sm text-gray-500 mt-1">Leads with follow-ups in the next 7 days</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">This Week</h3>
              <p className="text-3xl font-bold text-blue-600">{thisWeekLeads.length}</p>
              <p className="text-sm text-gray-500 mt-1">Leads with follow-ups this week</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Next 7 Days ({upcomingLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('thisWeek')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'thisWeek'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              This Week ({thisWeekLeads.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'upcoming' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Next 7 Days</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSelectAll(selectedLeads.size === upcomingLeads.length ? false : true)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    {selectedLeads.size === upcomingLeads.length ? 'Deselect All' : 'Select All'}
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
                leads={upcomingLeads}
                onLeadClick={handleLeadClick}
                selectedLeads={selectedLeads}
                onLeadSelection={handleLeadSelection}
                showActions={true}
                actionButtons={renderActionButtons}
                emptyMessage="No leads with follow-ups in the next 7 days"
              />
            </div>
          )}

          {activeTab === 'thisWeek' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">This Week</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSelectAll(selectedLeads.size === thisWeekLeads.length ? false : true)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    {selectedLeads.size === thisWeekLeads.length ? 'Deselect All' : 'Select All'}
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
                leads={thisWeekLeads}
                onLeadClick={handleLeadClick}
                selectedLeads={selectedLeads}
                onLeadSelection={handleLeadSelection}
                showActions={true}
                actionButtons={renderActionButtons}
                emptyMessage="No leads with follow-ups this week"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
