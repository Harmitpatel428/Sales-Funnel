'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FormPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the add-lead page since this is a lead management system
    router.push('/add-lead?from=form');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Redirecting to Lead Form...
        </h1>
        <p className="text-gray-300">
          Taking you to the lead management form.
        </p>
      </div>
    </div>
  );
}