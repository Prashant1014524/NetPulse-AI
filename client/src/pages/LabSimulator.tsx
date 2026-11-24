import React, { useState } from 'react';
import { Activity, AlertTriangle, Check, CheckCircle2, FlaskConical, RotateCcw, ShieldCheck, Terminal, Waypoints } from 'lucide-react';

type LabScenario = {
  id: string;
  title: string;
  device: string;
  symptom: string;
  evidence: string[];
  diagnosis: string;
  commands: string[];
  verification: string;
  fixedMessage: string;
};

const SCENARIOS: LabScenario[] = [
  {
    id: 'interface-down',
    title: 'Disabled switch uplink',
    device: 'SW1 · GigabitEthernet0/1',
    symptom: 'Hosts on the access switch cannot reach the router.',
    evidence: [
      'GigabitEthernet0/1 is administratively down, line protocol is down',
      'interface GigabitEthernet0/1',
      ' shutdown',
    ],
    diagnosis: 'The uplink is administratively shut down, so the access switch cannot reach the router.',
    commands: ['configure terminal', 'interface GigabitEthernet0/1', 'no shutdown', 'end'],
    verification: 'show ip interface brief',
    fixedMessage: 'GigabitEthernet0/1 is up, line protocol is up. The simulated hosts can reach the router.',
  },
  {
    id: 'missing-route',
    title: 'Missing route to branch LAN',
    device: 'R1 · routing table',
    symptom: 'Users at the main office cannot reach the branch network 10.20.0.0/16.',
    evidence: [
      'show ip route 10.20.0.0 returns: % Network not in table',
      'The WAN interface Serial0/0/0 is up, line protocol is up',
      'Next-hop router: 192.0.2.2',
    ],
    diagnosis: 'The WAN link is up, but R1 has no route for the branch network.',
    commands: ['configure terminal', 'ip route 10.20.0.0 255.255.0.0 192.0.2.2', 'end'],
    verification: 'show ip route 10.20.0.0',
    fixedMessage: 'A route to 10.20.0.0/16 via 192.0.2.2 is now present. The simulated branch network is reachable.',
  },
  {
    id: 'ospf-area',
    title: 'OSPF area mismatch',
    device: 'R1 · GigabitEthernet0/1',
    symptom: 'R1 and R2 have a link but do not form an OSPF neighbor relationship.',
    evidence: [
      'OSPF neighbor 192.0.2.2 state: DOWN',
      'R1 interface GigabitEthernet0/1 is assigned to area 1',
      'Neighbor R2 interface is assigned to area 0',
    ],
    diagnosis: 'The routers use different OSPF areas on their shared link, preventing adjacency.',
    commands: ['configure terminal', 'interface GigabitEthernet0/1', 'ip ospf 1 area 0', 'end'],
    verification: 'show ip ospf neighbor',
    fixedMessage: 'OSPF neighbor 192.0.2.2 reached FULL state. The simulated route is available.',
  },
];

type LabStage = 'fault' | 'diagnosed' | 'verified';

