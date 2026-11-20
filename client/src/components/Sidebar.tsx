import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, ShieldCheck, BarChart3, ChevronRight, Zap, Database } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'NOC Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Incident Cases', path: '/cases', icon: Activity, badge: '34' },
  { name: 'Responsible AI', path: '/responsible-ai', icon: ShieldCheck },
  { name: 'System Evaluation', path: '/evaluation', icon: BarChart3 },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-[270px] bg-[#070b16]/95 border-r border-[#142036] h-full flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="px-6 pt-7 pb-6 border-b border-[#142036]/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">NetPulse AI</h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-mono font-semibold">
                TS
              </span>
            </div>
            <p className="text-[10px] tracking-[0.14em] uppercase text-slate-400 font-medium">NetOps Copilot</p>
          </div>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 px-3 mt-4">
        <div className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold px-3 mb-3">
          Telemetry &amp; Ops
        </div>
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/cases' && location.pathname.startsWith('/cases'));
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#0d162a]'
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isActive
                          ? 'bg-cyan-500/25 text-cyan-200'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && !item.badge && <ChevronRight className="w-3.5 h-3.5 text-cyan-400/60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Engine Status & Telemetry Card */}
      <div className="p-3 m-3 rounded-xl bg-[#0a1122] border border-[#162540]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Engine Online
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
            v2.0-TS
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Database className="w-3 h-3 text-slate-400" />
          Redis Cache Tier Ready
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-[#142036]/60 flex items-center justify-between text-[11px] text-slate-500">
        <span>Deterministic + LLM</span>
        <span className="font-mono text-slate-600">Port 3000</span>
      </div>
    </div>
  );
};

export default Sidebar;
