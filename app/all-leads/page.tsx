'use client';

import { useState, useMemo, useRef } from 'react';
import { useLeads, Lead } from '../context/LeadContext';
import { useRouter } from 'next/navigation';
import LeadTable from '../components/LeadTable';
import * as XLSX from 'xlsx';

export default function AllLeadsPage() {
  const router = useRouter();
  const { leads, setLeads } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Password protection states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [passwordError, setPasswordError] = useState('');
  
  // Password change states
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  
  // Bulk delete states
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeletePassword, setBulkDeletePassword] = useState('');
  const [bulkDeleteError, setBulkDeleteError] = useState('');
  
  // Toast notification states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  
  // Password for deletion (stored in localStorage)
  const [DELETE_PASSWORD, setDELETE_PASSWORD] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('deletePassword') || 'admin123';
    }
    return 'admin123';
  });

  // Filter leads based on status and search term
  const allLeads = useMemo(() => {
    let filtered = leads; // Show all leads regardless of status or deletion status
    
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
          lead.discom,
          lead.companyLocation,
          lead.notes,
          lead.finalConclusion,
          lead.status
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        return searchableFields.some(field => field?.includes(searchLower));
      });
    }
    
    // Sort leads: deleted leads first, then completed leads, then active leads
    return filtered.sort((a, b) => {
      // If one is deleted and the other isn't, deleted goes first
      if (a.isDeleted && !b.isDeleted) return -1;
      if (!a.isDeleted && b.isDeleted) return 1;
      
      // If both are deleted or both are not deleted, check completion status
      if (a.isDone && !b.isDone) return -1;
      if (!a.isDone && b.isDone) return 1;
      
      // If both have same deletion and completion status, sort by lastActivityDate (most recent first)
      const dateA = new Date(a.lastActivityDate).getTime();
      const dateB = new Date(b.lastActivityDate).getTime();
      return dateB - dateA; // Most recent first
    });
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

  // Password protection functions
  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError('');
  };

  // Restore function to restore deleted leads
  const handleRestoreClick = (lead: Lead) => {
    if (lead.isDeleted) {
      // Restore the lead by setting isDeleted to false
      setLeads(prev => 
        prev.map(l => l.id === lead.id ? { ...l, isDeleted: false } : l)
      );
      
      // Show success message
      alert(`Lead "${lead.clientName}" has been restored successfully!`);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === DELETE_PASSWORD) {
      if (leadToDelete) {
        // Always permanently delete when deleting from All Leads page
        setLeads(prev => prev.filter(lead => lead.id !== leadToDelete.id));
        setShowPasswordModal(false);
        setLeadToDelete(null);
        setPassword('');
        setPasswordError('');
      }
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setLeadToDelete(null);
    setPassword('');
    setPasswordError('');
  };

  // Password change functions
  const handlePasswordChangeSubmit = () => {
    if (currentPassword !== DELETE_PASSWORD) {
      setPasswordChangeError('Current password is incorrect.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordChangeError('New password must be at least 4 characters long.');
      return;
    }
    
    setDELETE_PASSWORD(newPassword);
    localStorage.setItem('deletePassword', newPassword);
    setShowPasswordChangeModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordChangeError('');
  };

  const handlePasswordChangeCancel = () => {
    setShowPasswordChangeModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordChangeError('');
  };

  // Bulk delete functions
  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === allLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(allLeads.map(lead => lead.id)));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedLeads.size === 0) return;
    setShowBulkDeleteModal(true);
    setBulkDeletePassword('');
    setBulkDeleteError('');
  };

  // Bulk restore function
  const handleBulkRestoreClick = () => {
    if (selectedLeads.size === 0) return;
    
    // Restore all selected deleted leads
    setLeads(prev => 
      prev.map(lead => 
        selectedLeads.has(lead.id) && lead.isDeleted 
          ? { ...lead, isDeleted: false }
          : lead
      )
    );
    
    setSelectedLeads(new Set());
    
    // Show success message
    alert(`${selectedLeads.size} leads have been restored successfully!`);
  };

  // Check if any selected leads are already deleted
  const hasDeletedLeads = Array.from(selectedLeads).some(leadId => {
    const lead = leads.find(l => l.id === leadId);
    return lead?.isDeleted;
  });


  const handleBulkDeleteSubmit = () => {
    if (bulkDeletePassword !== DELETE_PASSWORD) {
      setBulkDeleteError('Incorrect password. Please try again.');
      return;
    }
    
    // Always permanently delete all selected leads
    setLeads(prev => prev.filter(lead => !selectedLeads.has(lead.id)));
    
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

  // Secret password change access
  const handleSecretClick = () => {
    setShowPasswordChangeModal(true);
  };

  // Handle lead click
  const handleLeadClick = (lead: any) => {
    openModal(lead);
  };

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import function (copied from dashboard)
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        alert('The file does not contain any worksheets.');
        return;
      }
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        alert('The worksheet could not be read.');
        return;
      }
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        alert('The file appears to be empty or has no data rows.');
        return;
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      const newLeads: Lead[] = [];

      rows.forEach((row, index) => {
        if (row.every(cell => !cell || cell.toString().trim() === '')) return;

        const lead: Lead = {
          id: `imported-${Date.now()}-${index}`,
          clientName: '',
          company: '',
          mobileNumber: '',
          mobileNumbers: [],
          consumerNumber: '',
          kva: '',
          connectionDate: '',
          companyLocation: '',
          notes: '',
          status: 'New',
          unitType: 'New',
          followUpDate: '',
          lastActivityDate: new Date().toLocaleDateString('en-GB'),
          isDone: false,
          isDeleted: false,
          isUpdated: false,
          activities: [],
          mandateStatus: 'Pending',
          documentStatus: 'Pending Documents',
          finalConclusion: ''
        };

        // Map headers to lead fields
        headers.forEach((header, colIndex) => {
          if (!header || colIndex >= row.length || colIndex < 0) return;

          const value = row[colIndex];
          if (!value || value.toString().trim() === '') return;

          const headerLower = header.toString().toLowerCase().trim();
          const valueStr = value.toString().trim();

          // Map headers to lead properties
          if (headerLower.includes('client') || headerLower.includes('name')) {
            lead.clientName = valueStr;
          } else if (headerLower.includes('company')) {
            lead.company = valueStr;
          } else if (headerLower.includes('mobile') || headerLower.includes('phone')) {
            // Only allow numeric characters in mobile numbers
            const numericValue = valueStr.replace(/[^0-9]/g, '');
            
            if (headerLower.includes('2')) {
              // Mobile Number 2
              if (!lead.mobileNumbers) lead.mobileNumbers = [];
              if (lead.mobileNumbers.length < 2) {
                lead.mobileNumbers.push({
                  id: `mobile-${Date.now()}-${index}-2`,
                  number: numericValue,
                  name: '',
                  isMain: false
                });
              } else if (lead.mobileNumbers[1]) {
                lead.mobileNumbers[1] = { 
                  id: lead.mobileNumbers[1].id, 
                  number: numericValue, 
                  name: lead.mobileNumbers[1].name, 
                  isMain: lead.mobileNumbers[1].isMain 
                };
              }
            } else if (headerLower.includes('3')) {
              // Mobile Number 3
              if (!lead.mobileNumbers) lead.mobileNumbers = [];
              if (lead.mobileNumbers.length < 3) {
                lead.mobileNumbers.push({
                  id: `mobile-${Date.now()}-${index}-3`,
                  number: numericValue,
                  name: '',
                  isMain: false
                });
              } else if (lead.mobileNumbers[2]) {
                lead.mobileNumbers[2] = { 
                  id: lead.mobileNumbers[2].id, 
                  number: numericValue, 
                  name: lead.mobileNumbers[2].name, 
                  isMain: lead.mobileNumbers[2].isMain 
                };
              }
            } else {
              // Main mobile number
              lead.mobileNumber = numericValue;
              if (!lead.mobileNumbers) lead.mobileNumbers = [];
              if (lead.mobileNumbers.length === 0) {
                lead.mobileNumbers.push({
                  id: `mobile-${Date.now()}-${index}-1`,
                  number: numericValue,
                  name: '',
                  isMain: true
                });
              }
            }
          } else if (headerLower.includes('contact') && headerLower.includes('name')) {
            if (headerLower.includes('2')) {
              // Contact Name 2
              if (!lead.mobileNumbers) lead.mobileNumbers = [];
              if (lead.mobileNumbers.length < 2) {
                lead.mobileNumbers.push({
                  id: `mobile-${Date.now()}-${index}-2`,
                  number: '',
                  name: valueStr,
                  isMain: false
                });
              } else if (lead.mobileNumbers[1]) {
                lead.mobileNumbers[1] = { 
                  id: lead.mobileNumbers[1].id, 
                  number: lead.mobileNumbers[1].number, 
                  name: valueStr, 
                  isMain: lead.mobileNumbers[1].isMain 
                };
              }
            } else if (headerLower.includes('3')) {
              // Contact Name 3
              if (!lead.mobileNumbers) lead.mobileNumbers = [];
              if (lead.mobileNumbers.length < 3) {
                lead.mobileNumbers.push({
                  id: `mobile-${Date.now()}-${index}-3`,
                  number: '',
                  name: valueStr,
                  isMain: false
                });
              } else if (lead.mobileNumbers[2]) {
                lead.mobileNumbers[2] = { 
                  id: lead.mobileNumbers[2].id, 
                  number: lead.mobileNumbers[2].number, 
                  name: valueStr, 
                  isMain: lead.mobileNumbers[2].isMain 
                };
              }
            }
          } else if (headerLower.includes('consumer') || headerLower.includes('con.no')) {
            lead.consumerNumber = valueStr;
          } else if (headerLower.includes('kva')) {
            lead.kva = valueStr;
          } else if (headerLower.includes('connection') && headerLower.includes('date')) {
            lead.connectionDate = valueStr;
          } else if (headerLower.includes('location') || headerLower.includes('address')) {
            lead.companyLocation = valueStr;
          } else if (headerLower.includes('notes') || headerLower.includes('discussion') || headerLower.includes('comment')) {
            lead.notes = valueStr;
          } else if (headerLower.includes('status') || headerLower.includes('old') || headerLower.includes('new')) {
            // Handle status mapping
            const statusValue = valueStr.toLowerCase();
            if (statusValue.includes('mandate sent') || statusValue.includes('documentation')) {
              lead.status = 'Mandate Sent';
            } else if (statusValue.includes('contacted')) {
              lead.status = 'New';
            } else if (statusValue.includes('progress')) {
              lead.status = 'Follow-up';
            } else if (statusValue.includes('follow')) {
              lead.status = 'Follow-up';
            } else if (statusValue.includes('closed') || statusValue.includes('won')) {
              lead.status = 'Deal Close';
            } else {
              lead.status = 'New';
            }
          } else if (headerLower.includes('unit') || headerLower.includes('type')) {
            lead.unitType = valueStr;
          } else if (headerLower.includes('follow') && headerLower.includes('date')) {
            lead.followUpDate = valueStr;
          } else if (headerLower.includes('discom') || headerLower.includes('distribution') || headerLower.includes('utility')) {
            lead.discom = valueStr;
          }
        });

        // Only add if we have at least a client name
        if (lead.clientName) {
          newLeads.push(lead);
        }
      });

      if (newLeads.length > 0) {
        setLeads(prev => [...prev, ...newLeads]);
        alert(`Successfully imported ${newLeads.length} leads!`);
      } else {
        alert('No valid leads found in the file.');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file. Please check the file format and try again.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Export function (copied from dashboard)
  const handleExportExcel = async () => {
    try {
      // Dynamic import to avoid turbopack issues
      const XLSX = await import('xlsx');
      
      // Get filtered leads
      const leadsToExport = allLeads;
      
      // Define Excel headers with remapped column names for export
      const headers = [
        'con.no', 
        'KVA', 
        'Connection Date', 
        'Company Name', 
        'Client Name', 
        'Discom',
        'Main Mobile Number', 
        'Lead Status', 
        'Last Discussion', 
        'Address',
        'Next Follow-up Date',
        'Mobile Number 2', 
        'Contact Name 2', 
        'Mobile Number 3', 
        'Contact Name 3'
      ];
      
      // Convert leads to Excel rows with remapped data
      const rows = leadsToExport.map(lead => {
        // Get mobile numbers and contacts
        const mobileNumbers = lead.mobileNumbers || [];
        const mainMobile = mobileNumbers.find(m => m.isMain) || mobileNumbers[0] || { number: lead.mobileNumber || '', name: '' };
        const mobile2 = mobileNumbers[1] || { number: '', name: '' };
        const mobile3 = mobileNumbers[2] || { number: '', name: '' };
        
        // Format main mobile number with contact name if available
        const mainMobileDisplay = mainMobile.name 
          ? `${mainMobile.number} (${mainMobile.name})` 
          : mainMobile.number || '';
        
        return [
          lead.consumerNumber || '',
          lead.kva || '',
          lead.connectionDate && lead.connectionDate.trim() !== '' ? lead.connectionDate : '',
          lead.company || '',
          lead.clientName || '',
          lead.discom || '', // Discom
          mainMobileDisplay, // Main Mobile Number (with contact name if available)
          lead.status || 'New', // Lead Status
          lead.notes || '', // Last Discussion
          lead.companyLocation || (lead.notes && lead.notes.includes('Address:') ? lead.notes.split('Address:')[1]?.trim() || '' : ''), // Address
          lead.followUpDate || '', // Next Follow-up Date
          mobile2.number || '', // Mobile Number 2
          mobile2.name || '', // Contact Name 2
          mobile3.number || '', // Mobile Number 3
          mobile3.name || '' // Contact Name 3
        ];
      });
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      
      // Generate Excel file and download
      XLSX.writeFile(wb, `leads-export-all-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // Show success notification
      setShowToast(true);
      setToastMessage(`Successfully exported ${leadsToExport.length} leads to Excel format`);
      setToastType('success');
    } catch (error) {
      console.error('Export error:', error);
      setShowToast(true);
      setToastMessage('Failed to export leads. Please try again.');
      setToastType('error');
    }
  };

  // Action buttons for the table
  const renderActionButtons = (lead: any) => (
    <div className="flex space-x-2">
      {!lead.isDeleted && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem('editingLead', JSON.stringify(lead));
              router.push(`/add-lead?mode=edit&id=${lead.id}&from=all-leads`);
            }}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(lead);
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
          >
            Delete
          </button>
        </>
      )}
      {lead.isDeleted && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRestoreClick(lead);
            }}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
            title="Restore this lead to its original status"
          >
            Restore
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(lead);
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
            title="Delete this lead permanently"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-800 rounded-lg mb-8 p-8">
        {/* Title Section */}
        <div className="text-center mb-6">
          <h1 
            className="text-4xl md:text-5xl font-bold text-white cursor-pointer select-none mb-2"
            onClick={handleSecretClick}
            title="Click 5 times quickly to access password change"
          >
            All Leads
          </h1>
          <p className="text-blue-100 text-sm font-medium">
            🚷 This page is strictly reserved for Admins Anil Patel & Jitendra Patel - unauthorized access will be monitored.
          </p>
        </div>
        
        {/* Stats and Action Buttons */}
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Total Leads Stat Box - Enhanced */}
          <div className="relative group">
            {/* Animated Border Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 rounded-2xl blur-sm opacity-0 group-hover:opacity-25 transition-all duration-600 animate-pulse"></div>
            
            {/* Main Container */}
            <div className="relative bg-white border-2 border-blue-200 rounded-2xl px-16 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 overflow-hidden">
              {/* Animated Background Waves */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-emerald-50/20 to-purple-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Floating Dots */}
              <div className="absolute top-4 right-4 w-1 h-1 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-70 animate-bounce animation-delay-1000"></div>
              <div className="absolute bottom-4 left-4 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-70 animate-bounce animation-delay-2000"></div>
              <div className="absolute top-1/2 right-6 w-0.5 h-0.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-70 animate-bounce animation-delay-3000"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2 group-hover:text-blue-700 transition-colors duration-300 group-hover:scale-105 transform transition-transform duration-300">
                  {allLeads.length}
                </div>
                <div className="text-gray-600 text-sm font-semibold uppercase tracking-wide group-hover:text-gray-700 transition-colors duration-300">
                  Total Leads
                </div>
              </div>
              
              {/* Top and Bottom Accent Lines */}
              <div className="absolute top-0 left-1/2 right-1/2 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-500 transform -translate-x-1/2 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
              <div className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-x-1/2 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
              
              {/* Side Accent Lines */}
              <div className="absolute top-1/2 left-0 w-0.5 h-8 bg-gradient-to-b from-emerald-400 to-blue-500 transform -translate-y-1/2 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center"></div>
              <div className="absolute top-1/2 right-0 w-0.5 h-8 bg-gradient-to-b from-blue-500 to-purple-500 transform -translate-y-1/2 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center"></div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center items-center space-x-4">
            {/* Import Button */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.xlsm,.csv"
                onChange={handleFileImport}
                className="hidden"
                id="file-import"
              />
              <label
                htmlFor="file-import"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl cursor-pointer flex items-center space-x-2 font-semibold transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Import Leads</span>
              </label>
            </div>
            
            {/* Export Button */}
            <button
              onClick={handleExportExcel}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export All Leads</span>
            </button>
            
          </div>
        </div>
      </div>



      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-black">All Leads</h2>
              
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search leads..."
                  className="block w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-black focus:outline-none focus:placeholder-black focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {selectedLeads.size === allLeads.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedLeads.size > 0 && (
                <>
                  <button
                    onClick={handleBulkDeleteClick}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Selected ({selectedLeads.size})
                  </button>
                  {hasDeletedLeads && (
                    <button
                      onClick={handleBulkRestoreClick}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Restore Selected ({selectedLeads.size})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <LeadTable
            leads={allLeads}
            onLeadClick={handleLeadClick}
            selectedLeads={selectedLeads}
            onLeadSelection={handleSelectLead}
            showActions={true}
            actionButtons={renderActionButtons}
            emptyMessage="No leads found in the system"
          />
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
                      selectedLead.status === 'Documentation' ? 'bg-teal-100 text-teal-800' :
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
                        router.push(`/add-lead?mode=edit&id=${selectedLead.id}&from=all-leads`);
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

      {/* Password Protection Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Lead Protection</h3>
                <button
                  onClick={handlePasswordCancel}
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
                      <h3 className="text-sm font-medium text-red-800">
                        {leadToDelete?.isDeleted ? 'Warning: Permanent Deletion' : 'Warning: Delete Lead'}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {leadToDelete?.isDeleted ? (
                          <>
                            <p>You are about to permanently delete this lead from the system:</p>
                            <p className="font-semibold mt-1">{leadToDelete?.clientName} - {leadToDelete?.company}</p>
                            <p className="mt-1">This will completely remove the lead from all records. This action cannot be undone.</p>
                          </>
                        ) : (
                          <>
                            <p>You are about to delete this lead:</p>
                            <p className="font-semibold mt-1">{leadToDelete?.clientName} - {leadToDelete?.company}</p>
                            <p className="mt-1">The lead will be marked as deleted and moved to the "All Leads" page. This action cannot be undone.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Admin Password to Continue
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder="Enter password..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-red-500 focus:border-red-500"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handlePasswordCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={!password.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {leadToDelete?.isDeleted ? 'Permanently Delete' : 'Delete Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-black">Change Delete Password</h3>
                <button
                  onClick={handlePasswordChangeCancel}
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
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-black mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    autoComplete="off"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-black mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    autoComplete="new-password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password..."
                    autoComplete="new-password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {passwordChangeError && (
                  <p className="text-sm text-red-600">{passwordChangeError}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handlePasswordChangeCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChangeSubmit}
                  disabled={!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <h3 className="text-sm font-medium text-red-800">
                        {hasDeletedLeads ? 'Warning: Mixed Bulk Deletion' : 'Warning: Bulk Deletion'}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {hasDeletedLeads ? (
                          <>
                            <p>You are about to delete {selectedLeads.size} leads:</p>
                            <p className="mt-1">• Some leads will be marked as deleted and moved to "All Leads"</p>
                            <p className="mt-1">• Some leads will be permanently removed from the system</p>
                            <p className="mt-1">This action cannot be undone.</p>
                          </>
                        ) : (
                          <>
                            <p>You are about to delete {selectedLeads.size} leads.</p>
                            <p className="mt-1">The leads will be marked as deleted and moved to the "All Leads" page.</p>
                            <p className="mt-1">This action cannot be undone.</p>
                          </>
                        )}
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
                  {hasDeletedLeads ? `Process ${selectedLeads.size} Leads` : `Delete ${selectedLeads.size} Leads`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
