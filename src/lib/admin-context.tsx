// Admin authentication guard and context
import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

type AdminContextType = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after auth has finished loading
    if (!loading) {
      if (!profile || profile.role !== 'admin') {
        navigate({ to: '/' });
      }
    }
  }, [profile, loading, navigate]);

  // Show nothing while auth is loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#0e47a1] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // After loading, only show admin content for admin users
  const isAdmin = profile?.role === 'admin';
  
  if (!isAdmin) {
    return null;
  }

  const isSuperAdmin = profile?.role === 'admin'; // In future, differentiate super admin

  return (
    <AdminContext.Provider value={{ isAdmin, isSuperAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
