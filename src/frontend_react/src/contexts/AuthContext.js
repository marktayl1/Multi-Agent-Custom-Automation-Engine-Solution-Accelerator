import React, { createContext, useState, useEffect, useContext } from 'react';
import { generateHash, getAuthDetails } from '../utils/authUtils';

// Create context
export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authHeaders, setAuthHeaders] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const headers = await getAuthDetails();
        setAuthHeaders(headers);

        // Get user session info
        const userInfo = await getUserInfo();
        setUserInfo(userInfo);

        sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Get user session info
  const getUserInfo = async () => {
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
          return payload;
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
  const contextValue = {
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