import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import { dataService } from '../services/dataService';

interface AuthContextType {
  currentUser: UserProfile;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  allUsers: UserProfile[];
  updateCurrentUserProfile: (data: Partial<UserProfile>) => void;
  isAdmin: boolean;
  isOperations: boolean;
  isSalesRep: boolean;
  isRetailer: boolean;
  isDelivery: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(dataService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>('usr_admin_01');

  useEffect(() => {
    return dataService.subscribe('k7_users', () => {
      setUsers(dataService.getUsers());
    });
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  const switchRole = (role: UserRole) => {
    // Find an existing user with that role or update current user
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
    } else {
      // Temporarily change role of current user
      const updated = { ...currentUser, role };
      dataService.saveUser(updated, currentUser);
    }
  };

  const updateCurrentUserProfile = (data: Partial<UserProfile>) => {
    const updated = { ...currentUser, ...data };
    dataService.saveUser(updated, currentUser);
  };

  const value: AuthContextType = {
    currentUser,
    activeRole: currentUser.role,
    switchRole,
    allUsers: users,
    updateCurrentUserProfile,
    isAdmin: currentUser.role === 'admin',
    isOperations: currentUser.role === 'distributor' || currentUser.role === 'admin',
    isSalesRep: currentUser.role === 'sales_rep',
    isRetailer: currentUser.role === 'retailer',
    isDelivery: currentUser.role === 'delivery'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
