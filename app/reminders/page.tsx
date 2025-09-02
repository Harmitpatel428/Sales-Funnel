'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLeads, Lead } from '../context/LeadContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Calculate today's date at midnight UTC once per module load.
// This is more efficient than calculating it in every component instance.
// It might become stale if the page is open across midnight, but that's an acceptable trade-off for this app.
const todayAtUTCMidnight = new Date(new Date().toISOString().split('T')[0]!);

function LeadCard({ lead, onMarkDone, onViewDetails }: { lead: Lead; onMarkDone: () => void; onViewDetails: () => void }) {
  // Compare with the pre-calculated today's date.
  const isPast = new Date(lead.followUpDate) < todayAtUTCMidnight;

  // Get status color
  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-700';
      case 'Contacted': return 'bg-purple-50 text-purple-700';
      case 'In Progress': return 'bg-yellow-50 text-yellow-700';
      case 'Follow-up': return 'bg-orange-50 text-orange-700';
      case 'Closed - Won': return 'bg-green-50 text-green-700';
      case 'Closed - Lost': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-lg shadow p-5 border border-gray-100"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{lead.clientName}</h3>
          <p className="text-gray-600 text-sm truncate">{lead.company}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(lead.status)}`}>
              {lead.status}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              lead.isDone
                ? 'bg-green-50 text-green-700'
                : isPast
                ? 'bg-red-50 text-red-700'
                : 'bg-purple-50 text-purple-700'
            }`}>
              {new Date(lead.followUpDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Phone:</span> {lead.mobileNumber || 'N/A'}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Consumer #:</span> {lead.consumerNumber || 'N/A'}
            </p>
          </div>
          {lead.notes && (
            <p className="text-gray-700 mt-2 text-sm">
              <span className="font-medium">Notes:</span> {lead.notes}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col space-y-2">
          <button
            onClick={onViewDetails}
            className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Details
          </button>
          {!lead.isDone && (
            <button
              onClick={onMarkDone}
              className="bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Mark as Done
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function RemindersPage() {
  const { leads, markAsDone } = useLeads();
  const router = useRouter();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [includeDone, setIncludeDone] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredAndSorted = useMemo(() => {
    // By mapping to an object with a Date object, we avoid reparsing the date string multiple times.
    let items = leads.map(lead => ({
      ...lead,
      followUpDateObj: new Date(lead.followUpDate),
    }));

    items = items.filter(l => includeDone || !l.isDone);
    
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

  return (
    <div className="mt-8">
      <h1 className="text-3xl font-bold text-white-800 mb-6">
        Reminders & Follow-ups Filter
      </h1>

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

      {filteredAndSorted.length === 0 ? (
        <p className="text-white-500 italic">
          No reminders found for the selected filters.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredAndSorted.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onMarkDone={() => markAsDone(lead.id)}
              onViewDetails={() => router.push(`/lead/${lead.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
