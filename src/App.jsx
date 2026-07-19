import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getContracts, switchToSepolia, safeContractCall } from './utils/contracts';
import FarmersManagement from './components/FarmersManagement';
import { ToastProvider, useToast } from './components/Toast';
import RegisterLivestock from './components/RegisterLivestock';
import VetsManagement from './components/VetsManagement';
import HealthRecords from './components/HealthRecords';
import Traceability from './components/Traceability';
import CarbonCredits from './components/CarbonCredits';
import CertificateManagement from './components/CertificateManagement';
import SlaughterhouseManagement from './components/SlaughterhouseManagement';
import Homepage from './components/Homepage';
import IoTMonitor from './components/IoTMonitor';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, LineChart, Line
} from 'recharts';

// ============================================
// ICON COMPONENTS (Inline SVG)
// ============================================
const Icons = {
  LayoutDashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  PlusCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  HeartPulse: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8.5c0-2.5-2-4.5-4.5-4.5-1.8 0-3.4 1-4.2 2.5-.8-1.5-2.4-2.5-4.2-2.5C6 4 4 6 4 8.5c0 3.5 3 5.5 8 9.5 5-4 8-6 8-9.5z" />
    </svg>
  ),
  MapPin: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Leaf: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 4 5 4 10c0 4 3 7 6 8v4h4v-4c3-1 6-4 6-8 0-5-4-8-8-8z" />
      <path d="M12 2v10" />
    </svg>
  ),
  Wifi: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a10.94 10.94 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.94 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Stethoscope: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 10.5a7.5 7.5 0 0 1 15 0v3a7.5 7.5 0 0 1-15 0v-3z" />
      <path d="M12 3v3" />
      <path d="M8 6h8" />
      <circle cx="19" cy="10" r="1" />
      <path d="M19 10v3a7 7 0 0 1-7 7" />
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v3" />
      <path d="M12 20v3" />
      <path d="M4.22 4.22l2.12 2.12" />
      <path d="M17.66 17.66l2.12 2.12" />
      <path d="M1 12h3" />
      <path d="M20 12h3" />
      <path d="M4.22 19.78l2.12-2.12" />
      <path d="M17.66 6.34l2.12-2.12" />
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Home: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Activity: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  TrendingDown: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  BarChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  PieChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
};

