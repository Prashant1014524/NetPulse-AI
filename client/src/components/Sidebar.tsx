import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Network, ShieldCheck, BarChart3, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Cases', path: '/cases', icon: Network },
  { name: 'Responsible AI', path: '/responsible-ai', icon: ShieldCheck },
  { name: 'Evaluation', path: '/evaluation', icon: BarChart3 },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-[260px] bg-[#080d1a] border-r border-[#121d33] h-full flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">NetSage AI</h1>
            <p className="text-[10px] tracking-[0.15em] uppercase text-slate-500 font-medium">Network Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2">
        <div className="text-[10px] tracking-[0.15em] uppercase text-slate-600 font-semibold px-3 mb-3">Platform</div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === '/cases' && location.pathname.startsWith('/cases'));
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1729]'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500/50" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#121d33]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          <span className="text-xs text-slate-500">System Online</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
