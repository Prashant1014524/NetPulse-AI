import React, { useState } from 'react';
import {
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { troubleshootLog } from '../services/api';
import type { Diagnosis } from '../types';

interface PresetLog {
  id: string;
  name: string;
  category: string;
  symptom: string;
  log: string;
}

const PRESET_LOGS: PresetLog[] = [
  {
    id: 'admin-down',
    name: 'Interface Admin Down',
    category: 'Layer 1/2',
    symptom: 'Switchport GigabitEthernet0/1 link is dead and passing no traffic.',
    log: `Switch# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/1     192.168.10.1    YES manual administratively down down
GigabitEthernet0/2     192.168.20.1    YES manual up                    up

Switch# show running-config interface GigabitEthernet0/1
interface GigabitEthernet0/1
 description Trunk to Distribution Switch
 switchport mode trunk
 shutdown
!`
  },
  {
    id: 'ospf-down',
    name: 'OSPF Neighbor Down',
    category: 'Layer 3 Routing',
    symptom: 'OSPF adjacency dropped unexpectedly between Core-R1 and Distribution-R2.',
    log: `%OSPF-5-ADJCHG: Process 1, Nbr 192.168.1.2 on GigabitEthernet0/1 from FULL to DOWN, Neighbor Down: Dead timer expired

Router# show ip ospf neighbor
Neighbor ID     Pri   State           Dead Time   Address         Interface
(no active neighbors found)

Router# show ip ospf interface GigabitEthernet0/1
GigabitEthernet0/1 is up, line protocol is up
  Internet Address 192.168.1.1/30, Area 0
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
  Hello due in 00:00:04`
  },
  {
    id: 'dhcp-exhausted',
    name: 'DHCP Pool Exhausted',
    category: 'Layer 7 / IP',
    symptom: 'Newly connected workstations receive 169.254.x.x APIPA addresses and cannot reach the LAN.',
    log: `Router# show ip dhcp pool LAN_CLIENTS
Pool LAN_CLIENTS :
 Utilization mark (high/low)    : 100 / 0
 Subnet size (total/usable)     : 256 / 254
 Leased addresses               : 254
 Pending event                  : none
 1 subnet is currently in the pool :
 Current index        IP pool range                    Leased addresses
 10.0.0.254          10.0.0.1         - 10.0.0.254     254

Client C:\\> ipconfig
   IPv4 Address. . . . . . . . . . . : 169.254.42.118
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : `
  },
  {
    id: 'acl-deny',
    name: 'ACL Dropping HTTP/HTTPS',
    category: 'Layer 4 Security',
    symptom: 'Finance clients in subnet 192.168.1.0/24 report web application timeouts to 10.0.0.10.',
    log: `Router# show logging | include SEC-6-IPACCESSLOG
%SEC-6-IPACCESSLOGP: list 101 denied tcp 192.168.1.50(54210) -> 10.0.0.10(80), 1 packet
%SEC-6-IPACCESSLOGP: list 101 denied tcp 192.168.1.50(54212) -> 10.0.0.10(443), 1 packet

Router# show access-lists 101
Extended IP access list 101
    10 permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.5 eq 443
    20 deny ip any any (1428 matches)`
  },
  {
    id: 'bgp-idle',
    name: 'BGP Peering Idle',
    category: 'BGP / WAN',
    symptom: 'Border router lost external default gateway route from ISP peer 198.51.100.1.',
    log: `EdgeRouter# show ip bgp summary
BGP router identifier 203.0.113.5, local AS number 65001
BGP table version is 1, main routing table version 1

Neighbor        V           AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd
198.51.100.1    4        65002       0       0        1    0    0 00:14:22 Idle

EdgeRouter# show ip bgp neighbors 198.51.100.1
BGP state = Idle
  Last read 00:15:01, last write 00:15:01, hold time is 180, keepalive interval is 60 seconds
  TCP open failed: Connection refused (port 179)`
  },
  {
    id: 'duplex-mismatch',
    name: 'Duplex Mode Mismatch',
    category: 'Layer 1/2',
    symptom: 'Excessive latency and frame drops between Switch-01 and Access-Switch-02.',
    log: `%CDP-4-DUPLEX_MISMATCH: Full/half duplex mismatch on GigabitEthernet0/1 (Half Duplex), with Core-SW GigabitEthernet0/1 (Full Duplex).

Switch# show interfaces GigabitEthernet0/1
GigabitEthernet0/1 is up, line protocol is up (connected)
  Hardware is Gigabit Ethernet, address is 5000.0001.0000
  Half-duplex, 1000Mb/s, media type is 10/100/1000BaseTX
  58223 input errors, 41208 CRC, 14210 late collision, 0 deferred`
  },
  {
    id: 'err-disabled',
    name: 'Port Security Err-Disable',
    category: 'Switch Security',
    symptom: 'User plugged an unapproved laptop into cubicle port Fa0/5 and the port instantly died.',
    log: `%PM-4-ERR_DISABLE: psecure-violation error detected on FastEthernet0/5, putting FastEthernet0/5 in err-disable state
%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC 482c.6a19.bc4f on port FastEthernet0/5.

Switch# show interfaces status err-disabled
Port      Name               Status       Reason               Err-disabled Vlans
Fa0/5     Workstation-12     err-disabled psecure-violation    10`
  }
];

const DIAGNOSTIC_STEPS = [
  'Parsing Syslog headers & Cisco CLI syntax tokens...',
  'Evaluating deterministic CCIE rule checker engine...',
  'Performing root-cause correlation & OSI layer mapping...',
  'Synthesizing Cisco IOS CLI remediation script...'
];

export const LiveTroubleshooter: React.FC = () => {
  const [logText, setLogText] = useState<string>('');
  const [symptomText, setSymptomText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectPreset = (preset: PresetLog) => {
    setLogText(preset.log);
    setSymptomText(preset.symptom);
    setDiagnosis(null);
  };

  const handleClear = () => {
    setLogText('');
    setSymptomText('');
    setDiagnosis(null);
  };

  const handleAnalyze = async () => {
    if (!logText.trim()) return;

    setIsAnalyzing(true);
    setCurrentStepIndex(0);
    setDiagnosis(null);

    // Multi-stage visual step progression
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < DIAGNOSTIC_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      const result = await troubleshootLog(logText, symptomText);
      // Wait at least 1.4s for polished animation feel
      setTimeout(() => {
        clearInterval(stepInterval);
        setDiagnosis(result);
        setIsAnalyzing(false);
      }, 1400);
    } catch {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
    }
  };

  const handleCopyCommands = () => {
    if (!diagnosis || !diagnosis.fix_steps) return;
    const textToCopy = diagnosis.fix_steps.join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#09101f] to-[#070b16] border border-[#172540] p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Terminal className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                Live Cisco Log Troubleshooter
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-medium">
                  v2.0 Real-Time
                </span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">
              Paste any Cisco IOS error log, syslog message, or show command output. NetPulse AI inspects
              the packet/protocol telemetry, identifies the root cause, and generates exact copyable CLI commands.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d182b] border border-[#1b2b48] text-xs text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Rule Engine Active
            </div>
          </div>
        </div>
      </div>

      {/* Preset Quick-Load Pills */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Quick Presets (1-Click Test)
          </div>
          <span className="text-xs text-slate-500">Click any preset or paste your custom log below</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_LOGS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className="px-3.5 py-2 rounded-xl bg-[#0b1324] hover:bg-[#121f38] border border-[#192b4a] hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all duration-200 flex items-center gap-2 shadow-sm"
            >
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                {preset.category}
              </span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Troubleshooting Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl bg-[#090f1d] border border-[#15233c] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#15233c]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-slate-200">Cisco CLI / Syslog Input</span>
              </div>
              {logText && (
                <button
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Optional Symptom Input */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Observed Symptom (Optional):
              </label>
              <input
                type="text"
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                placeholder="e.g. Workstations cannot reach the default gateway, or OSPF adjacency dropped"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a14] border border-[#1a2b48] focus:border-cyan-500 focus:outline-none text-slate-200 text-xs placeholder-slate-600 font-mono transition-colors"
              />
            </div>

            {/* Terminal Textarea */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Cisco Log / Command Output:</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {logText ? `${logText.split('\n').length} lines` : 'Empty'}
                </span>
              </label>
              <div className="relative rounded-xl border border-[#1a2b48] bg-[#050811] overflow-hidden focus-within:border-cyan-500/70 transition-colors">
                <div className="flex items-center justify-between px-3.5 py-2 bg-[#090e1a] border-b border-[#142036] text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    <span className="ml-2 text-slate-500">cisco-ios-session.log</span>
                  </div>
                  <span className="text-slate-600">UTF-8</span>
                </div>
                <textarea
                  rows={14}
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder={`Paste Cisco IOS show output, syslog messages, or debug traces here...

Example:
Switch# show ip interface brief
GigabitEthernet0/1  192.168.1.1  YES manual administratively down down`}
                  className="w-full p-4 bg-transparent text-slate-200 text-xs font-mono placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAnalyze}
              disabled={!logText.trim() || isAnalyzing}
              className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg ${
                !logText.trim() || isAnalyzing
                  ? 'bg-[#10192d] text-slate-500 border border-[#1b2b48] cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-cyan-500/25 cursor-pointer active:scale-[0.99]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Analyzing Cisco Telemetry...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-300" />
                  <span>⚡ Run AI Diagnostic Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Diagnosis Result Panel */}
        <div className="lg:col-span-6 space-y-4">
          {/* While Analyzing: Progress Stepper */}
          {isAnalyzing && (
            <div className="rounded-2xl bg-[#090f1d] border border-[#15233c] p-7 shadow-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Diagnostic Pipeline Running</h3>
                  <p className="text-xs text-slate-400">Neural Net &amp; Rule Engine inspection in progress</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                {DIAGNOSTIC_STEPS.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-mono transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : isCurrent
                          ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200 shadow-md shadow-cyan-950/50'
                          : 'bg-[#060a14] border-[#142036] text-slate-600'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                      )}
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Idle Placeholder */}
          {!isAnalyzing && !diagnosis && (
            <div className="rounded-2xl bg-[#090f1d] border border-[#15233c] p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-4 min-h-[480px]">
              <div className="w-16 h-16 rounded-2xl bg-[#0e172a] border border-[#1c2c4b] flex items-center justify-center text-slate-500">
                <Terminal className="w-8 h-8 text-cyan-500/60" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-semibold text-white">Awaiting Cisco Output</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select one of the sample presets above or paste your raw CLI output into the terminal on the left to see instant root cause analysis and commands.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-cyan-400/80 font-mono pt-2">
                <span>Select a preset</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Click Analyze</span>
              </div>
            </div>
          )}

          {/* Diagnosis Ready */}
          {!isAnalyzing && diagnosis && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Root Cause Banner */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0d172a] via-[#09101f] to-[#070b16] border border-[#1a2d50] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-medium flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      Confidence: {diagnosis.confidence.toUpperCase()}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-medium flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      {diagnosis.osi_layer || 'Layer 3'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Mode: {diagnosis.mode === 'ai' ? 'LLaMA-3.1 Neural' : 'Deterministic CCIE Rules'}
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-1">
                    Identified Root Cause
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {diagnosis.root_cause}
                  </h3>
                </div>

                {diagnosis.concept && (
                  <div className="text-xs text-slate-300 flex items-center gap-1.5 font-mono pt-1">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Concept: {diagnosis.concept}</span>
                  </div>
                )}
              </div>

              {/* Rule Checker Findings */}
              {diagnosis.checkerFindings && diagnosis.checkerFindings.length > 0 && (
                <div className="rounded-2xl bg-[#090f1d] border border-amber-500/20 p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400 uppercase">
                    <ShieldAlert className="w-4 h-4" />
                    Deterministic Rule Triggers ({diagnosis.checkerFindings.length})
                  </div>
                  <div className="space-y-2">
                    {diagnosis.checkerFindings.map((finding, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-amber-950/15 border border-amber-500/25 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-300">{finding.rule}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono uppercase">
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-slate-300">{finding.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting Evidence */}
              {diagnosis.evidence && diagnosis.evidence.length > 0 && (
                <div className="rounded-2xl bg-[#090f1d] border border-[#15233c] p-5 shadow-xl space-y-3">
                  <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
                    Telemetry Evidence
                  </div>
                  <ul className="space-y-1.5">
                    {diagnosis.evidence.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span className="font-mono text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cisco IOS Remediation Script */}
              {diagnosis.fix_steps && diagnosis.fix_steps.length > 0 && (
                <div className="rounded-2xl bg-[#090f1d] border border-[#15233c] p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold tracking-wider text-emerald-400 uppercase flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cisco IOS Fix Script
                    </div>
                    <button
                      onClick={handleCopyCommands}
                      className="px-2.5 py-1 rounded-lg bg-[#0e172a] hover:bg-[#14223d] border border-[#1b2b48] text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Commands</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#050811] border border-[#162542] p-3.5 font-mono text-xs text-emerald-300 overflow-x-auto space-y-1">
                    {diagnosis.fix_steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="text-slate-600 select-none text-[11px] w-5 text-right">
                          {idx + 1}
                        </span>
                        <span className="text-emerald-200">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Command */}
              {diagnosis.verification_steps && (
                <div className="rounded-2xl bg-[#090f1d] border border-[#15233c] p-5 shadow-xl space-y-2">
                  <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Post-Remediation Verification
                  </div>
                  <div className="rounded-xl bg-[#050811] border border-[#162542] p-3 font-mono text-xs text-cyan-300 flex items-center justify-between">
                    <span>{diagnosis.verification_steps}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTroubleshooter;
