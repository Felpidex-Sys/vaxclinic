import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types';

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

// Mock users for prototype
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Maria Silva',
    email: 'admin@vaxclinic.com',
    cpf: '123.456.789-00',
    role: 'admin',
    permissions: ['all'],
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'João Santos',
    email: 'funcionario@vaxclinic.com',
    cpf: '987.654.321-00',
    role: 'funcionario',
    permissions: ['read_clients', 'write_clients', 'read_vaccines'],
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Ana Costa',
    email: 'vacinador@vaxclinic.com',
    cpf: '456.789.123-00',
    role: 'vacinador',
    permissions: ['read_clients', 'apply_vaccines', 'read_vaccines'],
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('vaxclinic_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Mock authentication - check against mock users
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === '123456') { // Simple mock password
      setUser(foundUser);
      localStorage.setItem('vaxclinic_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vaxclinic_user');
  };

  return { user, login, logout, isLoading };
};