// ============================================
// THEME CONTEXT
// ============================================
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================
// SESSION CONTEXT
// ============================================
const SessionContext = createContext();
export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('session');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (account) => {
    const sessionData = {
      account,
      timestamp: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000
    };
    localStorage.setItem('session', JSON.stringify(sessionData));
    setSession(sessionData);
  };

  const logout = async () => {
    localStorage.removeItem('session');
    setSession(null);
    
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (e) {
        console.log('Revoke permissions not supported');
      }
    }
    
    window.location.href = '/';
  };

  return (
    <SessionContext.Provider value={{ session, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

// ============================================
// USER ROLE CONTEXT - FIXED
// ============================================
const RoleContext = createContext();
export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children, account }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!account) {
        setUserRole(null);
        setUserData(null);
        setIsAdminUser(false);
        setRegistrationStatus(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const contracts = await getContracts();
        
        let isAdmin = false;
        let isFarmer = false;
        let isVet = false;
        let isRegulator = false;
        let isSlaughterhouse = false;
        let farmerData = null;
        
        // Check Admin - handle gracefully
        try {
          const adminCheck = await safeContractCall(contracts.livestockRegistry, 'isAdmin', account);
          isAdmin = adminCheck.success && adminCheck.data === true;
        } catch (e) {
          console.log('Admin check failed:', e.message);
          isAdmin = false;
        }
        
        // Check Farmer - handle gracefully
        try {
          const farmerCheck = await safeContractCall(contracts.livestockRegistry, 'isFarmer', account);
          isFarmer = farmerCheck.success && farmerCheck.data === true;
        } catch (e) {
          console.log('Farmer check failed:', e.message);
          isFarmer = false;
        }
        
        // Check Regulator - handle gracefully
        try {
          const regulatorCheck = await safeContractCall(contracts.livestockRegistry, 'isRegulator', account);
          isRegulator = regulatorCheck.success && regulatorCheck.data === true;
        } catch (e) {
          console.log('Regulator check failed:', e.message);
          isRegulator = false;
        }
        
        // Check Vet - handle gracefully
        try {
          const vetCheck = await safeContractCall(contracts.healthRecord, 'isVet', account);
          isVet = vetCheck.success && vetCheck.data === true;
        } catch (e) {
          console.log('Vet check failed:', e.message);
          isVet = false;
        }
        
        // Check Slaughterhouse - handle gracefully with silent "not_registered"
        try {
          // First try isSlaughterhouseRegistered
          const shCheck = await safeContractCall(contracts.traceabilityManager, 'isSlaughterhouseRegistered', account);
          
          // Handle the response properly
          if (shCheck.success) {
            isSlaughterhouse = shCheck.data === true;
            // Only log if registered
            if (isSlaughterhouse) {
              console.log('🏭 Slaughterhouse check (registered):', isSlaughterhouse);
            }
          } else if (shCheck.error === 'not_registered') {
            // Not registered - this is expected, just set to false
            isSlaughterhouse = false;
            // Silent - no console log for expected state
          } else {
            // Other error - log it but don't break
            console.log('🏭 Slaughterhouse check error:', shCheck.error);
            isSlaughterhouse = false;
          }
        } catch (e) {
          // This catch should rarely happen since safeContractCall handles errors
          // Try the alternative function if available
          try {
            if (typeof contracts.traceabilityManager.isSlaughterhouse === 'function') {
              const shCheck = await safeContractCall(contracts.traceabilityManager, 'isSlaughterhouse', account);
              if (shCheck.success) {
                isSlaughterhouse = shCheck.data === true;
                if (isSlaughterhouse) {
                  console.log('🏭 Slaughterhouse check (direct):', isSlaughterhouse);
                }
              } else if (shCheck.error === 'not_registered') {
                isSlaughterhouse = false;
              } else {
                console.log('🏭 Slaughterhouse direct check error:', shCheck.error);
                isSlaughterhouse = false;
              }
            } else {
              // Fallback to localStorage
              const savedData = localStorage.getItem('slaughterhouse_data');
              if (savedData) {
                const allData = JSON.parse(savedData);
                isSlaughterhouse = !!allData[account.toLowerCase()];
                if (isSlaughterhouse) {
                  console.log('🏭 Slaughterhouse (from localStorage):', isSlaughterhouse);
                }
              }
            }
          } catch (e2) {
            // Silent fail - not registered is expected
            isSlaughterhouse = false;
          }
        }
        
        // Get farmer data if farmer
        if (isFarmer) {
          try {
            const farmerInfo = await safeContractCall(contracts.livestockRegistry, 'getFarmerInfo', account);
            if (farmerInfo.success) {
              farmerData = {
                name: farmerInfo.data[0] || 'Unknown Farmer',
                location: farmerInfo.data[1] || 'Unknown Location',
                active: farmerInfo.data[2] || false
              };
            }
          } catch (e) {
            console.log('Farmer info check failed:', e.message);
            // Try to get from localStorage as fallback
            const savedData = localStorage.getItem('farmers_data');
            if (savedData) {
              const allData = JSON.parse(savedData);
              const lowerAddr = account.toLowerCase();
              if (allData[lowerAddr]) {
                farmerData = {
                  name: allData[lowerAddr].name || 'Unknown Farmer',
                  location: allData[lowerAddr].location || 'Unknown Location',
                  active: true
                };
              }
            }
          }
        }

        // Determine role
        let role = 'none';
        let isAdminUser = false;
        
        if (isAdmin) {
          role = 'admin';
          isAdminUser = true;
        } else if (isSlaughterhouse) {
          role = 'slaughterhouse';
        } else if (isFarmer) {
          role = 'farmer';
        } else if (isVet) {
          role = 'vet';
        } else if (isRegulator) {
          role = 'regulator';
        }

        // Determine registration status for frontend display
        let status = null;
        if (role === 'none') {
          status = {
            type: 'warning',
            message: '⚠️ You are not registered in the system.',
            details: 'Please contact an administrator to register you.',
            action: 'Contact Admin'
          };
        } else {
          status = {
            type: 'success',
            message: `✅ Registered as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            details: `You have full access to ${role} features.`,
            action: null
          };
        }
        setRegistrationStatus(status);

        setUserRole(role);
        setIsAdminUser(isAdminUser);
        setUserData(farmerData);
        console.log('👤 User Role:', role, 'Is Admin:', isAdminUser, 'Is Slaughterhouse:', isSlaughterhouse);
        
      } catch (error) {
        console.error('Error checking user role:', error);
        // Set default role but don't crash
        setUserRole('none');
        setIsAdminUser(false);
        setRegistrationStatus({
          type: 'error',
          message: '❌ Error checking registration',
          details: 'Unable to verify your registration status. Please try again.',
          action: 'Retry'
        });
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [account]);

  return (
    <RoleContext.Provider value={{ userRole, userData, loading, isAdminUser, registrationStatus }}>
      {children}
    </RoleContext.Provider>
  );
}

// ============================================
// REGISTRATION STATUS BANNER
// ============================================
function RegistrationStatusBanner() {
  const { registrationStatus, loading } = useRole();
  const { showToast } = useToast();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!loading && registrationStatus && registrationStatus.type === 'warning') {
      showToast(registrationStatus.message, 'warning', 8000);
    }
  }, [registrationStatus, loading, showToast]);

  if (loading || dismissed || !registrationStatus || registrationStatus.type === 'success') {
    return null;
  }

  return (
    <div className={`registration-banner ${registrationStatus.type}`}>
      <div className="banner-content">
        <span className="banner-icon">{registrationStatus.type === 'warning' ? '⚠️' : '❌'}</span>
        <div className="banner-text">
          <p className="banner-title">{registrationStatus.message}</p>
          <p className="banner-details">{registrationStatus.details}</p>
          {registrationStatus.action && (
            <span className="banner-action">{registrationStatus.action}</span>
          )}
        </div>
      </div>
      <button className="banner-close" onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
}

// ============================================
// TOPBAR (Dashboard Header)
// ============================================
function Topbar({ account, logout, toggleSidebar, sidebarCollapsed }) {
  const { isDark, toggleTheme } = useTheme();
  const { userRole, userData, isAdminUser, registrationStatus } = useRole();

  const getRoleLabel = () => {
    switch(userRole) {
      case 'admin': return '👑 Admin';
      case 'farmer': return '👨‍🌾 Farmer';
      case 'vet': return '👨‍⚕️ Veterinarian';
      case 'regulator': return '🏛️ Regulator';
      case 'slaughterhouse': return '🏭 Slaughterhouse';
      default: return '🔓 Unregistered';
    }
  };

  const getRoleColor = () => {
    switch(userRole) {
      case 'admin': return 'admin';
      case 'farmer': return 'farmer';
      case 'vet': return 'vet';
      case 'regulator': return 'regulator';
      case 'slaughterhouse': return 'slaughterhouse';
      default: return 'none';
    }
  };

  const getRoleEmoji = () => {
    switch(userRole) {
      case 'admin': return '👑';
      case 'farmer': return '👨‍🌾';
      case 'vet': return '👨‍⚕️';
      case 'regulator': return '🏛️';
      case 'slaughterhouse': return '🏭';
      default: return '🔓';
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button onClick={toggleSidebar} className="topbar-menu-btn">
          {sidebarCollapsed ? <Icons.Menu /> : <Icons.Menu />}
        </button>
        <div className="topbar-brand">
          <span className="brand-icon">🐄</span>
          <span className="brand-text">Livestock Health</span>
        </div>
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <Icons.Search />
          <input type="text" placeholder="Search..." className="search-input" />
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-user">
          <div className="user-avatar-container">
            <span className="user-avatar-emoji">{getRoleEmoji()}</span>
          </div>
          <div className="user-info-container">
            <div className="user-name-display">
              {userData?.name || account?.slice(0, 10) || 'Unknown'}
            </div>
            <div className="user-role-display">
              <span className={`role-badge ${getRoleColor()}`}>
                {getRoleLabel()}
              </span>
            </div>
          </div>
          <div className="user-address-display">
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}
          </div>
        </div>

        <div className="topbar-divider"></div>

        <div className="topbar-network">
          <span className="network-dot"></span>
          <span className="network-name">Sepolia</span>
        </div>

        <button onClick={toggleTheme} className="topbar-theme-btn" title={isDark ? 'Light Mode' : 'Dark Mode'}>
          {isDark ? <Icons.Sun /> : <Icons.Moon />}
          <span className="theme-label">{isDark ? 'Light' : 'Dark'}</span>
        </button>

        <button onClick={logout} className="topbar-logout-btn" title="Disconnect">
          <Icons.LogOut />
          <span className="logout-label">Disconnect</span>
        </button>
      </div>
    </header>
  );
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================
function Sidebar({ account, logout, collapsed }) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { userRole, userData, loading, isAdminUser } = useRole();

  const allMenuItems = [
    { path: '/dashboard', icon: Icons.LayoutDashboard, label: 'Overview', roles: ['admin', 'farmer', 'vet', 'regulator', 'slaughterhouse'] },
    { path: '/register', icon: Icons.PlusCircle, label: 'Register Livestock', roles: ['admin', 'farmer'] },
    { path: '/health', icon: Icons.HeartPulse, label: 'Health Records', roles: ['admin', 'farmer', 'vet'] },
    { path: '/traceability', icon: Icons.MapPin, label: 'Traceability', roles: ['admin', 'farmer', 'regulator', 'slaughterhouse'] },
    { path: '/carbon', icon: Icons.Leaf, label: 'Carbon Credits', roles: ['admin', 'farmer'] },
    { path: '/certificates', icon: Icons.HeartPulse, label: 'Certificates', roles: ['admin', 'farmer', 'vet'] },
    { path: '/slaughterhouses', icon: Icons.Users, label: 'Slaughterhouses', roles: ['admin', 'regulator'] },
    { path: '/iot', icon: Icons.Wifi, label: 'IoT Monitor', roles: ['admin', 'farmer', 'vet'] },
    { path: '/farmers', icon: Icons.Users, label: 'Farmers', roles: ['admin', 'regulator'] },
    { path: '/vets', icon: Icons.Stethoscope, label: 'Veterinarians', roles: ['admin', 'regulator'] },
    { path: '/settings', icon: Icons.Settings, label: 'Settings', roles: ['admin', 'farmer', 'vet', 'regulator', 'slaughterhouse'] },
  ];

  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(userRole) || isAdminUser
  );

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-loading">Loading permissions...</div>
      </aside>
    );
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="link-icon"><Icon /></span>
              {!collapsed && <span className="link-label">{item.label}</span>}
              {location.pathname === item.path && <span className="link-indicator"></span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={toggleTheme} className="sidebar-theme-toggle">
          {isDark ? <Icons.Sun /> : <Icons.Moon />}
          {!collapsed && <span className="theme-text">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button onClick={handleLogout} className="sidebar-logout">
          <span className="logout-icon"><Icons.LogOut /></span>
          {!collapsed && <span className="logout-text">Disconnect</span>}
        </button>
      </div>
    </aside>
  );
}

// ============================================
// DASHBOARD LAYOUT
// ============================================
function DashboardLayout({ children, account, logout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { userRole, loading } = useRole();

  if (!loading && userRole === 'none') {
    return <Navigate to="/" replace />;
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="dashboard-layout">
      <Topbar 
        account={account} 
        logout={logout} 
        toggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />
      <RegistrationStatusBanner />
      <div className="dashboard-body">
        <Sidebar account={account} logout={logout} collapsed={sidebarCollapsed} />
        <main className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD
// ============================================
function Dashboard({ account }) {
  const [stats, setStats] = useState({
    totalLivestock: '...',
    totalVaccinations: '...',
    totalTreatments: '...',
    totalCertificates: '...',
    totalMovements: '...',
    totalSlaughter: '...',
    totalCredits: '...',
    totalEmissions: '...',
    totalReadings: '...',
    totalAlerts: '...',
    totalFarmers: '...',
    totalVets: '...',
    totalDevices: '...',
    breedData: [],
    statusData: [],
    monthlyData: [],
    healthData: [],
    movementData: [],
    alertData: [],
    creditData: [],
    deviceData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userRole, userData, isAdminUser } = useRole();

  useEffect(() => {
    const loadData = async () => {
      if (!account) return;
      try {
        setLoading(true);
        const contracts = await getContracts();

        const livestock = await safeContractCall(contracts.livestockRegistry, 'getTotalLivestock');
        const vaccines = await safeContractCall(contracts.healthRecord, 'vCount');
        const treatments = await safeContractCall(contracts.healthRecord, 'tCount');
        const certificates = await safeContractCall(contracts.healthRecord, 'cCount');
        const movements = await safeContractCall(contracts.traceabilityManager, 'getMovementCount');
        const slaughter = await safeContractCall(contracts.traceabilityManager, 'getSlaughterCount');
        const credits = await safeContractCall(contracts.carbonCreditTracker, 'getFCredits', account);
        const emissions = await safeContractCall(contracts.carbonCreditTracker, 'getFEmissions', account);
        const readings = await safeContractCall(contracts.iotHealthMonitor, 'getReadingCount');
        const alerts = await safeContractCall(contracts.iotHealthMonitor, 'getAlertCount');

        let farmers = 0, vets = 0, devices = 0;
        const farmerCount = await safeContractCall(contracts.livestockRegistry, 'farmerCount');
        if (farmerCount.success) farmers = Number(farmerCount.data);

        const vetAddresses = ['0x11a00232b92521F762Edc2438FDf28946Ed1714A'];
        let vetCount = 0;
        for (const addr of vetAddresses) {
          const isVet = await safeContractCall(contracts.healthRecord, 'isVet', addr);
          if (isVet.success && isVet.data) vetCount++;
        }
        vets = vetCount;

        const deviceCount = await safeContractCall(contracts.iotHealthMonitor, 'rCount');
        if (deviceCount.success) devices = Number(deviceCount.data);

        const breedCount = {};
        const totalLivestock = livestock.success ? Number(livestock.data) : 0;
        for (let i = 0; i < totalLivestock; i++) {
          const info = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', i);
          if (info.success && info.data[2] !== '0x0000000000000000000000000000000000000000') {
            const breed = info.data[1] || 'Unknown';
            breedCount[breed] = (breedCount[breed] || 0) + 1;
          }
        }
        const breedData = Object.keys(breedCount).map(key => ({
          name: key,
          value: breedCount[key]
        }));

        let alive = 0, deceased = 0;
        for (let i = 0; i < totalLivestock; i++) {
          const info = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', i);
          if (info.success && info.data[2] !== '0x0000000000000000000000000000000000000000') {
            if (info.data[3]) alive++;
            else deceased++;
          }
        }
        const statusData = [
          { name: 'Alive', value: alive },
          { name: 'Deceased', value: deceased }
        ];

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const monthlyData = months.map((month, i) => ({
          name: month,
          livestock: Math.max(0, Math.floor((totalLivestock / 6) * (i + 1))),
          registered: Math.max(0, Math.floor((totalLivestock / 6)))
        }));

        const vCount = vaccines.success ? Number(vaccines.data) : 0;
        const tCount = treatments.success ? Number(treatments.data) : 0;
        const cCount = certificates.success ? Number(certificates.data) : 0;
        const healthData = months.map((month, i) => ({
          name: month,
          vaccines: Math.max(0, Math.floor((vCount / 6) * (i + 1))),
          treatments: Math.max(0, Math.floor((tCount / 6) * (i + 1))),
          certificates: Math.max(0, Math.floor((cCount / 6) * (i + 1)))
        }));

        const mCount = movements.success ? Number(movements.data) : 0;
        const sCount = slaughter.success ? Number(slaughter.data) : 0;
        const movementData = months.map((month, i) => ({
          name: month,
          movements: Math.max(0, Math.floor((mCount / 6) * (i + 1))),
          slaughter: Math.max(0, Math.floor((sCount / 6) * (i + 1)))
        }));

        const aCount = alerts.success ? Number(alerts.data) : 0;
        const alertData = months.map((month, i) => ({
          name: month,
          alerts: Math.max(0, Math.floor((aCount / 6) * (i + 1))),
          readings: Math.max(0, Math.floor((readings.success ? Number(readings.data) : 0) / 6 * (i + 1)))
        }));

        const creditCount = credits.success ? Number(credits.data) : 0;
        const emissionCount = emissions.success ? Number(emissions.data) : 0;
        const creditData = months.map((month, i) => ({
          name: month,
          credits: Math.max(0, Math.floor((creditCount / 6) * (i + 1))),
          emissions: Math.max(0, Math.floor((emissionCount / 6) * (i + 1)))
        }));

        const rCount = readings.success ? Number(readings.data) : 0;
        const deviceData = months.map((month, i) => ({
          name: month,
          readings: Math.max(0, Math.floor((rCount / 6) * (i + 1))),
          devices: Math.max(0, Math.floor((devices / 6) * (i + 1)))
        }));

        setStats({
          totalLivestock: livestock.success ? livestock.data.toString() : '0',
          totalVaccinations: vaccines.success ? vaccines.data.toString() : '0',
          totalTreatments: treatments.success ? treatments.data.toString() : '0',
          totalCertificates: certificates.success ? certificates.data.toString() : '0',
          totalMovements: movements.success ? movements.data.toString() : '0',
          totalSlaughter: slaughter.success ? slaughter.data.toString() : '0',
          totalCredits: credits.success ? credits.data.toString() : '0',
          totalEmissions: emissions.success ? emissions.data.toString() : '0',
          totalReadings: readings.success ? readings.data.toString() : '0',
          totalAlerts: alerts.success ? alerts.data.toString() : '0',
          totalFarmers: farmers.toString(),
          totalVets: vets.toString(),
          totalDevices: devices.toString(),
          breedData,
          statusData,
          monthlyData,
          healthData,
          movementData,
          alertData,
          creditData,
          deviceData
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [account, userRole]);

  if (loading) {
    return (
      <div className="loading-container-centered">
        <div className="loading-spinner-centered"></div>
        <p className="loading-text">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>❌ Error loading dashboard data</p>
        <p>{error}</p>
      </div>
    );
  }

  const allCards = [
    { id: 'livestock', icon: '🐄', title: 'Livestock', value: stats.totalLivestock, label: 'Total animals', roles: ['admin', 'farmer', 'vet', 'regulator'] },
    { id: 'vaccinations', icon: '💉', title: 'Vaccinations', value: stats.totalVaccinations, label: 'Total vaccines', roles: ['admin', 'farmer', 'vet', 'regulator'] },
    { id: 'treatments', icon: '💊', title: 'Treatments', value: stats.totalTreatments, label: 'Total treatments', roles: ['admin', 'farmer', 'vet'] },
    { id: 'certificates', icon: '📋', title: 'Certificates', value: stats.totalCertificates, label: 'Issued certificates', roles: ['admin', 'farmer', 'vet'] },
    { id: 'movements', icon: '📍', title: 'Movements', value: stats.totalMovements, label: 'Total changes', roles: ['admin', 'farmer', 'regulator'] },
    { id: 'slaughter', icon: '🥩', title: 'Slaughter', value: stats.totalSlaughter, label: 'Slaughter records', roles: ['admin', 'regulator'] },
    { id: 'credits', icon: '🌍', title: 'Credits', value: stats.totalCredits, label: 'Carbon credits', roles: ['admin', 'farmer'] },
    { id: 'emissions', icon: '🏭', title: 'Emissions', value: stats.totalEmissions, label: 'CO2 emissions', roles: ['admin', 'farmer'] },
    { id: 'readings', icon: '📡', title: 'IoT Readings', value: stats.totalReadings, label: 'Sensor data', roles: ['admin', 'farmer', 'vet'] },
    { id: 'alerts', icon: '🚨', title: 'Alerts', value: stats.totalAlerts, label: 'Active alerts', roles: ['admin', 'vet', 'regulator'] },
    { id: 'farmers', icon: '👨‍🌾', title: 'Farmers', value: stats.totalFarmers, label: 'Registered farmers', roles: ['admin', 'regulator'] },
    { id: 'vets', icon: '👨‍⚕️', title: 'Vets', value: stats.totalVets, label: 'Registered vets', roles: ['admin', 'regulator'] },
    { id: 'devices', icon: '📱', title: 'Devices', value: stats.totalDevices, label: 'Active devices', roles: ['admin'] },
  ];

  const getRoleCards = () => {
    return allCards.filter(card => 
      card.roles.includes(userRole) || userRole === 'admin'
    );
  };

  const dashboardCards = getRoleCards();

  const getQuickActions = () => {
    if (userRole === 'admin') {
      return [
        { path: '/register', label: '➕ Register Livestock' },
        { path: '/health', label: '🏥 Health Records' },
        { path: '/traceability', label: '📍 Trace' },
        { path: '/carbon', label: '🌍 Carbon' },
        { path: '/farmers', label: '👨‍🌾 Farmers' },
        { path: '/vets', label: '👨‍⚕️ Vets' },
      ];
    } else if (userRole === 'farmer') {
      return [
        { path: '/register', label: '➕ Register Livestock' },
        { path: '/health', label: '🏥 Health Records' },
        { path: '/traceability', label: '📍 Trace' },
        { path: '/carbon', label: '🌍 Carbon' },
      ];
    } else if (userRole === 'vet') {
      return [
        { path: '/health', label: '🏥 Health Records' },
        { path: '/iot', label: '📡 IoT Monitor' },
      ];
    } else if (userRole === 'regulator') {
      return [
        { path: '/traceability', label: '📍 Traceability' },
        { path: '/farmers', label: '👨‍🌾 Farmers' },
        { path: '/vets', label: '👨‍⚕️ Vets' },
      ];
    } else if (userRole === 'slaughterhouse') {
      return [
        { path: '/traceability', label: '📍 Traceability' },
        { path: '/slaughterhouses', label: '🏭 Slaughterhouses' },
        { path: '/settings', label: '⚙️ Settings' },
      ];
    }
    return [];
  };

  const quickActions = getQuickActions();
  const COLORS = ['#4CAF50', '#FF9800', '#F44336', '#2196F3', '#9C27B0', '#00BCD4'];
  const STATUS_COLORS = ['#4CAF50', '#F44336'];

  return (
    <>
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
      </div>

      <div className="stats-grid-compact">
        {dashboardCards.map((card) => (
          <div key={card.id} className={`stat-card-compact ${card.id === 'alerts' && Number(card.value) > 0 ? 'alert-card' : ''}`}>
            <div className="stat-card-compact-icon">{card.icon}</div>
            <div className="stat-card-compact-content">
              <h3>{card.title}</h3>
              <p className="stat-number-compact">{card.value}</p>
              <span className="stat-label-compact">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-section">
        <h2>📈 Contract Analytics</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h4>🐄 Breed Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.breedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>🏥 Health Status</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>📈 Herd Growth</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="livestock" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="registered" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>💊 Health Records</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.healthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="vaccines" stroke="#4CAF50" />
                <Line type="monotone" dataKey="treatments" stroke="#FF9800" />
                <Line type="monotone" dataKey="certificates" stroke="#2196F3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>📍 Movement & Slaughter</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.movementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="movements" fill="#9C27B0" />
                <Bar dataKey="slaughter" fill="#F44336" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>🌍 Carbon Credits</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.creditData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="credits" stroke="#4CAF50" fill="#4CAF50" />
                <Area type="monotone" dataKey="emissions" stroke="#F44336" fill="#F44336" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>📡 IoT Monitoring</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.deviceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="readings" stroke="#2196F3" />
                <Line type="monotone" dataKey="devices" stroke="#9C27B0" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>🚨 Alerts Overview</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.alertData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="alerts" stroke="#F44336" fill="#F44336" />
                <Area type="monotone" dataKey="readings" stroke="#4CAF50" fill="#4CAF50" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.path} className="action-btn">
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

// ============================================
// PAGE PLACEHOLDERS
// ============================================
function PagePlaceholder({ title, icon }) {
  return (
    <div className="page-placeholder">
      <div className="placeholder-icon">{icon}</div>
      <h1>{title}</h1>
      <p>This page is under construction. Coming soon!</p>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================
function AppContent() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const { session, login, logout } = useSession();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            const currentAccount = accounts[0];
            console.log('🔑 Account detected:', currentAccount);
            
            if (session && session.account !== currentAccount) {
              await logout();
              setAccount(null);
              setLoading(false);
              return;
            }
            
            if (!session) {
              login(currentAccount);
            }
            
            setAccount(currentAccount);
          } else {
            if (session) {
              await logout();
            }
            setAccount(null);
          }
        } catch (e) {
          console.error('Error checking connection:', e);
        }
      }
      setLoading(false);
    };
    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        console.log('🔄 Account changed:', accounts);
        if (accounts.length === 0) {
          await logout();
          setAccount(null);
        } else if (accounts[0] !== account) {
          const newAccount = accounts[0];
          login(newAccount);
          setAccount(newAccount);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
      };
    }
  }, [account, session, login, logout]);

  const connectWallet = async () => {
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      console.log('🦊 Connecting wallet...');
      
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }
      
      await switchToSepolia();
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      console.log('📡 Accounts received:', accounts);
      
      if (accounts.length > 0) {
        const connectedAccount = accounts[0];
        login(connectedAccount);
        setAccount(connectedAccount);
        console.log('✅ Connected:', connectedAccount);
      }
    } catch (e) {
      console.error('❌ Connection error:', e);
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-centered"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  // If user is not connected, show Homepage
  if (!account) {
    return <Homepage 
      account={null} 
      connectWallet={connectWallet}
      logout={logout}
      isDark={isDark}
      toggleTheme={toggleTheme}
    />;
  }

  // If user is connected, show Dashboard
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <Dashboard account={account} />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="/register" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <RegisterLivestock account={account} />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="/health" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <HealthRecords account={account} />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="/traceability" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <Traceability account={account} />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="/carbon" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <CarbonCredits account={account} />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="/certificates" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <CertificateManagement account={account} />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="/slaughterhouses" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <SlaughterhouseManagement account={account} />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="/iot" element={
          account ? (
            <RoleProvider account={account}>
              <DashboardLayout account={account} logout={logout}>
                <IoTMonitor account={account} />
              </DashboardLayout>
            </RoleProvider>
          ) : <Navigate to="/" />
        } />
        <Route path="/farmers" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <FarmersManagement account={account} />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="/vets" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <VetsManagement account={account} />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="/settings" element={
          <RoleProvider account={account}>
            <DashboardLayout account={account} logout={logout}>
              <PagePlaceholder title="Settings" icon="⚙️" />
            </DashboardLayout>
          </RoleProvider>
        } />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}

// ============================================
// APP
// ============================================
function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;