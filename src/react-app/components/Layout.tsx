import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { authService } from '../services/AuthService';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Warehouse,
  Users,
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Enforce light mode on mount
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    localStorage.setItem('theme', 'light');
  }, []);

  // Copy Protection
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();

    // Disable right-click
    document.addEventListener('contextmenu', preventDefault);

    // Disable copy/cut/paste
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('paste', preventDefault);

    // Disable keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+S, Ctrl+P)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'x', 'u', 's', 'p', 'a'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigate = useNavigate();
  // TEMPORARY: Removed bypass - using real auth state
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'staff'] }, // Dashboard for all? Or admin only? Let's say all but maybe limited content.
    { path: '/billing', icon: Receipt, label: 'Billing', roles: ['admin', 'staff'] },
    { path: '/products', icon: Package, label: 'Products', roles: ['admin'] },
    { path: '/stock', icon: Warehouse, label: 'Stock', roles: ['admin'] },
    { path: '/customers', icon: Users, label: 'Customers', roles: ['admin', 'staff'] },
    { path: '/reports', icon: FileText, label: 'Reports', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 transition-colors duration-300 select-none">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col shadow-xl`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left duration-500 overflow-hidden">
                <h1 className="text-2xl font-bold text-green-400 bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent company-name-font whitespace-nowrap">{user?.branch || 'VK INFOTECH'}</h1>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          {sidebarOpen && (
            <p className="text-xs text-gray-400 mt-1 animate-in fade-in slide-in-from-bottom duration-700 company-name-font whitespace-nowrap">Billing & Inventory System</p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:translate-x-1 ${isActive
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/50'
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white hover:shadow-md'
                  }`}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <Icon size={20} className={isActive ? 'drop-shadow-lg shrink-0' : 'shrink-0'} />
                {sidebarOpen && <span className="font-medium company-name-font whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/50"
          >
            <LogOut size={20} className="hover:rotate-12 transition-transform duration-300" />
            {sidebarOpen && <span className="font-medium company-name-font">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            {/* Left Spacer */}
            <div className="flex-1"></div>

            {/* Centered Company Name */}
            <div className="flex-1 flex justify-center items-center gap-4">
              <div className="w-14 h-14 rounded-full p-2 flex items-center justify-center">
                <img src="/vk-logo.png" alt="VK Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent company-name-font">{user?.branch || 'VK INFOTECH'}</h1>
            </div>

            {/* Right Side - Profile */}
            <div className="flex-1 flex items-center justify-end gap-4">
              <button className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 group">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md group-hover:scale-110 transition-transform">
                  A
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold text-gray-700">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role === 'admin' ? 'Administrator' : (user?.role || 'Staff')}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 transition-colors duration-300">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-200 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <LogOut size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Logout Confirmation</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
              >
                OK, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

