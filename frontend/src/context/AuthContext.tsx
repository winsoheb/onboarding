import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'SUPER_ADMIN' | 'TA' | 'HR' | 'IT_ADMIN' | 'ASSET' | 'DISPATCH' | 'QA' | 'SUPPORT';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for bypass token
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken && storedToken.startsWith('bypass-')) {
      const role = storedToken.split('-')[1] as UserRole;
      setUser({
        id: 1,
        name: `${role} User`,
        email: `mock_${role.toLowerCase()}@sbq.com`,
        role
      });
      setToken(storedToken);
    }
  }, []);

  const login = (role: UserRole) => {
    const fakeToken = `bypass-${role}`;
    localStorage.setItem('auth_token', fakeToken);
    setToken(fakeToken);
    setUser({
      id: 1,
      name: `${role} User`,
      email: `mock_${role.toLowerCase()}@sbq.com`,
      role
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