const LabSimulator: React.FC = () => {
  const [scenario, setScenario] = useState<LabScenario>(SCENARIOS[0]);
  const [stage, setStage] = useState<LabStage>('fault');
  const [approved, setApproved] = useState(false);
  const [activity, setActivity] = useState<string[]>(['Lab ready. Choose an incident to begin.']);

  const selectScenario = (nextScenario: LabScenario) => {
    setScenario(nextScenario);
    setStage('fault');
    setApproved(false);
    setActivity(['Fault loaded into the isolated simulator. No router connection is configured.']);
  };

  const diagnose = () => {
    setStage('diagnosed');
    setActivity((events) => [`Diagnosis created for ${scenario.device}.`, ...events]);
  };

  const applyApprovedFix = () => {
    setApproved(true);
    setActivity((events) => [`Engineer approved and applied the listed commands in the simulator.`, ...events]);
    setStage('verified');
  };

  const reset = () => {
    setStage('fault');
    setApproved(false);
    setActivity(['Scenario reset. The original fault is active again.']);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-8">
      <header className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-[#0d1627] via-[#09101f] to-[#070b16] p-7 shadow-2xl">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/15 p-2.5 text-cyan-400"><FlaskConical className="h-6 w-6" /></div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Fix Approval Lab</h1>
            </div>
            <p className="max-w-2xl text-sm text-slate-400">Practice the full workflow on simulated Cisco incidents. Review the evidence, inspect the exact commands, approve the change, then verify the result.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300"><ShieldCheck className="h-4 w-4" /> Isolated simulator</span>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {SCENARIOS.map((item) => (
          <button key={item.id} onClick={() => selectScenario(item)} aria-pressed={scenario.id === item.id}
            className={`rounded-xl border p-4 text-left transition-colors ${scenario.id === item.id ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-[#1a2b48] bg-[#0c1324] hover:border-slate-600'}`}>
            <span className="mb-2 block text-xs font-mono text-cyan-400">{item.device}</span>
            <span className="text-sm font-semibold text-slate-100">{item.title}</span>
            <span className="mt-2 block text-xs leading-relaxed text-slate-400">{item.symptom}</span>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <section className="space-y-5 lg:col-span-3">
          <div className="card-elevated space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Waypoints className="h-4 w-4 text-cyan-400" /> Incident evidence</h2>
              <span className={`badge ${stage === 'verified' ? 'badge-info' : 'badge-high'}`}>{stage === 'verified' ? 'Verified' : stage === 'diagnosed' ? 'Review needed' : 'Fault injected'}</span>
            </div>
            <p className="text-sm text-slate-400">{scenario.symptom}</p>
            <div className="terminal">
              <div className="terminal-header"><span>{scenario.device}</span><span>simulated CLI evidence</span></div>
              <div className="space-y-1 p-4 font-mono text-xs leading-relaxed text-emerald-300">{scenario.evidence.map((line) => <div key={line}>{line}</div>)}</div>
            </div>
            {stage === 'fault' && <button onClick={diagnose} className="btn-primary"><Activity className="h-4 w-4" /> Analyze this incident</button>}
          </div>

          {stage !== 'fault' && (
            <div className="card-elevated space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200"><AlertTriangle className="h-4 w-4 text-amber-400" /> Diagnosis and command review</h2>
              <p className="text-sm leading-relaxed text-slate-300">{scenario.diagnosis}</p>
              <div className="rounded-xl border border-amber-500/20 bg-[#050811] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-300">Commands requiring approval</p>
                {scenario.commands.map((command, index) => <div key={`${command}-${index}`} className="font-mono text-xs leading-6 text-emerald-200">{command}</div>)}
              </div>
              {stage === 'diagnosed' && (
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={applyApprovedFix} className="btn-primary"><Check className="h-4 w-4" /> Approve and apply in lab</button>
                  <span className="text-xs text-slate-500">Approval applies only to this simulator.</span>
                </div>
              )}
            </div>
          )}

          {stage === 'verified' && approved && (
            <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Verification passed</h2>
              <p className="text-sm text-slate-300">{scenario.fixedMessage}</p>
              <p className="mt-3 font-mono text-xs text-cyan-300">{scenario.verification}</p>
            </div>
          )}
        </section>

        <aside className="card-elevated space-y-4 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Terminal className="h-4 w-4 text-cyan-400" /> Change activity</h2>
            <button onClick={reset} className="btn-ghost px-3 py-1.5 text-xs"><RotateCcw className="h-3.5 w-3.5" /> Reset lab</button>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">A small audit trail records analysis, approval, and the simulated outcome for this session.</p>
          <ol className="space-y-3">
            {activity.map((event, index) => (
              <li key={`${event}-${index}`} className="flex gap-3 text-xs leading-relaxed text-slate-400">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${index === 0 ? 'bg-cyan-400' : 'bg-slate-600'}`} />{event}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
};

export default LabSimulator;
