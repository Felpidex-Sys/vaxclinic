import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user?.email) {
          setTimeout(() => {
            fetchUserProfile(session.user.email!);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        fetchUserProfile(session.user.email);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userEmail: string) => {
    try {
      // Busca dados do funcionário
      const { data: funcData, error: funcError } = await supabase
        .from('funcionario')
        .select('*, user_id')
        .eq('email', userEmail)
        .maybeSingle();

      if (funcError) throw funcError;

      if (funcData) {
        // Busca role da tabela user_roles se user_id existir
        let userRole: 'admin' | 'geral' = 'geral';
        
        if (funcData.user_id) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', funcData.user_id)
            .maybeSingle();
          
          if (roleData?.role) {
            userRole = roleData.role as 'admin' | 'geral';
          }
        } else {
          // Fallback para cargo da tabela funcionario
          userRole = (funcData.cargo === 'ADMIN' ? 'admin' : 'geral') as 'admin' | 'geral';
        }

        const userData: User = {
          id: funcData.idfuncionario.toString(),
          name: funcData.nomecompleto,
          email: funcData.email,
          cpf: funcData.cpf,
          role: userRole,
          permissions: userRole === 'admin' ? ['all'] : ['read_clients', 'write_clients'],
          active: funcData.status === 'ATIVO',
          createdAt: new Date().toISOString(),
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return { user, login, logout, isLoading };
};