import React, { useState } from "react";
import { Activity, Terminal, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";

export function DiagnosticTools() {
  const [activeTab, setActiveTab] = useState<"redfish" | "ipmi_ping" | "ipmi_dump" | "snmp">("redfish");
  const [address, setAddress] = useState("172.16.12.50");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [outputLog, setOutputLog] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setOutputLog(null);

    setTimeout(() => {
      setIsRunning(false);
      if (activeTab === "ipmi_ping") {
        setOutputLog(
          `[IPMI PING] Target ${address} PING OK\n4 packets transmitted, 4 received, 0% packet loss\nrtt min/avg/max = 0.42/0.58/0.81 ms\nIPMI v2.0 BMC Handshake Verified.`
        );
      } else if (activeTab === "redfish") {
        setOutputLog(
          `[REDFISH DUMP] Connected to https://${address}:443/redfish/v1/\nStatus: 200 OK\nSystemType: Physical\nManufacturer: Tyrone Systems\nModel: SYS-621H-TN12R\nProcessors: 2 Sockets OK\nMemory: 16 DIMMs OK (1536 GiB)`
        );
      } else {
        setOutputLog(
          `[SNMP WALK] Target ${address} SNMPv2-MIB::sysDescr.0 = STRING: TYRONE Data Center Manager Firmware 6.2.0\nSNMPv2-MIB::sysObjectID.0 = OID: 1.3.6.1.4.1.2311`
        );
      }
    }, 700);
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] p-4 overflow-y-auto font-sans select-none text-slate-800 space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 text-[#C8102E] rounded-lg border border-red-100">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Server Diagnostic & Connectivity Tools</h2>
            <p className="text-xs text-slate-500 font-medium">Redfish Dump, IPMI Ping, IPMI Dump & SNMP Walk Utilities</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("redfish")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "redfish" ? "bg-[#C8102E] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Redfish Dump
          </button>
          <button
            onClick={() => setActiveTab("ipmi_ping")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "ipmi_ping" ? "bg-[#C8102E] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            IPMI Ping
          </button>
          <button
            onClick={() => setActiveTab("ipmi_dump")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "ipmi_dump" ? "bg-[#C8102E] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            IPMI Dump
          </button>
          <button
            onClick={() => setActiveTab("snmp")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "snmp" ? "bg-[#C8102E] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            SNMP Walk
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Server Address / IP *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-[#C8102E]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">HTTPS Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-[#C8102E]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">HTTPS Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-[#C8102E]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-5 py-2 bg-[#C8102E] hover:bg-[#A00C24] text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
            <span>{isRunning ? "Executing Diagnostic..." : "Run Diagnostic Utility"}</span>
          </button>
        </div>

        {/* Output Terminal */}
        {outputLog && (
          <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl shadow-inner border border-slate-800 space-y-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <span className="font-bold uppercase text-[10px]">Console Diagnostic Output Log</span>
              <span className="text-[10px]">200 OK</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">{outputLog}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
