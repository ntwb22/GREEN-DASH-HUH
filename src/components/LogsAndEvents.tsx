import React, { useState, useMemo, useEffect } from "react";
import { ServerEvent, SensorReading, FaultLog, ServerDevice } from "../types";
import { Bell, Check, Server, Download, RefreshCw, Search, ShieldCheck, Activity, Radio, Zap } from "lucide-react";
import { fetchRedfishTelemetry, clearTelemetryCache } from "../services/redfishService";

interface LogsAndEventsProps {
  events: ServerEvent[];
  sensors: SensorReading[];
  faults: FaultLog[];
  servers?: ServerDevice[];
  onAcknowledgeEvent: (eventId: string) => void;
}

export function LogsAndEvents({ events: initialEvents, servers = [], onAcknowledgeEvent }: LogsAndEventsProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [serverFilter, setServerFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFetchingLogs, setIsFetchingLogs] = useState<boolean>(false);
  const [customFetchedEvents, setCustomFetchedEvents] = useState<ServerEvent[]>([]);

  // SSE Stream State
  const [sseStatus, setSseStatus] = useState<"connected" | "connecting" | "error">("connecting");
  const [sseEvents, setSseEvents] = useState<ServerEvent[]>([]);
  const [sseCount, setSseCount] = useState<number>(0);
  const [isSimulatingSse, setIsSimulatingSse] = useState<boolean>(false);

  // Initialize persistent SSE (Server-Sent Events) Connection to FastAPI backend
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    const connectSSE = () => {
      // Connect through Vite proxy endpoint /api/events/sse
      const sseUrl = "/api/events/sse";
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setSseStatus("connected");
      };

      eventSource.onmessage = (e) => {
        if (!e.data || e.data.trim().startsWith(":")) return;
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "SSE_INIT") {
            setSseStatus("connected");
            return;
          }

          if (payload.type === "REDFISH_EVENT" || payload.eventType || payload.message) {
            const severityMap: Record<string, "Critical" | "Error" | "Warning" | "Informative"> = {
              Critical: "Critical",
              Error: "Error",
              Warning: "Warning",
              OK: "Informative",
              Informative: "Informative",
            };
            const sev = severityMap[payload.severity] || "Informative";
            const newEv: ServerEvent = {
              id: `sse-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              severity: sev,
              address: payload.ip || payload.serverId || (servers[0]?.ip ?? "172.16.0.130"),
              category: payload.eventType || "Redfish Event",
              type: payload.eventType || "LIVE_SSE",
              description: payload.message || "Live SSE log event received from BMC server stream",
              timestamp: payload.timestamp || new Date().toLocaleTimeString(),
              count: payload.occurrences || 1,
              acknowledged: false,
            };

            setSseEvents((prev) => [newEv, ...prev]);
            setSseCount((c) => c + 1);
          }
        } catch (_err) {
          // Ignore heartbeats or non-JSON comments
        }
      };

      eventSource.onerror = () => {
        setSseStatus("error");
        if (eventSource) {
          eventSource.close();
        }
        // Auto-reconnect with 3s backoff
        reconnectTimer = setTimeout(() => {
          setSseStatus("connecting");
          connectSSE();
        }, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [servers]);

  // Consolidate live SSE events, initial events, auto-generated telemetry, and manual Redfish SEL logs
  const combinedEvents: ServerEvent[] = useMemo(() => {
    const list: ServerEvent[] = [...sseEvents, ...initialEvents, ...customFetchedEvents];

    servers.forEach((srv) => {
      if (!list.some((e) => e.address === srv.ip)) {
        list.push({
          id: `ev-${srv.ip}-auto`,
          severity: "Informative",
          address: srv.ip,
          category: "System Telemetry",
          type: "SERVER_ONLINE",
          description: `Server ${srv.name} (${srv.ip}) is active and transmitting telemetry via ${srv.protocol || "Redfish"}.`,
          timestamp: new Date().toLocaleTimeString(),
          count: 1,
          acknowledged: false,
        });
      }
    });

    // Remove duplicates based on ID
    const uniqueMap = new Map<string, ServerEvent>();
    list.forEach((e) => uniqueMap.set(e.id, e));
    return Array.from(uniqueMap.values());
  }, [sseEvents, initialEvents, customFetchedEvents, servers]);

  const filteredEvents = useMemo(() => {
    return combinedEvents.filter((ev) => {
      const matchesSev = severityFilter === "All" || ev.severity === severityFilter;
      const matchesSrv = serverFilter === "All" || ev.address === serverFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        ev.address.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q) ||
        ev.type.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q);

      return matchesSev && matchesSrv && matchesQuery;
    });
  }, [combinedEvents, severityFilter, serverFilter, searchQuery]);

  const handleFetchRedfishLogs = async () => {
    if (servers.length === 0) {
      alert("No connected servers found to fetch Redfish logs.");
      return;
    }

    setIsFetchingLogs(true);
    clearTelemetryCache();

    try {
      const targets = serverFilter === "All" ? servers : servers.filter((s) => s.ip === serverFilter);

      const promises = targets.map(async (srv) => {
        try {
          const res = await fetchRedfishTelemetry(srv.ip, srv.username || "admin", srv.password, srv);
          return res.events || [];
        } catch (_e) {
          return [];
        }
      });

      const results = await Promise.all(promises);
      const newEvents = results.flat();

      if (newEvents.length > 0) {
        setCustomFetchedEvents((prev) => [...newEvents, ...prev]);
      }
    } finally {
      setIsFetchingLogs(false);
    }
  };

  const handleSimulateSseEvent = async () => {
    setIsSimulatingSse(true);
    try {
      const randomSeverities: Array<"Critical" | "Warning" | "Informative"> = ["Critical", "Warning", "Informative"];
      const randomTypes = ["ThermalThresholdExceeded", "PowerSupplyDegraded", "FanRPMAlert", "MemoryECCWarning", "ChassisIntrusion"];
      const randomMsg = [
        "System thermal margin warning: CPU1 temperature exceeded warning limit",
        "PSU2 voltage fluctuation detected on +12V rail",
        "Chassis Fan 4 RPM dropped below 1500 RPM threshold",
        "Single-bit ECC memory error logged on DIMM slot 3",
        "Server chassis cover intrusion switch state changed to Open"
      ];
      const idx = Math.floor(Math.random() * randomTypes.length);
      const targetServer = servers[Math.floor(Math.random() * servers.length)] || { id: "srv-1", ip: "172.16.0.130" };

      await fetch("/api/redfish/sse/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId: targetServer.id,
          bmcIp: targetServer.ip,
          eventType: randomTypes[idx],
          severity: randomSeverities[idx % randomSeverities.length],
          message: randomMsg[idx]
        })
      });
    } catch (_e) {
      alert("Failed to trigger simulated SSE event log on server.");
    } finally {
      setIsSimulatingSse(false);
    }
  };

  const handleDownloadLogsCsv = () => {
    if (filteredEvents.length === 0) {
      alert("No log events available to export.");
      return;
    }

    const headers = ["Timestamp", "Severity", "Server IP", "Category", "Event Type", "Description", "Status"];
    const rows = filteredEvents.map((ev) => [
      `"${ev.timestamp}"`,
      `"${ev.severity}"`,
      `"${ev.address}"`,
      `"${ev.category}"`,
      `"${ev.type}"`,
      `"${ev.description.replace(/"/g, '""')}"`,
      `"${ev.acknowledged ? "Acknowledged" : "Pending"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Tyrone_Server_Logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-[#F4F6F0] p-4 overflow-y-auto font-sans select-none text-slate-800 space-y-4 pb-8">
      {/* Header Bar with Live SSE Indicator */}
      <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#2E3A23] text-white rounded">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
                System Events & Server Log Telemetry
              </h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1 border border-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-700" /> Redfish SEL & EventLog
              </span>

              {/* Real-time SSE Connection Status Badge */}
              {sseStatus === "connected" ? (
                <span className="px-2.5 py-0.5 bg-emerald-900 text-emerald-200 text-[10px] font-mono font-bold rounded flex items-center gap-1.5 border border-emerald-500 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>SSE Live Stream Active</span>
                  {sseCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-700 text-emerald-100 rounded text-[9px] font-extrabold">
                      +{sseCount} SSE logs
                    </span>
                  )}
                </span>
              ) : sseStatus === "connecting" ? (
                <span className="px-2.5 py-0.5 bg-amber-900 text-amber-200 text-[10px] font-mono font-bold rounded flex items-center gap-1.5 border border-amber-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  </span>
                  <span>Connecting SSE...</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-rose-900 text-rose-200 text-[10px] font-mono font-bold rounded flex items-center gap-1.5 border border-rose-500">
                  <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                  <span>SSE Stream Offline</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Consolidated Redfish server logs from <span className="font-bold text-[#2E3A23] font-mono">{servers.length} Connected Servers</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Server Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded border border-slate-300">
            <Server className="w-3.5 h-3.5 text-[#2E3A23]" />
            <select
              value={serverFilter}
              onChange={(e) => setServerFilter(e.target.value)}
              className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-800 text-xs focus:outline-none"
            >
              <option value="All">All Servers ({servers.length})</option>
              {servers.map((s) => (
                <option key={s.id} value={s.ip}>
                  {s.name} ({s.ip})
                </option>
              ))}
            </select>
          </div>

          {/* Severity Buttons */}
          <div className="flex items-center gap-1">
            {(["All", "Critical", "Error", "Warning", "Informative"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  severityFilter === sev
                    ? "bg-[#2E3A23] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Simulate SSE Event Log Button */}
          <button
            onClick={handleSimulateSseEvent}
            disabled={isSimulatingSse}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white rounded font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Broadcast an out-of-band Redfish event log via SSE Stream to UI subscribers"
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulatingSse ? "animate-spin text-amber-300" : "text-amber-300"}`} />
            <span>Simulate SSE Log</span>
          </button>

          {/* Fetch Redfish Logs Button */}
          <button
            onClick={handleFetchRedfishLogs}
            disabled={isFetchingLogs}
            className="px-3 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] disabled:bg-slate-400 text-white rounded font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Fetch live BMC Redfish SEL and EventLog entries directly from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLogs ? "animate-spin" : ""}`} />
            <span>{isFetchingLogs ? "Fetching Redfish..." : "Fetch Redfish Logs"}</span>
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleDownloadLogsCsv}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 rounded font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#2E3A23]" />
            <span>Export Logs CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Table Container */}
      <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden space-y-0">
        <div className="bg-[#2E3A23] text-white px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Server Event Logs (SSE Enabled)
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search log description, category..."
                className="pl-7 pr-2 py-0.5 bg-[#1F2718] border border-white/20 rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 w-60 font-normal normal-case"
              />
            </div>
          </div>
          <span className="font-mono text-emerald-300">{filteredEvents.length} Logs Displayed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-2.5 border-r border-slate-200">Timestamp</th>
                <th className="p-2.5 border-r border-slate-200">Severity</th>
                <th className="p-2.5 border-r border-slate-200">Server IP</th>
                <th className="p-2.5 border-r border-slate-200">Category / Source</th>
                <th className="p-2.5 border-r border-slate-200">Description</th>
                <th className="p-2.5 text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                    No server logs match current filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const isSseLive = ev.id.startsWith("sse-");
                  return (
                    <tr
                      key={ev.id}
                      className={`transition-colors ${
                        isSseLive ? "bg-emerald-50/70 hover:bg-emerald-100/60 border-l-4 border-l-emerald-500" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-2.5 border-r border-slate-200 font-mono text-slate-500">
                        {ev.timestamp}
                        {isSseLive && (
                          <span className="ml-2 px-1.5 py-0.2 bg-emerald-200 text-emerald-900 text-[9px] font-extrabold rounded font-mono uppercase">
                            LIVE SSE
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            ev.severity === "Critical"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : ev.severity === "Error"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : ev.severity === "Warning"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {ev.severity}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-[#2E3A23]">{ev.address}</td>
                      <td className="p-2.5 border-r border-slate-200 text-slate-600 font-medium">{ev.category}</td>
                      <td className="p-2.5 border-r border-slate-200 text-slate-700">{ev.description}</td>
                      <td className="p-2.5 text-right">
                        {ev.acknowledged ? (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Acknowledged
                          </span>
                        ) : (
                          <button
                            onClick={() => onAcknowledgeEvent(ev.id)}
                            className="px-2.5 py-1 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white rounded font-semibold text-[11px] transition-all cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
