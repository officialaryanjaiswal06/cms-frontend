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

      // Normalize roles by removing 'ROLE_' prefix
      const rawRoles = decoded.roles || [];
      const normalizedRoles = rawRoles.map(role =>
        role.startsWith('ROLE_') ? role.replace('ROLE_', '') : role
      );

      console.log("Normalized Roles:", normalizedRoles); // Debug log
      setRoles(normalizedRoles);
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

      // Sync roles from user data if they exist (fallback or override token roles)
      if (userData.roles && userData.roles.length > 0) {
        const normalizeRole = (r: string) => r.startsWith('ROLE_') ? r.replace('ROLE_', '') : r;
        const userRoles = userData.roles.map(normalizeRole);
        console.log("Setting roles from User Data:", userRoles);
        setRoles(userRoles);
      }
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
    console.log("AuthContext.login called for:", username);
    try {
      const response = await authApi.login(username, password);
      console.log("API Response received:", response);

      console.log("Response Keys:", Object.keys(response));
      // Backend returns 'accessToken' usually, but let's be robust
      const newToken = (response as any).accessToken || (response as any).token;

      if (!newToken || typeof newToken !== 'string') {
        console.error("Invalid token received:", newToken);
        toast({
          title: "Login Error",
          description: "Server response missing access token.",
          variant: "destructive"
        });
        return false;
      }

      // Update localStorage immediately so subsequent requests work
      localStorage.setItem('token', newToken);

      // Decode locally first
      const isValid = decodeAndSetToken(newToken);
      console.log("Token decode validity:", isValid);

      if (isValid) {
        // Wait for user details (including roles) to be fetched
        await fetchUser();

        // NOW update the authenticated state, triggering UI updates
        setToken(newToken);

        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("AuthContext.login error:", error);
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
