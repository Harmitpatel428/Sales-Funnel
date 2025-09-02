'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLeads } from '../context/LeadContext';
import { useRouter } from 'next/navigation';

export default function DueTodayPage() {
  const router = useRouter();
  const { leads } = useLeads();
  const [activeTab, setActiveTab] = useState<'today' | 'overdue'>('today');

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
      if (lead.isDone || !lead.followUpDate) return false;
      
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
      if (lead.isDone || !lead.followUpDate) return false;
      
      const followUpDate = parseFollowUpDate(lead.followUpDate);
      if (!followUpDate) return false;
      
      followUpDate.setHours(0, 0, 0, 0);
      return followUpDate < today;
    });
  }, [leads]);

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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Due Today</h2>
              {todayLeads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No leads with follow-ups due today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayLeads.map((lead) => (
                    <div key={lead.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{lead.clientName}</h3>
                          <p className="text-sm text-gray-600">{lead.company}</p>
                          <p className="text-sm text-gray-500">
                            {lead.mobileNumbers && lead.mobileNumbers.length > 0 
                              ? lead.mobileNumbers.find(m => m.isMain)?.number || lead.mobileNumbers[0]?.number || 'N/A'
                              : lead.mobileNumber || 'N/A'
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            Follow-up: {(() => {
                              const date = parseFollowUpDate(lead.followUpDate);
                              return date ? date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : lead.followUpDate;
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'Contacted' ? 'bg-purple-100 text-purple-800' :
                            lead.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            lead.status === 'Follow-up' ? 'bg-orange-100 text-orange-800' :
                            lead.status === 'Closed - Won' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {lead.status}
                          </span>
                          <button
                            onClick={() => {
                              localStorage.setItem('editingLead', JSON.stringify(lead));
                              router.push(`/add-lead?mode=edit&id=${lead.id}`);
                            }}
                            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                          >
                            Update Status
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'overdue' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Overdue Follow-ups</h2>
              {overdueLeads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No overdue follow-ups</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {overdueLeads.map((lead) => (
                    <div key={lead.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{lead.clientName}</h3>
                          <p className="text-sm text-gray-600">{lead.company}</p>
                          <p className="text-sm text-gray-500">
                            {lead.mobileNumbers && lead.mobileNumbers.length > 0 
                              ? lead.mobileNumbers.find(m => m.isMain)?.number || lead.mobileNumbers[0]?.number || 'N/A'
                              : lead.mobileNumber || 'N/A'
                            }
                          </p>
                          <p className="text-sm text-red-600 font-medium">
                            Overdue since: {(() => {
                              const date = parseFollowUpDate(lead.followUpDate);
                              return date ? date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : lead.followUpDate;
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'Contacted' ? 'bg-purple-100 text-purple-800' :
                            lead.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            lead.status === 'Follow-up' ? 'bg-orange-100 text-orange-800' :
                            lead.status === 'Closed - Won' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {lead.status}
                          </span>
                          <button
                            onClick={() => {
                              localStorage.setItem('editingLead', JSON.stringify(lead));
                              router.push(`/add-lead?mode=edit&id=${lead.id}`);
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            Update Status
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
