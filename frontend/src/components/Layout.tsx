import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  AlertTriangle,
  Star,
  TrendingUp,
  CalendarRange,
  Users2,
  Sparkles,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  BedDouble,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../lib/types';
import { ROLE_LABELS } from '../lib/constants';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'FRONT_OFFICE', 'REVENUE', 'MANAGEMENT'] },
  { to: '/report/new', label: 'Submit Report', icon: ClipboardList, roles: ['ADMIN', 'FRONT_OFFICE'] },
  { to: '/occupancy', label: 'Occupancy Manager', icon: BedDouble, roles: ['ADMIN', 'FRONT_OFFICE', 'REVENUE', 'MANAGEMENT'] },
  { to: '/reports', label: 'Reports', icon: FileText, roles: ['ADMIN', 'FRONT_OFFICE', 'MANAGEMENT', 'REVENUE'] },
  { to: '/issues', label: 'Complaints & Maintenance', icon: AlertTriangle, roles: ['ADMIN', 'FRONT_OFFICE', 'MANAGEMENT'] },
  { to: '/reviews', label: 'Review Tracker', icon: Star, roles: ['ADMIN', 'REVENUE', 'MANAGEMENT'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['ADMIN', 'MANAGEMENT', 'REVENUE'] },
  { to: '/revenue', label: 'Revenue Analytics', icon: TrendingUp, roles: ['ADMIN', 'REVENUE', 'MANAGEMENT'] },
  { to: '/bookings', label: 'Booking Analytics', icon: CalendarRange, roles: ['ADMIN', 'REVENUE', 'MANAGEMENT'] },
  { to: '/performance', label: 'Team Performance', icon: Users2, roles: ['ADMIN', 'MANAGEMENT', 'REVENUE'] },
  { to: '/insights', label: 'AI Insights', icon: Sparkles, roles: ['ADMIN', 'MANAGEMENT', 'REVENUE'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['ADMIN', 'FRONT_OFFICE', 'REVENUE', 'MANAGEMENT'] },
  { to: '/users', label: 'User Management', icon: Users2, roles: ['ADMIN'] },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['ADMIN'] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-sidebar transform border-r border-outline-variant bg-navy text-white transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gold-light font-bold text-navy">K</div>
            <div>
              <p className="text-sm font-semibold leading-tight">Hotel Kesari</p>
              <p className="text-[10px] uppercase tracking-wider text-white/50">Operations Suite</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'border-l-2 border-gold-light bg-white/10 font-semibold text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="lg:pl-sidebar">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-lowest/95 px-4 backdrop-blur sm:px-6">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-navy" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-low"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-tight text-on-surface">{user.name}</p>
                  <p className="text-[11px] text-on-surface-variant">{ROLE_LABELS[user.role]}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-on-surface-variant" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-outline-variant bg-surface-lowest py-1 shadow-ambient">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-surface-low"
                    >
                      Profile & Password
                    </button>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger hover:bg-surface-low"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-container px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
