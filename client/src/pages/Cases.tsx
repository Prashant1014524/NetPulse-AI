import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCases } from '../services/api';
import type { NetworkCase, Severity } from '../types';
import { Search, ChevronRight } from 'lucide-react';

const CASE_TITLES: Record<string, string> = {
  'Interface Administrative Shutdown': 'Interface Shutdown',
  'Default Gateway Misconfiguration': 'Gateway Misconfiguration',
  'VLAN Assignment': 'VLAN Assignment Error',
  'Trunk VLAN Allowance': 'Trunk VLAN Restriction',
  'DHCP Relay / Scope Mismatch': 'DHCP Scope Mismatch',
  'ACL Blocking DNS': 'ACL Blocking DNS',
  'NAT/PAT ACL Wildcard': 'NAT Wildcard Error',
  'Missing Route / Static Route': 'Missing Static Route',
  'OSPF Area Mismatch': 'OSPF Area Mismatch',
  'Guest Isolation ACL': 'Guest Isolation ACL',
  'Duplicate IP Address': 'Duplicate IP Conflict',
  'DHCP Pool Exhaustion': 'DHCP Pool Exhaustion',
  'Wrong Next Hop': 'Wrong Next-Hop Address',
  'Native VLAN Mismatch': 'Native VLAN Mismatch',
  'NAT ACL Mismatch': 'NAT ACL Mismatch',
  'RADIUS Authentication Failure': 'RADIUS Auth Failure',
  'ACL Blocking HTTP/HTTPS': 'ACL Blocking HTTP',
  'BGP Authentication Mismatch': 'BGP Auth Mismatch',
  'STP Root Bridge Conflict': 'STP Root Conflict',
  'Access vs Trunk Port Misconfiguration': 'Access/Trunk Misconfig',
  'Voice VLAN Not Configured': 'Voice VLAN Missing',
  'Interface Flapping': 'Interface Flapping',
  'Firewall Port Not Permitted': 'Firewall Port Blocked',
  'EIGRP AS Mismatch': 'EIGRP AS Mismatch',
  'DHCP Server Down': 'DHCP Server Down',
  'DNS Server Unreachable': 'DNS Unreachable',
  'IPSec Lifetime Mismatch': 'IPSec Lifetime Mismatch',
  'VTP Propagation Failure': 'VTP Sync Failure',
  'Port Security Violation': 'Port Security Violation',
  'QoS DSCP Marking Failure': 'QoS Marking Failure',
  'ACL Return Traffic Blocked': 'ACL Return Blocked',
  'HSRP Preempt Not Configured': 'HSRP Preempt Missing',
  'DNS Split-Horizon Misconfiguration': 'DNS Split-Horizon',
  'Trunk Port Misconfigured as Access': 'Trunk as Access Port',
};

const Cases: React.FC = () => {
  const [cases, setCases] = useState<NetworkCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    getCases().then(data => { setCases(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const reviewed: Record<string, string> = JSON.parse(localStorage.getItem('netsage_reviews') || '{}');

  const getStatus = (caseId: string): string => {
    if (reviewed[caseId]) return reviewed[caseId];
    return 'pending';
  };

  const filtered = cases.filter(c => {
    if (search && !c.caseId.toLowerCase().includes(search.toLowerCase()) &&
        !c.concept.toLowerCase().includes(search.toLowerCase()) &&
        !c.symptom.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSeverity && c.severity !== filterSeverity) return false;
    if (filterCategory && c.category !== filterCategory) return false;
    return true;
  });

  const categories = [...new Set(cases.map(c => c.category))].sort();
  const statusColors: Record<string, string> = {
    pending: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    diagnosed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    corrected: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  const sevBadge: Record<Severity, string> = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Troubleshooting Cases</h1>
          <p className="text-sm text-slate-500 mt-1">{totalCasesText(filtered.length, cases.length)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text" placeholder="Search cases, concepts, symptoms..."
            value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full bg-[#0c1222] border border-[#162037] rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40"
          />
        </div>
        <select value={filterSeverity} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterSeverity(e.target.value)}
          className="bg-[#0c1222] border border-[#162037] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer">
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterCategory} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value)}
          className="bg-[#0c1222] border border-[#162037] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || filterSeverity || filterCategory) && (
          <button onClick={() => { setSearch(''); setFilterSeverity(''); setFilterCategory(''); }}
            className="text-xs text-slate-500 hover:text-slate-300 px-3 py-2">Clear filters</button>
        )}
      </div>

      {/* Case Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => {
          const status = getStatus(c.caseId);
          const title = CASE_TITLES[c.concept] || c.concept;
          return (
            <Link key={c.caseId} to={`/cases/${c.caseId}`}
              className="card-elevated p-5 hover:border-blue-500/30 transition-all duration-200 group cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400">{c.caseId}</span>
                  <span className={`badge ${sevBadge[c.severity]}`}>{c.severity}</span>
                </div>
                <span className={`badge border ${statusColors[status]}`}>{status}</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2 group-hover:text-white transition-colors">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{c.symptom}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-[10px] bg-[#0a1020] px-2 py-0.5 rounded text-slate-500 border border-[#162037]">{c.category}</span>
                  <span className="text-[10px] bg-[#0a1020] px-2 py-0.5 rounded text-slate-500 border border-[#162037]">{c.osiLayer}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const totalCasesText = (shown: number, total: number): string =>
  shown === total ? `${total} cases` : `${shown} of ${total} cases`;

export default Cases;
