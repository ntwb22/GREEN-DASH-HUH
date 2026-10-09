import React from "react";
import { ServerDevice } from "../types";
import { Layers, Activity, ShieldAlert, Zap, AlertTriangle, Database } from "lucide-react";

interface DeviceStatisticsCardProps {
  servers: ServerDevice[];
}

export function DeviceStatisticsCard({ servers }: DeviceStatisticsCardProps) {
  const total = servers.length;
  // Dynamic calculation based on live server state
  const notInHierarchy = servers.filter((s) => !s.rackId && !s.rackName).length;
  const connectionLost = servers.filter((s) => s.status === "Offline").length;
  const unhealthy = servers.filter((s) => s.status === "Critical" || s.status === "Warning").length;
  const powerOff = servers.filter((s) => s.status === "Offline" || s.chassisLed === "Off").length;
  const failToMonitor = servers.filter((s) => s.status === "Fetching" || s.status === "Critical").length;
  const unmanaged = servers.filter((s) => !s.username || !s.password).length;

  const stats = [
    { label: "NOT IN HIERARCHY", count: notInHierarchy, icon: Layers, color: "text-amber-600" },
    { label: "CONNECTION LOST", count: connectionLost, icon: Activity, color: "text-[#2E3A23]" },
    { label: "UNHEALTHY (ALL)", count: unhealthy, icon: ShieldAlert, color: "text-red-600" },
    { label: "POWER OFF", count: powerOff, icon: Zap, color: "text-[#2E3A23]" },
    { label: "FAIL TO MONITOR", count: failToMonitor, icon: AlertTriangle, color: "text-orange-600" },
    { label: "UNMANAGED", count: unmanaged, icon: Database, color: "text-slate-600" },
  ];

  return (
    <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="bg-slate-200 border-b border-slate-300 px-4 py-2 text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center justify-between">
        <span>DEVICE STATISTICS</span>
        <span className="text-[11px] text-slate-500 font-mono italic">Dynamic Live Metrics</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-xs font-bold text-slate-700 tracking-wide border-b border-slate-100 pb-2">
          TOTAL DEVICES: <span className="font-mono text-[#2E3A23] font-extrabold text-sm">{total}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-center">
          {stats.map((st) => {
            const Icon = st.icon;
            return (
              <div key={st.label} className="flex flex-col items-center space-y-2 group">
                <div className="w-12 h-12 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 shadow-xs group-hover:border-[#2E3A23] transition-colors">
                  <Icon className={`w-5 h-5 ${st.color}`} />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">{st.count}</div>
                <div className="text-[10px] font-bold text-slate-500 tracking-tight uppercase leading-tight max-w-[110px]">
                  {st.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
