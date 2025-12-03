import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken, User } from '@/types';
import { authApi, usersApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const decodeAndSetToken = useCallback((tokenString: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(tokenString);
      
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        setToken(null);
        setRoles([]);
        setPermissions([]);
        return false;
      }

      setRoles(decoded.roles || []);
      setPermissions(decoded.permissions || []);
      return true;
    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      setToken(null);
      return false;
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await usersApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        const isValid = decodeAndSetToken(token);
        if (isValid) {
          await fetchUser();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token, decodeAndSetToken, fetchUser]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(username, password);
      const newToken = response.token;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      const isValid = decodeAndSetToken(newToken);
      if (isValid) {
        await fetchUser();
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials';
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRoles([]);
    setPermissions([]);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: string[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const value: AuthContextType = {
    user,
    token,
    roles,
    permissions,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
