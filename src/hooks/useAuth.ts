import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types';
import { authService } from '@/lib/csharp-api';

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
    const checkAuth = () => {
      if (authService.isAuthenticated()) {
        const userData = authService.getUser();
        if (userData) {
          setUser({
            id: userData.id.toString(),
            name: userData.nome,
            email: userData.email,
            cpf: '',
            role: userData.cargo === 'ADMIN' ? 'admin' : 'funcionario',
            permissions: userData.cargo === 'ADMIN' ? ['all'] : ['read_clients', 'write_clients'],
            active: true,
            createdAt: new Date().toISOString(),
          });
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authService.login(email, password);
      
      if (response && response.token) {
        setUser({
          id: response.user.id.toString(),
          name: response.user.nome,
          email: response.user.email,
          cpf: '',
          role: response.user.cargo === 'ADMIN' ? 'admin' : 'funcionario',
          permissions: response.user.cargo === 'ADMIN' ? ['all'] : ['read_clients', 'write_clients'],
          active: true,
          createdAt: new Date().toISOString(),
        });
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return { user, login, logout, isLoading };
};
