'use client';

import { useState, useEffect } from 'react';
import { useLeads, Lead } from '../context/LeadContext';
import { useRouter, useSearchParams } from 'next/navigation';
import LeadTable from '../components/LeadTable';

export default function FollowUpMandatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { leads, deleteLead } = useLeads();
  const [activeTab, setActiveTab] = useState<'pending' | 'signed'>('pending');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Handle URL parameters to set the correct tab when returning from add-lead form
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signed' || tab === 'mandate-sent') {
      setActiveTab('signed');
    } else if (tab === 'pending' || tab === 'documentation') {
      setActiveTab('pending');
    }
  }, [searchParams]);

  // Filter leads based on status
  const documentation = leads.filter(lead => 
    !lead.isDeleted && lead.status === 'Documentation' && !lead.isDone
  );

  const mandateSent = leads.filter(lead => 
    !lead.isDeleted && lead.status === 'Mandate Sent' && !lead.isDone
  );

  // Modal functions
  const openModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLead(null);
    setIsModalOpen(false);
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handle lead click
  const handleLeadClick = (lead: any) => {
    openModal(lead);
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
        // Include source page information for proper navigation back
        const sourcePage = activeTab === 'pending' ? 'documentation' : 'mandate-sent';
        router.push(`/add-lead?mode=edit&id=${lead.id}&from=${sourcePage}`);
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

      {/* Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Lead Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-3">
                {/* Main Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Basic Info */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">Client Name</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.clientName, 'clientName')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy client name"
                      >
                        {copiedField === 'clientName' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.clientName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">Company</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.company, 'company')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy company name"
                      >
                        {copiedField === 'company' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.company}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">Consumer Number</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.consumerNumber || 'N/A', 'consumerNumber')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy consumer number"
                      >
                        {copiedField === 'consumerNumber' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.consumerNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">KVA</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.kva, 'kva')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy KVA"
                      >
                        {copiedField === 'kva' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.kva}</p>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">Main Phone</label>
                      <button
                        onClick={() => {
                          const phoneNumber = selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
                            ? selectedLead.mobileNumbers.find(m => m.isMain)?.number || selectedLead.mobileNumbers[0]?.number || 'N/A'
                            : selectedLead.mobileNumber || 'N/A';
                          copyToClipboard(phoneNumber, 'mainPhone');
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy main phone number"
                      >
                        {copiedField === 'mainPhone' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
                        ? selectedLead.mobileNumbers.find(m => m.isMain)?.number || selectedLead.mobileNumbers[0]?.number || 'N/A'
                        : selectedLead.mobileNumber || 'N/A'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedLead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      selectedLead.status === 'CNR' ? 'bg-purple-100 text-purple-800' :
                      selectedLead.status === 'Busy' ? 'bg-yellow-100 text-yellow-800' :
                      selectedLead.status === 'Follow-up' ? 'bg-orange-100 text-orange-800' :
                      selectedLead.status === 'Deal Close' ? 'bg-green-100 text-green-800' :
                      selectedLead.status === 'Work Alloted' ? 'bg-indigo-100 text-indigo-800' :
                      selectedLead.status === 'Hotlead' ? 'bg-red-100 text-red-800' :
                      selectedLead.status === 'Mandate Sent' ? 'bg-emerald-100 text-emerald-800' :
                      selectedLead.status === 'Documentation' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedLead.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit Type</label>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.unitType}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">Discom</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.discom || 'N/A', 'discom')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy discom"
                      >
                        {copiedField === 'discom' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.discom || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedLead.isDeleted ? 'bg-red-100 text-red-800' :
                      selectedLead.isDone ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedLead.isDeleted ? 'Deleted' : selectedLead.isDone ? 'Completed' : 'Active'}
                    </span>
                  </div>
                  
                  {/* Dates */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Connection Date</label>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.connectionDate}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedLead.followUpDate ? (() => {
                        // Convert yyyy-mm-dd to dd-mm-yyyy
                        const dateParts = selectedLead.followUpDate.split('-');
                        if (dateParts.length === 3) {
                          return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                        }
                        return selectedLead.followUpDate;
                      })() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Last Activity</label>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.lastActivityDate}</p>
                  </div>
                  
                  {/* Mandate & Document Status */}
                  {selectedLead.mandateStatus && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Mandate Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedLead.mandateStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedLead.mandateStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedLead.mandateStatus}
                      </span>
                    </div>
                  )}
                  {selectedLead.documentStatus && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Document Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedLead.documentStatus === 'Pending Documents' ? 'bg-red-100 text-red-800' :
                        selectedLead.documentStatus === 'Documents Submitted' ? 'bg-yellow-100 text-yellow-800' :
                        selectedLead.documentStatus === 'Documents Reviewed' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedLead.documentStatus}
                      </span>
                    </div>
                  )}
                </div>

                {/* Additional Numbers */}
                {selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 1 && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Additional Numbers</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.mobileNumbers.filter(m => !m.isMain).map((mobile, index) => (
                        <span key={index} className="text-sm font-medium text-gray-900 bg-white px-2 py-1 rounded border">
                          {mobile.name}: {mobile.number}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes and Additional Info */}
                {(selectedLead.companyLocation || selectedLead.notes || selectedLead.finalConclusion) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLead.companyLocation && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Company Location</label>
                        <p className="text-sm font-medium text-gray-900">{selectedLead.companyLocation}</p>
                      </div>
                    )}
                    {selectedLead.notes && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Last Discussion</label>
                        <p className="text-sm font-medium text-gray-900 line-clamp-3">{selectedLead.notes}</p>
                      </div>
                    )}
                    {selectedLead.finalConclusion && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Final Conclusion</label>
                        <p className="text-sm font-medium text-gray-900 line-clamp-3">{selectedLead.finalConclusion}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Activities - Compact */}
                {selectedLead.activities && selectedLead.activities.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Recent Activities</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedLead.activities.slice(-3).map((activity) => (
                        <div key={activity.id} className="bg-white p-2 rounded text-xs">
                          <p className="text-gray-900 font-medium">{activity.description}</p>
                          <p className="text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    const allInfo = `Client: ${selectedLead.clientName}
Company: ${selectedLead.company}
Consumer Number: ${selectedLead.consumerNumber || 'N/A'}
KVA: ${selectedLead.kva}
Discom: ${selectedLead.discom || 'N/A'}
Phone: ${selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
  ? selectedLead.mobileNumbers.find(m => m.isMain)?.number || selectedLead.mobileNumbers[0]?.number || 'N/A'
  : selectedLead.mobileNumber || 'N/A'}
Status: ${selectedLead.status}
Unit Type: ${selectedLead.unitType}
Connection Date: ${selectedLead.connectionDate}
Follow-up Date: ${selectedLead.followUpDate || 'N/A'}
Last Activity: ${selectedLead.lastActivityDate}
${selectedLead.companyLocation ? `Location: ${selectedLead.companyLocation}` : ''}
${selectedLead.notes ? `Last Discussion: ${selectedLead.notes}` : ''}
${selectedLead.finalConclusion ? `Conclusion: ${selectedLead.finalConclusion}` : ''}`;
                    copyToClipboard(allInfo, 'allInfo');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors flex items-center space-x-2"
                >
                  {copiedField === 'allInfo' ? (
                    <>
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy All Info</span>
                    </>
                  )}
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Close
                  </button>
                  {!selectedLead.isDeleted && (
                    <button
                      onClick={() => {
                        // Store the lead data in localStorage for the edit form
                        localStorage.setItem('editingLead', JSON.stringify(selectedLead));
                        closeModal();
                        const sourcePage = activeTab === 'pending' ? 'documentation' : 'mandate-sent';
                        router.push(`/add-lead?mode=edit&id=${selectedLead.id}&from=${sourcePage}`);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Edit Lead
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
