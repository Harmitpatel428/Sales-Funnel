'use client';

import { useState } from 'react';
import { useLeads } from '../context/LeadContext';
import { useRouter } from 'next/navigation';
import LeadTable from '../components/LeadTable';

export default function FollowUpMandatePage() {
  const router = useRouter();
  const { leads, deleteLead } = useLeads();
  const [activeTab, setActiveTab] = useState<'pending' | 'signed'>('pending');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Filter leads based on status
  const documentation = leads.filter(lead => 
    !lead.isDeleted && lead.status === 'Documentation' && !lead.isDone
  );

  const mandateSent = leads.filter(lead => 
    !lead.isDeleted && lead.status === 'Mandate Sent' && !lead.isDone
  );

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
    const currentLeads = activeTab === 'pending' ? documentation : mandateSent;
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
        activeTab === 'pending' 
          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
          : 'bg-green-600 hover:bg-green-700 text-white'
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
          <h1 className="text-3xl font-bold text-White-800">Follow-up Mandate & Documentation</h1>
          <p className="text-gray-600 mt-2">Manage mandate status and document tracking</p>
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
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Documentation</h3>
              <p className="text-3xl font-bold text-orange-600">{documentation.length}</p>
              <p className="text-sm text-gray-500 mt-1">Leads waiting for document submission</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Mandate Sent</h3>
              <p className="text-3xl font-bold text-green-600">{mandateSent.length}</p>
              <p className="text-sm text-gray-500 mt-1">Leads with completed mandate signing</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pending'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documentation ({documentation.length})
            </button>
            <button
              onClick={() => setActiveTab('signed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'signed'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mandate Sent ({mandateSent.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'pending' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Documentation</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSelectAll(selectedLeads.size === documentation.length ? false : true)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    {selectedLeads.size === documentation.length ? 'Deselect All' : 'Select All'}
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
                leads={documentation}
                onLeadClick={handleLeadClick}
                selectedLeads={selectedLeads}
                onLeadSelection={handleLeadSelection}
                showActions={true}
                actionButtons={renderActionButtons}
                emptyMessage="No leads waiting for documents"
              />
            </div>
          )}

          {activeTab === 'signed' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Mandate Sent</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSelectAll(selectedLeads.size === mandateSent.length ? false : true)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    {selectedLeads.size === mandateSent.length ? 'Deselect All' : 'Select All'}
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
                leads={mandateSent}
                onLeadClick={handleLeadClick}
                selectedLeads={selectedLeads}
                onLeadSelection={handleLeadSelection}
                showActions={true}
                actionButtons={renderActionButtons}
                emptyMessage="No leads with mandate sent"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
