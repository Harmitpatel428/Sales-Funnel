'use client';

import { useState, useMemo } from 'react';
import { useLeads, Lead } from '../context/LeadContext';
import { useRouter } from 'next/navigation';

export default function AllLeadsPage() {
  const router = useRouter();
  const { leads } = useLeads();
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filter leads based on status and search term
  const allLeads = useMemo(() => {
    let filtered = leads; // Show all leads regardless of status
    
    if (searchTerm) {
      filtered = filtered.filter(lead => {
        const searchLower = searchTerm.toLowerCase();
        
        // Check if it's a phone number search (only digits)
        if (/^\d+$/.test(searchTerm)) {
          const allMobileNumbers = [
            lead.mobileNumber,
            ...(lead.mobileNumbers || []).map(m => m.number)
          ];
          
          for (const mobileNumber of allMobileNumbers) {
            if (mobileNumber) {
              const phoneDigits = mobileNumber.replace(/[^0-9]/g, '');
              if (phoneDigits.includes(searchTerm)) {
                return true;
              }
            }
          }
        }
        
        // Regular text search
        const allMobileNumbers = [
          lead.mobileNumber,
          ...(lead.mobileNumbers || []).map(m => m.number)
        ].filter(Boolean);
        
        const allMobileNames = (lead.mobileNumbers || []).map(m => m.name).filter(Boolean);
        
        const searchableFields = [
          lead.clientName,
          lead.company,
          ...allMobileNumbers,
          ...allMobileNames,
          lead.consumerNumber,
          lead.kva,
          lead.companyLocation,
          lead.notes,
          lead.finalConclusion,
          lead.status
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        return searchableFields.some(field => field?.includes(searchLower));
      });
    }
    
    return filtered;
  }, [leads, searchTerm]);

  const activeLeads = useMemo(() => {
    let filtered = leads.filter(lead => !lead.isDone); // Show only non-completed leads
    
    if (searchTerm) {
      filtered = filtered.filter(lead => {
        const searchLower = searchTerm.toLowerCase();
        
        // Check if it's a phone number search (only digits)
        if (/^\d+$/.test(searchTerm)) {
          const allMobileNumbers = [
            lead.mobileNumber,
            ...(lead.mobileNumbers || []).map(m => m.number)
          ];
          
          for (const mobileNumber of allMobileNumbers) {
            if (mobileNumber) {
              const phoneDigits = mobileNumber.replace(/[^0-9]/g, '');
              if (phoneDigits.includes(searchTerm)) {
                return true;
              }
            }
          }
        }
        
        // Regular text search
        const allMobileNumbers = [
          lead.mobileNumber,
          ...(lead.mobileNumbers || []).map(m => m.number)
        ].filter(Boolean);
        
        const allMobileNames = (lead.mobileNumbers || []).map(m => m.name).filter(Boolean);
        
        const searchableFields = [
          lead.clientName,
          lead.company,
          ...allMobileNumbers,
          ...allMobileNames,
          lead.consumerNumber,
          lead.kva,
          lead.companyLocation,
          lead.notes,
          lead.finalConclusion,
          lead.status
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        return searchableFields.some(field => field?.includes(searchLower));
      });
    }
    
    return filtered;
  }, [leads, searchTerm]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-White-800">All Leads</h1>
          <p className="text-gray-600 mt-2">View and manage all leads in your system</p>
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
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Total Leads</h3>
              <p className="text-3xl font-bold text-blue-600">{allLeads.length}</p>
              <p className="text-sm text-gray-500 mt-1">All leads ever added to the system</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Active Leads</h3>
              <p className="text-3xl font-bold text-green-600">{activeLeads.length}</p>
              <p className="text-sm text-gray-500 mt-1">Leads that are not completed</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-lg shadow-md mb-6 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Leads
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, company, phone, consumer number, status..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-6 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Leads ({allLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'active'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Leads ({activeLeads.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'all' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">All Leads</h2>
              {allLeads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No leads found in the system</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allLeads.map((lead) => (
                    <div key={lead.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{lead.clientName}</h3>
                          <p className="text-sm font-medium text-gray-600">{lead.company}</p>
                          <p className="text-sm font-medium text-gray-500">
                            {lead.mobileNumbers && lead.mobileNumbers.length > 0 
                              ? lead.mobileNumbers.find(m => m.isMain)?.number || lead.mobileNumbers[0]?.number || 'N/A'
                              : lead.mobileNumber || 'N/A'
                            }
                          </p>
                          <p className="text-sm font-medium text-gray-500">
                            Consumer Number: {lead.consumerNumber || 'N/A'}
                          </p>
                          {lead.followUpDate && (
                            <p className="text-sm font-medium text-gray-500">
                              Follow-up: {(() => {
                                // Convert yyyy-mm-dd to dd-mm-yyyy
                                const dateParts = lead.followUpDate.split('-');
                                if (dateParts.length === 3) {
                                  return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                                }
                                return lead.followUpDate;
                              })()}
                            </p>
                          )}
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
                          {lead.isDone && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Completed
                            </span>
                          )}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(lead)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Quick View
                            </button>
                            <button
                              onClick={() => {
                                localStorage.setItem('editingLead', JSON.stringify(lead));
                                router.push(`/add-lead?mode=edit&id=${lead.id}`);
                              }}
                              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Leads</h2>
              {activeLeads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No active leads found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeLeads.map((lead) => (
                    <div key={lead.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{lead.clientName}</h3>
                          <p className="text-sm font-medium text-gray-600">{lead.company}</p>
                          <p className="text-sm font-medium text-gray-500">
                            {lead.mobileNumbers && lead.mobileNumbers.length > 0 
                              ? lead.mobileNumbers.find(m => m.isMain)?.number || lead.mobileNumbers[0]?.number || 'N/A'
                              : lead.mobileNumber || 'N/A'
                            }
                          </p>
                          <p className="text-sm font-medium text-gray-500">
                            Consumer Number: {lead.consumerNumber || 'N/A'}
                          </p>
                          {lead.followUpDate && (
                            <p className="text-sm font-medium text-gray-500">
                              Follow-up: {(() => {
                                // Convert yyyy-mm-dd to dd-mm-yyyy
                                const dateParts = lead.followUpDate.split('-');
                                if (dateParts.length === 3) {
                                  return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                                }
                                return lead.followUpDate;
                              })()}
                            </p>
                          )}
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(lead)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Quick View
                            </button>
                            <button
                              onClick={() => {
                                localStorage.setItem('editingLead', JSON.stringify(lead));
                                router.push(`/add-lead?mode=edit&id=${lead.id}`);
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                            >
                              Update Status
                            </button>
                          </div>
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
                      selectedLead.status === 'Contacted' ? 'bg-purple-100 text-purple-800' :
                      selectedLead.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      selectedLead.status === 'Follow-up' ? 'bg-orange-100 text-orange-800' :
                      selectedLead.status === 'Closed - Won' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedLead.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit Type</label>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.unitType}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Completion</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedLead.isDone ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedLead.isDone ? 'Completed' : 'Active'}
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
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
Phone: ${selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
  ? selectedLead.mobileNumbers.find(m => m.isMain)?.number || selectedLead.mobileNumbers[0]?.number || 'N/A'
  : selectedLead.mobileNumber || 'N/A'}
Status: ${selectedLead.status}
Unit Type: ${selectedLead.unitType}
Connection Date: ${selectedLead.connectionDate}
Follow-up Date: ${selectedLead.followUpDate || 'N/A'}
Last Activity: ${selectedLead.lastActivityDate}
${selectedLead.companyLocation ? `Location: ${selectedLead.companyLocation}` : ''}
${selectedLead.notes ? `Notes: ${selectedLead.notes}` : ''}
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
                  <button
                    onClick={() => {
                      // Store the lead data in localStorage for the edit form
                      localStorage.setItem('editingLead', JSON.stringify(selectedLead));
                      closeModal();
                      router.push(`/add-lead?mode=edit&id=${selectedLead.id}`);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Edit Lead
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
