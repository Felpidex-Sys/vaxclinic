import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AuthContextType {
  setupComplete: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [setupComplete, setSetupComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    checkSetup();
  }, []);

  useEffect(() => {
    if (!authLoading && !loading) {
      const currentPath = window.location.pathname;
      
      // Route logic - only redirect if not already on the right page
      if (!setupComplete && currentPath !== '/setup') {
        navigate('/setup');
      } else if (setupComplete && !user && currentPath !== '/login') {
        navigate('/login');
      } else if (setupComplete && user && (currentPath === '/setup' || currentPath === '/login')) {
        // User is logged in, redirect to home if on auth pages
        navigate('/');
      }
    }
  }, [setupComplete, user, loading, authLoading, navigate]);

  const checkSetup = async () => {
    try {
      const { data } = await supabase
        .from('configuracao_sistema')
        .select('setup_completo')
        .single();
      
      setSetupComplete(data?.setup_completo ?? false);
    } catch (error) {
      console.error('Error checking setup:', error);
      setSetupComplete(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ setupComplete, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
