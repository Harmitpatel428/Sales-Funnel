'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLeads, Lead, LeadFilters } from '../context/LeadContext';

type SortField = keyof Lead | '';
type SortDirection = 'asc' | 'desc';

interface LeadTableProps {
  filters?: LeadFilters;
  onLeadClick?: (lead: Lead) => void;
  selectedLeads?: Set<string>;
  onLeadSelection?: (leadId: string, checked: boolean) => void;
  selectAll?: boolean;
  onSelectAll?: (checked: boolean) => void;
}

export default function LeadTable({ 
  filters = {}, 
  onLeadClick, 
  selectedLeads = new Set(), 
  onLeadSelection, 
  selectAll = false, 
  onSelectAll 
}: LeadTableProps) {
  const { leads, getFilteredLeads, deleteLead } = useLeads();
  const [sortField, setSortField] = useState<SortField>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  
  // Debug logging
  console.log('LeadTable render - leads count:', leads.length);
  console.log('LeadTable render - all leads:', leads);
  console.log('LeadTable render - filters:', filters);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);
  
  // Get filtered leads
  const filteredLeads = useMemo(() => {
    const filtered = getFilteredLeads(filters);
    console.log('LeadTable - filtered leads:', filtered);
    return filtered;
  }, [getFilteredLeads, filters]);
  
  // Sort leads based on current sort field and direction
  const sortedLeads = useMemo(() => {
    if (!sortField) return filteredLeads;
    
    return [...filteredLeads].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredLeads, sortField, sortDirection]);
  
  console.log('LeadTable - sorted leads:', sortedLeads);
  
  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    // Handle DD-MM-YYYY format
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Handle other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get status color
  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Contacted': return 'bg-purple-100 text-purple-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Follow-up': return 'bg-orange-100 text-orange-800';
      case 'Closed - Won': return 'bg-green-100 text-green-800';
      case 'Closed - Lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle lead deletion
  const handleDeleteLead = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation(); // Prevent row click
    deleteLead(leadId);
  };
  
  return (
    <div className="overflow-x-auto shadow-md rounded-lg relative">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            {onLeadSelection && (
              <th scope="col" className="px-2 py-3 text-left">
                <div className="w-8 h-8 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    ref={(input) => {
                      if (input) {
                        const filteredLeads = getFilteredLeads(filters);
                        const selectedCount = selectedLeads ? selectedLeads.size : 0;
                        input.indeterminate = selectedCount > 0 && selectedCount < filteredLeads.length;
                      }
                    }}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    aria-label="Select all leads"
                  />
                </div>
              </th>
            )}
            <th 
              scope="col" 
              className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('kva')}
            >
              KVA{renderSortIndicator('kva')}
            </th>
            <th 
              scope="col" 
              className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('connectionDate')}
            >
              Connection Date{renderSortIndicator('connectionDate')}
            </th>
            <th 
              scope="col" 
              className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('consumerNumber')}
            >
              Consumer Number{renderSortIndicator('consumerNumber')}
            </th>
            <th 
              scope="col" 
              className="px-14 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('company')}
            >
              Company{renderSortIndicator('company')}
            </th>
            <th 
              scope="col" 
              className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('clientName')}
            >
              Client Name{renderSortIndicator('clientName')}
            </th>
            <th 
              scope="col" 
              className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('mobileNumber')}
            >
              Mobile Number{renderSortIndicator('mobileNumber')}
            </th>
            <th 
              scope="col" 
              className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              Status{renderSortIndicator('status')}
            </th>
            <th 
              scope="col" 
              className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('lastActivityDate')}
            >
              Last Activity{renderSortIndicator('lastActivityDate')}
            </th>
            <th 
              scope="col" 
              className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('followUpDate')}
            >
              Next Follow-up{renderSortIndicator('followUpDate')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedLeads.length > 0 ? (
            sortedLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className="cursor-pointer"
                onClick={() => onLeadClick && onLeadClick(lead)}
              >
                {onLeadSelection && (
                  <td className="px-2 py-4 whitespace-nowrap">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={(e) => onLeadSelection && onLeadSelection(lead.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        aria-label={`Select lead ${lead.kva}`}
                      />
                </div>
                  </td>
                )}
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{lead.kva}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{lead.connectionDate}</div>
                </td>
                <td className="px-10 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 max-w-20 truncate">{lead.consumerNumber}</div>
                </td>
                <td className="px-1 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 max-w-45 truncate" title={lead.company}>{lead.company}</div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-500 max-w-40 truncate" title={lead.clientName}>{lead.clientName}</div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {(lead.mobileNumbers?.find(m => m.isMain)?.number || lead.mobileNumber)?.replace(/-/g, '') || ''}
                  </div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(lead.lastActivityDate)}</div>
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(lead.followUpDate)}</div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={onLeadSelection ? 8 : 7} className="px-6 py-4 text-center text-sm text-gray-500">
                No leads found matching the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}