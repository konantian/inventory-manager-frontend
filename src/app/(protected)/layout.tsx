'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MenuIcon, XIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useInventoryUpdates } from '@/context/inventory-updates-context';

const navigation = [
  { label: 'Dashboard', href: '/dashboard', roles: ['manager', 'staff'] },
  { label: 'Items', href: '/dashboard/items', roles: ['manager', 'staff'] },
  { label: 'Alerts', href: '/dashboard/alerts', roles: ['manager', 'staff'] },
  { label: 'Stores', href: '/dashboard/stores', roles: ['manager'] },
  { label: 'Users', href: '/dashboard/users', roles: ['manager'] },
  { label: 'Profile', href: '/dashboard/profile', roles: ['manager', 'staff'] },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { token, loading, user, logout } = useAuth();
  const router = useRouter();
  const { connected, lastEvent, clearLastEvent } = useInventoryUpdates();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/login');
    }
  }, [loading, token, router]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-lg font-semibold text-slate-200">Loading workspace…</p>
          <p className="mt-2 text-sm text-slate-400">Verifying your session.</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  const role = user.role;

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-slate-950/70 px-4 py-6 md:flex">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Inventory</p>
          <p className="mt-2 text-xl font-semibold text-white">Control Tower</p>
        </div>
        <nav className="space-y-1">
          {navigation
            .filter((item) => item.roles.includes(role))
            .map((item) => {
              const active = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-cyan-500/20 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>
        <div className="mt-auto space-y-3 rounded-2xl border border-white/5 bg-slate-900/70 p-4 text-sm text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-slate-500">WebSocket</span>
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`}
            />
          </div>
          <p className="text-sm font-semibold text-white">{connected ? 'Live updates active' : 'Reconnecting…'}</p>
          <button
            onClick={logout}
            className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:border-white/40"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-slate-950 px-4 py-6 transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Inventory</p>
            <p className="mt-2 text-xl font-semibold text-white">Control Tower</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1">
          {navigation
            .filter((item) => item.roles.includes(role))
            .map((item) => {
              const active = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-cyan-500/20 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>
        <div className="mt-auto space-y-3 rounded-2xl border border-white/5 bg-slate-900/70 p-4 text-sm text-slate-300 absolute bottom-6 left-4 right-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-slate-500">WebSocket</span>
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`}
            />
          </div>
          <p className="text-sm font-semibold text-white">{connected ? 'Live updates active' : 'Reconnecting…'}</p>
          <button
            onClick={logout}
            className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:border-white/40"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-white/5 bg-slate-950/40 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between md:flex-row md:justify-start">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white md:hidden"
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            <div className="flex-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Welcome back</p>
                <p className="text-xl font-semibold text-white">{user.username}</p>
                <p className="text-xs text-slate-400">{user.role === 'manager' ? 'Manager' : 'Staff'} access</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard/items/new')}
                  className="btn-primary text-sm"
                >
                  + Add SKU
                </button>
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="btn-secondary text-sm"
                >
                  Profile
                </button>
              </div>
            </div>
          </div>
          {lastEvent && (
            <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Live inventory update</p>
                  <p className="text-base font-semibold text-white">
                    {lastEvent.sku_name} at {lastEvent.store_name}
                  </p>
                  <p className="text-sm text-cyan-100">
                    {lastEvent.operation_type === 'create' && `Created with initial quantity of ${lastEvent.new_quantity}`}
                    {lastEvent.operation_type === 'adjust' && lastEvent.delta_quantity > 0 && `Increased by ${lastEvent.delta_quantity} to ${lastEvent.new_quantity}`}
                    {lastEvent.operation_type === 'adjust' && lastEvent.delta_quantity < 0 && `Decreased by ${Math.abs(lastEvent.delta_quantity)} to ${lastEvent.new_quantity}`}
                    {lastEvent.operation_type === 'update' && `Updated to ${lastEvent.new_quantity}`}
                    {lastEvent.operation_type === 'delete' && 'Inventory record deleted'}
                    {' '}(version {lastEvent.version})
                  </p>
                </div>
                <button onClick={clearLastEvent} className="text-xs uppercase tracking-wide text-cyan-100 hover:text-white">
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

