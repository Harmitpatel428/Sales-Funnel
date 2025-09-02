'use client';

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useLeads, Lead, MobileNumber } from '../context/LeadContext';
import { useRouter } from 'next/navigation';

export default function AddLeadPage() {
  const router = useRouter();
  const { addLead, updateLead } = useLeads();
  
  const [formData, setFormData] = useState({
    kva: '',
    connectionDate: '',
    consumerNumber: '',
    company: '',
    clientName: '',
    mobileNumber: '', // Keep for backward compatibility
    mobileNumbers: [
      { id: '1', number: '', isMain: true },
      { id: '2', number: '', isMain: false },
      { id: '3', number: '', isMain: false }
    ] as MobileNumber[],
    companyLocation: '',
    unitType: 'New' as Lead['unitType'],
    status: 'New' as Lead['status'],
    lastActivityDate: '', // Will be auto-set to current date on submission
    followUpDate: '',
    finalConclusion: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Extract address from notes helper function
  const extractAddressFromNotes = (notes: string) => {
    if (!notes || !notes.includes('Address:')) {
      return { address: '', cleanNotes: notes };
    }
    
    // More comprehensive regex to catch different address formats
    const addressMatch = notes.match(/Address:\s*(.+?)(?:\s*\||\s*$)/i);
    if (addressMatch && addressMatch[1]) {
      const address = addressMatch[1].trim();
      // Remove the entire address line including "Address:" prefix
      let cleanNotes = notes.replace(/Address:\s*.+?(?:\s*\||\s*$)/i, '').trim();
      // Remove any trailing pipes or extra whitespace
      cleanNotes = cleanNotes.replace(/\|\s*$/, '').replace(/\s+$/, '').trim();
      return { address, cleanNotes };
    }
    
    return { address: '', cleanNotes: notes };
  };

  // Check if we're in edit mode and load lead data
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    
    if (mode === 'edit') {
      const storedLead = localStorage.getItem('editingLead');
      if (storedLead) {
        try {
          const leadData = JSON.parse(storedLead);
          setIsEditMode(true);
          setEditingLeadId(leadData.id);
          // Extract address from notes if it exists
          const { address, cleanNotes } = extractAddressFromNotes(leadData.notes || '');
          
          // Handle mobile numbers - convert old format to new format if needed
          let mobileNumbers: MobileNumber[] = [
            { id: '1', number: '', isMain: true },
            { id: '2', number: '', isMain: false },
            { id: '3', number: '', isMain: false }
          ];
          
          if (leadData.mobileNumbers && Array.isArray(leadData.mobileNumbers)) {
            // New format - use existing mobile numbers
            mobileNumbers = leadData.mobileNumbers.map((mobile: { id?: string; number?: string; isMain?: boolean }, index: number) => ({
              id: mobile.id || String(index + 1),
              number: mobile.number || '',
              isMain: mobile.isMain || false
            }));
          } else if (leadData.mobileNumber) {
            // Old format - convert to new format
            mobileNumbers[0] = { id: '1', number: leadData.mobileNumber, isMain: true };
          }
          
          setFormData({
            kva: leadData.kva || '',
            connectionDate: leadData.connectionDate || '',
            consumerNumber: leadData.consumerNumber || '',
            company: leadData.company || '',
            clientName: leadData.clientName || '',
            mobileNumber: leadData.mobileNumber || '', // Keep for backward compatibility
            mobileNumbers: mobileNumbers,
            companyLocation: leadData.companyLocation || address, // Use existing or extracted address
            unitType: leadData.unitType || 'New',
            status: leadData.status || 'New',
            lastActivityDate: leadData.lastActivityDate || '', // Keep existing or blank
            followUpDate: leadData.followUpDate || '',
            finalConclusion: leadData.finalConclusion || '',
            notes: cleanNotes || '', // Use clean notes without address
          });
        } catch (error) {
          console.error('Error parsing stored lead data:', error);
        }
      }
    }
    
    setIsHydrated(true);
  }, []);

  // Generate UUID function
  const generateId = (): string => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};

    // Required field validations
    if (!formData.kva.trim()) {
      newErrors.kva = 'KVA is required';
    }

    if (!formData.consumerNumber.trim()) {
      newErrors.consumerNumber = 'Consumer number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.consumerNumber.trim())) {
      newErrors.consumerNumber = 'Please enter a valid consumer number';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    // Validate mobile numbers - at least one mobile number is required
    const hasValidMobileNumber = formData.mobileNumbers.some(mobile => 
      mobile.number.trim() && /^[\d\s\-\+\(\)]+$/.test(mobile.number.trim())
    );
    
    if (!hasValidMobileNumber) {
      newErrors.mobileNumbers = 'At least one mobile number is required';
    }
    
    // Validate individual mobile numbers
    formData.mobileNumbers.forEach((mobile, index) => {
      if (mobile.number.trim() && !/^[\d\s\-\+\(\)]+$/.test(mobile.number.trim())) {
        newErrors[`mobileNumber_${index}` as keyof typeof formData] = 'Please enter a valid mobile number';
      }
    });

    // Connection date validation (if provided) - now accepts DD-MM-YYYY format
    if (formData.connectionDate && !/^\d{2}-\d{2}-\d{4}$/.test(formData.connectionDate)) {
      newErrors.connectionDate = 'Please enter a valid connection date (DD-MM-YYYY)';
    }

    // Date validation
    if (formData.followUpDate && formData.followUpDate < new Date().toISOString().split('T')[0]!) {
      newErrors.followUpDate = 'Follow-up date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle mobile number changes
  const handleMobileNumberChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      mobileNumbers: prev.mobileNumbers.map((mobile, i) => 
        i === index ? { ...mobile, number: value } : mobile
      )
    }));

    // Clear error for this field
    const errorKey = `mobileNumber_${index}` as keyof typeof formData;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Handle main mobile number selection
  const handleMainMobileNumberChange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mobileNumbers: prev.mobileNumbers.map((mobile, i) => ({
        ...mobile,
        isMain: i === index
      }))
    }));
  };

  // Handle input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    
    // If notes are being changed, automatically extract address
    if (name === 'notes') {
      const { address, cleanNotes } = extractAddressFromNotes(value);
      
      setFormData(prev => ({
        ...prev,
        [name]: cleanNotes, // Use clean notes without address
        companyLocation: address || prev.companyLocation // Set address if found, otherwise keep existing
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name as keyof typeof formData]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof formData];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Always set Last Activity Date to current date on form submission
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const currentDate = day + '-' + month + '-' + year;
      
      if (isEditMode && editingLeadId) {
        // Get main mobile number for backward compatibility
        const mainMobileNumber = formData.mobileNumbers.find(mobile => mobile.isMain)?.number || formData.mobileNumbers[0]?.number || '';
        
        // Update existing lead
        const updatedLead: Lead = {
          id: editingLeadId,
          kva: formData.kva,
          connectionDate: formData.connectionDate,
          consumerNumber: formData.consumerNumber,
          company: formData.company,
          clientName: formData.clientName,
          mobileNumber: mainMobileNumber, // Keep for backward compatibility
          mobileNumbers: formData.mobileNumbers,
          companyLocation: formData.companyLocation,
          unitType: formData.unitType,
          status: formData.status,
          lastActivityDate: currentDate, // Always update to current date
          followUpDate: formData.followUpDate,
          finalConclusion: formData.finalConclusion,
          notes: formData.notes,
          isDone: false,
          mandateStatus: 'Pending',
          documentStatus: 'Pending Documents',
        };
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateLead(updatedLead);
        
        // Clear stored editing data
        localStorage.removeItem('editingLead');
        
        // Navigate back to dashboard
        router.push('/dashboard');
      } else {
        // Add new lead
        const leadId = generateId();
        
        // Get main mobile number for backward compatibility
        const mainMobileNumber = formData.mobileNumbers.find(mobile => mobile.isMain)?.number || formData.mobileNumbers[0]?.number || '';
        
        const newLead: Lead = {
          id: leadId,
          kva: formData.kva,
          connectionDate: formData.connectionDate,
          consumerNumber: formData.consumerNumber,
          company: formData.company,
          clientName: formData.clientName,
          mobileNumber: mainMobileNumber, // Keep for backward compatibility
          mobileNumbers: formData.mobileNumbers,
          companyLocation: formData.companyLocation,
          unitType: formData.unitType,
          status: formData.status,
          lastActivityDate: currentDate, // Always set to current date
          followUpDate: formData.followUpDate,
          finalConclusion: formData.finalConclusion,
          notes: formData.notes,
          isDone: false,
          mandateStatus: 'Pending',
          documentStatus: 'Pending Documents',
          activities: [{
            id: generateId(),
            leadId: leadId,
            description: 'Lead created',
            timestamp: new Date().toISOString()
          }]
        };
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addLead(newLead);
        
        // Reset form after successful submission
        setFormData({
          kva: '',
          connectionDate: '',
          consumerNumber: '',
          company: '',
          clientName: '',
          mobileNumber: '', // Keep for backward compatibility
          mobileNumbers: [
            { id: '1', number: '', isMain: true },
            { id: '2', number: '', isMain: false },
            { id: '3', number: '', isMain: false }
          ],
          companyLocation: '',
          unitType: 'New',
          status: 'New',
          lastActivityDate: '', // Will be auto-set to current date on submission
          followUpDate: '',
          finalConclusion: '',
          notes: '',
        });
        
        // Navigate back to dashboard
        router.push('/dashboard');
      }
      
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error saving lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    // Clear stored editing data if in edit mode
    if (isEditMode) {
      localStorage.removeItem('editingLead');
    }
    router.push('/dashboard');
  };

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Lead' : 'Add New Lead'}
          </h1>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 pb-8" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="kva" className="block text-sm font-medium text-gray-700">
                KVA <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="kva"
                name="kva"
                value={formData.kva}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.kva ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter KVA"
                disabled={isSubmitting}
              />
              {errors.kva && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.kva}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="connectionDate" className="block text-sm font-medium text-gray-700">
                Connection Date
              </label>
              <input
                type="text"
                id="connectionDate"
                name="connectionDate"
                value={formData.connectionDate}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.connectionDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="DD-MM-YYYY (e.g., 00-00-0000)"
                disabled={isSubmitting}
              />
              {errors.connectionDate && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.connectionDate}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="consumerNumber" className="block text-sm font-medium text-gray-700">
                Consumer Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="consumerNumber"
                name="consumerNumber"
                value={formData.consumerNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.consumerNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter consumer number"
                disabled={isSubmitting}
              />
              {errors.consumerNumber && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.consumerNumber}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.company ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter company name"
                disabled={isSubmitting}
              />
              {errors.company && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.company}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.clientName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter client name"
                disabled={isSubmitting}
              />
              {errors.clientName && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.clientName}
                </p>
              )}
            </div>
            
            {/* Mobile Numbers Section */}
            <div className="md:col-span-2 space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Mobile Numbers <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {formData.mobileNumbers.map((mobile, index) => (
                  <div key={mobile.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="tel"
                        value={mobile.number}
                        onChange={(e) => handleMobileNumberChange(index, e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                          errors[`mobileNumber_${index}` as keyof typeof formData] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={`Mobile Number ${index + 1}`}
                        disabled={isSubmitting}
                      />
                      {errors[`mobileNumber_${index}` as keyof typeof formData] && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors[`mobileNumber_${index}` as keyof typeof formData]}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMainMobileNumberChange(index)}
                      disabled={isSubmitting}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        mobile.isMain
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-25'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        mobile.isMain ? 'border-purple-500 bg-purple-500' : 'border-gray-400'
                      }`}>
                        {mobile.isMain && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {mobile.isMain ? 'Main' : 'Set as Main'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              {errors.mobileNumbers && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.mobileNumbers}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="companyLocation" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="companyLocation"
                name="companyLocation"
                value={formData.companyLocation}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                placeholder="Enter address"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="unitType" className="block text-sm font-medium text-gray-700">
                Unit Type <span className="text-red-500">*</span>
              </label>
              <select
                id="unitType"
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                disabled={isSubmitting}
              >
                <option value="New">New</option>
                <option value="Existing">Existing</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Lead Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                disabled={isSubmitting}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="In Progress">In Progress</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Closed - Won">Closed - Won</option>
                <option value="Closed - Lost">Closed - Lost</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="lastActivityDate" className="block text-sm font-medium text-gray-700">
                Last Activity Date
              </label>
              <input
                type="date"
                id="lastActivityDate"
                name="lastActivityDate"
                value={formData.lastActivityDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700">
                Next Follow-up Date
              </label>
              <input
                type="date"
                id="followUpDate"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.followUpDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.followUpDate && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.followUpDate}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 resize-vertical text-black"
              placeholder="Enter any additional notes or comments about this lead"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 sm:flex-none sm:px-8 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditMode ? 'Updating Lead...' : 'Adding Lead...'}
                </span>
              ) : (
                isEditMode ? 'Update Lead' : 'Add Lead'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none sm:px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
