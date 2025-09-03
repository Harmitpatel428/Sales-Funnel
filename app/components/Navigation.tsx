'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, memo } from 'react';

const Navigation = memo(function Navigation() {
  const pathname = usePathname();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Update current date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-opacity-90 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="font-bold text-xl text-purple-700 tracking-tight hover:text-purple-600 transition-colors">
            V4U Lead Funnel CRM
          </div>
          
          <div className="flex space-x-6">
            <Link 
              href="/"
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${pathname === '/' 
                ? 'bg-purple-100 text-purple-700 shadow-sm' 
                : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'}`}
            >
              Home
            </Link>
            <Link 
              href="/dashboard"
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${pathname === '/dashboard' 
                ? 'bg-purple-100 text-purple-700 shadow-sm' 
                : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/add-lead"
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${pathname === '/add-lead' 
                ? 'bg-purple-100 text-purple-700 shadow-sm' 
                : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'}`}
            >
              Add Lead
            </Link>
            <Link 
              href="/reminders"
              className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${pathname === '/reminders' 
                ? 'bg-purple-100 text-purple-700 shadow-sm' 
                : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'}`}
            >
              Reminders
            </Link>
          </div>
          
          {/* Perfect Real-time Date & Time */}
          <div className="flex items-center space-x-4">
            {/* Date Display */}
            <div className="text-right">
              <div className="text-xs font-medium text-gray-500 tracking-wide uppercase">
                {currentDateTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              <div className="text-xs text-gray-400">
                {currentDateTime.toLocaleDateString('en-US', {
                  year: 'numeric'
                })}
              </div>
            </div>
            
            {/* Time Display */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-md">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-bold tracking-wider">
                  {currentDateTime.toLocaleTimeString('en-US', {
                    hour12: true,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
});

export default Navigation;
