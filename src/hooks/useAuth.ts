import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { verifyPassword } from '@/lib/crypto';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há sessão salva no localStorage
    const savedUser = localStorage.getItem('vixclinic_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('vixclinic_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Buscar funcionário por email
      const { data: funcionario, error } = await supabase
        .from('funcionario')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error || !funcionario) {
        setIsLoading(false);
        return false;
      }

      // Verificar se funcionário está ativo
      if (funcionario.status !== 'ATIVO') {
        setIsLoading(false);
        return false;
      }

      // Verificar senha com bcrypt
      const senhaCorreta = await verifyPassword(password, funcionario.senha);
      
      if (!senhaCorreta) {
        setIsLoading(false);
        return false;
      }

      // Criar objeto User
      const userData: User = {
        id: funcionario.idfuncionario.toString(),
        name: funcionario.nomecompleto,
        email: funcionario.email,
        cpf: funcionario.cpf,
        role: 'admin', // Todos são admin no novo modelo
        permissions: ['all'],
        active: funcionario.status === 'ATIVO',
        createdAt: new Date().toISOString(),
      };

      // Salvar no localStorage e state
      localStorage.setItem('vixclinic_user', JSON.stringify(userData));
      setUser(userData);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('vixclinic_user');
    setUser(null);
  };

  return { user, login, logout, isLoading };
};