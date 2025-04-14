import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { generateHash, getAuthDetails } from '../utils/authUtils';
import { AuthContextType, AuthHeaders, UserInfo } from '../types';

// Create context with default value
export const AuthContext = createContext<AuthContextType>({
  authHeaders: null,
  userInfo: null,
  isLoading: true
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authHeaders, setAuthHeaders] = useState<AuthHeaders | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const headers = await getAuthDetails();
        setAuthHeaders(headers);

        // Get user session info
        const userInfo = await getUserInfo();
        setUserInfo(userInfo);

        if (userInfo) {
          sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Get user session info
  const getUserInfo = async (): Promise<UserInfo | null> => {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Running in Azure so get user info from /.auth/me
      try {
        const response = await fetch('/.auth/me');
        if (!response.ok) {
          console.log("No identity provider found. Access to chat will be blocked.");
          return null;
        }
        const payload = await response.json();

        if (payload) {
          return payload as UserInfo;
        }
        return null;
      } catch (e) {
        console.error("Error fetching user info:", e);
        return null;
      }
    } else {
      // Running locally so use a mock user
      return {
        name: 'Local User',
        authenticated: true
      };
    }
  };

  // Value to be provided by the context
  const contextValue: AuthContextType = {
    authHeaders,
    userInfo,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};