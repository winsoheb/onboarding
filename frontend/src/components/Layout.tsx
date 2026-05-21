import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserPlus, Server, Monitor, Truck, CheckSquare, LogOut, Settings, Sun, Moon, Archive } from 'lucide-react';
import clsx from 'clsx';
import api from '../utils/api';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = React.useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    if (user && user.role === 'TA') {
      const checkPendingHardware = async () => {
        try {
          const res = await api.get('/tickets');
          const pending = res.data.tickets.find(
            (t: any) => t.hardwareRequest?.hardwareStatus === 'PENDING'
          );
          if (pending) {
            navigate(`/ta/hardware-config/${pending.id}`);
          }
        } catch (err) {
          console.error('Failed to scan pending hardware requests', err);
        }
      };
      checkPendingHardware();
    }
  }, [user, navigate, location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'TA', 'HR', 'IT_ADMIN', 'ASSET', 'DISPATCH', 'QA', 'SUPPORT'] },
    { name: 'New Onboarding', path: '/ta/new', icon: UserPlus, roles: ['SUPER_ADMIN', 'TA'] },
    { name: 'Submitted Tickets', path: '/ta/tickets', icon: CheckSquare, roles: ['SUPER_ADMIN', 'TA'] },
    { name: 'HR Verification', path: '/hr', icon: Users, roles: ['SUPER_ADMIN', 'HR'] },
    { name: 'IT Provisioning', path: '/it', icon: Server, roles: ['SUPER_ADMIN', 'IT_ADMIN'] },
    { name: 'Asset Management', path: '/asset', icon: Monitor, roles: ['SUPER_ADMIN', 'ASSET'] },
    { name: 'Dispatch', path: '/dispatch', icon: Truck, roles: ['SUPER_ADMIN', 'DISPATCH'] },
    { name: 'QA Check', path: '/qa', icon: CheckSquare, roles: ['SUPER_ADMIN', 'QA'] },
    { name: 'Archive', path: '/archive', icon: Archive, roles: ['SUPER_ADMIN', 'TA', 'HR', 'IT_ADMIN', 'ASSET', 'DISPATCH', 'QA', 'SUPPORT'] },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold text-corporate-600 dark:text-corporate-500">EE-SBQ Onboarding</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              if (user && !item.roles.includes(user.role)) return null;
              
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={clsx(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-corporate-50 text-corporate-600 dark:bg-corporate-900/50 dark:text-corporate-500" 
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  )}
                >
                  <item.icon className={clsx("mr-3 h-5 w-5", isActive ? "text-corporate-600 dark:text-corporate-500" : "text-slate-400 dark:text-slate-500")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-4 px-3">
            <div className="w-8 h-8 rounded-full bg-corporate-100 dark:bg-corporate-900 flex items-center justify-center text-corporate-600 dark:text-corporate-500 font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-end px-6 gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-slate-600" />
            ) : (
              <Sun className="h-5 w-5 text-amber-400" />
            )}
          </button>
          
          <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
