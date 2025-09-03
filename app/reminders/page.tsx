'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLeads, Lead } from '../context/LeadContext';
import { useRouter } from 'next/navigation';
import LeadTable from '../components/LeadTable';

export default function RemindersPage() {
  const { leads, markAsDone, deleteLead } = useLeads();
  const router = useRouter();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [includeDone, setIncludeDone] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Handle URL parameters for filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    
    if (filter) {
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);
      
      switch (filter) {
        case 'today':
          setStartDate(today.toISOString().split('T')[0]!);
          setEndDate(today.toISOString().split('T')[0]!);
          break;
        case 'upcoming':
          setStartDate(today.toISOString().split('T')[0]!);
          setEndDate(sevenDaysLater.toISOString().split('T')[0]!);
          break;
        case 'overdue':
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          setEndDate(yesterday.toISOString().split('T')[0]!);
          break;
      }
    }
  }, []);

  const filteredAndSorted = useMemo(() => {
    // By mapping to an object with a Date object, we avoid reparsing the date string multiple times.
    let items = leads.map(lead => ({
      ...lead,
      followUpDateObj: new Date(lead.followUpDate),
    }));

    items = items.filter(l => !l.isDeleted && (includeDone || !l.isDone));
    
    if (statusFilter) {
      items = items.filter(l => l.status === statusFilter);
    }

    if (startDate) {
      const start = new Date(startDate);
      items = items.filter(l => l.followUpDateObj >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      // To make the end date inclusive, we check against the start of the next day.
      end.setDate(end.getDate() + 1);
      items = items.filter(l => l.followUpDateObj < end);
    }

    items.sort((a, b) => {
      const da = a.followUpDateObj.getTime();
      const db = b.followUpDateObj.getTime();
      return sortOrder === 'asc' ? da - db : db - da;
    });

    return items;
  }, [leads, startDate, endDate, sortOrder, includeDone, statusFilter]);

  const handleReset = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setSortOrder('asc');
    setIncludeDone(false);
    setStatusFilter('');
  }, []);

  // Handle lead click
  const handleLeadClick = (lead: any) => {
    router.push(`/lead/${lead.id}`);
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
    if (checked) {
      setSelectedLeads(new Set(filteredAndSorted.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDeleteClick = () => {
    if (selectedLeads.size === 0) return;
    setShowBulkDeleteModal(true);
    setBulkDeletePassword('');
    setBulkDeleteError('');
  };

  const handleBulkDeleteSubmit = () => {
    if (bulkDeletePassword !== DELETE_PASSWORD) {
      setBulkDeleteError('Incorrect password. Please try again.');
      return;
    }
    
    selectedLeads.forEach(leadId => {
      deleteLead(leadId);
    });
    
    setShowBulkDeleteModal(false);
    setSelectedLeads(new Set());
    setBulkDeletePassword('');
    setBulkDeleteError('');
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false);
    setBulkDeletePassword('');
    setBulkDeleteError('');
  };

  // Action buttons for the table
  const renderActionButtons = (lead: any) => (
    <div className="flex space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/lead/${lead.id}`);
        }}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
      >
        View Details
      </button>
      {!lead.isDone && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            markAsDone(lead.id);
          }}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
        >
          Mark as Done
        </button>
      )}
    </div>
  );

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white-800">
          Reminders & Follow-ups Filter
        </h1>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm text-gray-600 mb-1">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm text-gray-600 mb-1">
              End date
            </label>
            <input
              id="endDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm text-gray-600 mb-1">
              Sort
            </label>
            <select
              id="sortOrder"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Oldest first</option>
              <option value="desc">Newest first</option>
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm text-gray-600 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="In Progress">In Progress</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Closed - Won">Closed - Won</option>
              <option value="Closed - Lost">Closed - Lost</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeDone}
                onChange={e => setIncludeDone(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-green-700">Show completed</span>
            </label>
          </div>
          <div className="flex items-end">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Filtered Results</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSelectAll(selectedLeads.size === filteredAndSorted.length ? false : true)}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            {selectedLeads.size === filteredAndSorted.length ? 'Deselect All' : 'Select All'}
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
        leads={filteredAndSorted}
        onLeadClick={handleLeadClick}
        selectedLeads={selectedLeads}
        onLeadSelection={handleLeadSelection}
        showActions={true}
        actionButtons={renderActionButtons}
        emptyMessage="No reminders found for the selected filters."
      />

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-black">Bulk Delete Protection</h3>
                <button
                  onClick={handleBulkDeleteCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Warning: Bulk Deletion</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>You are about to delete {selectedLeads.size} leads.</p>
                        <p className="mt-1">The leads will be marked as deleted and moved to the "All Leads" page.</p>
                        <p className="mt-1">This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="bulkDeletePassword" className="block text-sm font-medium text-black mb-2">
                    Enter Admin Password to Continue
                  </label>
                  <input
                    type="password"
                    id="bulkDeletePassword"
                    value={bulkDeletePassword}
                    onChange={(e) => setBulkDeletePassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBulkDeleteSubmit()}
                    placeholder="Enter password..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-red-500 focus:border-red-500"
                    autoFocus
                  />
                  {bulkDeleteError && (
                    <p className="mt-2 text-sm text-red-600">{bulkDeleteError}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handleBulkDeleteCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteSubmit}
                  disabled={!bulkDeletePassword.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete {selectedLeads.size} Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
