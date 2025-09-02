'use client';

import { useState, useMemo } from 'react';
import { useLeads } from '../context/LeadContext';
import { useRouter } from 'next/navigation';

export default function UpcomingPage() {
  const router = useRouter();
  const { leads } = useLeads();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'thisWeek'>('upcoming');

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
      if (lead.isDone || !lead.followUpDate) return false;
      
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
      if (lead.isDone || !lead.followUpDate) return false;
      
      const followUpDate = parseFollowUpDate(lead.followUpDate);
      if (!followUpDate) return false;
      
      followUpDate.setHours(0, 0, 0, 0);
      return followUpDate > today && followUpDate <= endOfWeek;
    });
  }, [leads]);

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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Next 7 Days</h2>
              {upcomingLeads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No leads with follow-ups in the next 7 days</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingLeads.map((lead) => (
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
                                                     <p className="text-sm text-green-600 font-medium">
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
                            onClick={() => router.push(`/add-lead?mode=edit&id=${lead.id}`)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
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

          {activeTab === 'thisWeek' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">This Week</h2>
              {thisWeekLeads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No leads with follow-ups this week</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {thisWeekLeads.map((lead) => (
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
                                                     <p className="text-sm text-blue-600 font-medium">
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
                            onClick={() => router.push(`/add-lead?mode=edit&id=${lead.id}`)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
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
