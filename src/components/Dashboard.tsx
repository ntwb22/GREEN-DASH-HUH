import React, { useMemo } from "react";
import {
  ServerDevice,
  DataCenterNode,
  InventorySpecs,
  SensorReading,
} from "../types";
import {
  Thermometer,
  Zap,
  Building,
  Home,
  Server,
  Activity,
  Sliders,
  Cpu,
  Box,
  Scale,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

import { DeviceStatisticsCard } from "./DeviceStatisticsCard";

interface DashboardProps {
  servers: ServerDevice[];
  hierarchyData: DataCenterNode[];
  telemetryData: {
    inventory?: InventorySpecs;
    sensors?: SensorReading[];
  } | null;
}

export function Dashboard({ servers, hierarchyData, telemetryData }: DashboardProps) {
  const {
    totalDevicesCount,
    totalProcessorsCount,
    totalSpaceUsed,
    totalWeightUsed,
    totalDcCount,
    totalRoomsCount,
    totalPower,
    maxTemp,
    tempTrendData,
    powerTrendData,
    hotspotsList,
  } = useMemo(() => {
    const totalDevicesCount = servers.length;
    const totalProcessorsCount = servers.length * 2;
    const totalSpaceUsed = servers.reduce((acc, s) => acc + (parseFloat(s.sizeU) || 1), 0);
    const totalWeightUsed = servers.reduce((acc, s) => acc + (parseFloat(s.weightKg) || 18.5), 0);

    const totalDcCount = hierarchyData.length;
    let totalRoomsCount = 0;
    hierarchyData.forEach((dc) => {
      totalRoomsCount += dc.rooms.length;
    });

    const totalPower = servers.reduce((acc, s) => acc + (parseFloat(s.powerW) || 400), 0);
    const maxTemp = servers.length > 0 ? 22.0 + servers.length * 0.5 : 0;

    const timeLabels = ["18:00", "20:00", "22:00", "00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00"];

    const tempTrendData = timeLabels.map((time, idx) => ({
      time,
      temp: maxTemp > 0 ? Math.min(35, maxTemp + Math.sin(idx) * 1.5) : 0,
    }));

    const powerTrendData = timeLabels.map((time, idx) => ({
      time,
      power: totalPower > 0 ? Math.round(totalPower + Math.cos(idx) * 35) : 0,
    }));

    const hotspotsList = servers.map((s, idx) => ({
      name: s.name || s.ip,
      ip: s.ip,
      temp: (22.0 + idx * 1.2).toFixed(1),
    }));

    return {
      totalDevicesCount,
      totalProcessorsCount,
      totalSpaceUsed,
      totalWeightUsed,
      totalDcCount,
      totalRoomsCount,
      totalPower,
      maxTemp,
      tempTrendData,
      powerTrendData,
      hotspotsList,
    };
  }, [servers, hierarchyData]);

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 select-none pb-8">
      {/* Top Banner: Dashboard Telemetry Gadgets */}
      <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#2E3A23]" />
          <h2 className="font-bold text-sm text-slate-900 tracking-wide uppercase">
            Dashboard Telemetry Gadgets
          </h2>
        </div>

        <button className="px-4 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Sliders className="w-3.5 h-3.5" />
          <span>Customize Gadgets</span>
        </button>
      </div>

      {/* Device Statistics Card (Matching Image 1) */}
      <DeviceStatisticsCard servers={servers} />

      {/* Aggregate Overview Metrics Bar: Total Devices | Total Processors | Size Capacity (U) | Weight Capacity (kg) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">TOTAL DEVICES</span>
          <span className="text-2xl font-bold font-mono text-[#2E3A23] block">{totalDevicesCount}</span>
          <Server className="w-4 h-4 text-[#2E3A23] mx-auto mt-1" />
        </div>
        <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">TOTAL PROCESSORS</span>
          <span className="text-2xl font-bold font-mono text-[#2E3A23] block">{totalProcessorsCount}</span>
          <Cpu className="w-4 h-4 text-[#2E3A23] mx-auto mt-1" />
        </div>
        <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">SIZE OCCUPIED (U)</span>
          <span className="text-2xl font-bold font-mono text-slate-900 block">{totalSpaceUsed} U</span>
          <Box className="w-4 h-4 text-slate-700 mx-auto mt-1" />
        </div>
        <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">TOTAL WEIGHT (KG)</span>
          <span className="text-2xl font-bold font-mono text-blue-700 block">{totalWeightUsed.toFixed(1)} kg</span>
          <Scale className="w-4 h-4 text-blue-700 mx-auto mt-1" />
        </div>
      </div>

      {/* Row 1: Temperature | Temperature Trend | Summary of Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Gadget 1: Temperature */}
        <div className="lg:col-span-3 bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="bg-[#2E3A23] text-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase">
            TEMPERATURE
          </div>
          <div className="p-4 flex items-center justify-center gap-4 my-auto">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              <Thermometer className="w-8 h-8 text-[#2E3A23]" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-slate-900 block">
                {maxTemp > 0 ? `${maxTemp.toFixed(1)} °C` : "0.0 °C"}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block">
                Highest Temperature of All Devices
              </span>
            </div>
          </div>
        </div>

        {/* Gadget 2: Temperature Trending in a Day */}
        <div className="lg:col-span-6 bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="bg-[#2E3A23] text-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase flex justify-between items-center">
            <span>TEMPERATURE TRENDING IN A DAY</span>
            <span className="text-[10px] text-emerald-200 font-mono">HIGHEST TEMPERATURE OF ALL DEVICES</span>
          </div>
          <div className="p-3 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempTrendData}>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis domain={[0, 40]} stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="temp" stroke="#2E3A23" strokeWidth={2} dot={{ r: 3, fill: "#2E3A23" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gadget 3: Summary of Hierarchy */}
        <div className="lg:col-span-3 bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="bg-[#2E3A23] text-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase">
            SUMMARY OF HIERARCHY
          </div>
          <div className="p-4 grid grid-cols-3 gap-2 text-center my-auto">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">DC</span>
              <span className="text-xl font-bold font-mono text-slate-900 block">{totalDcCount}</span>
              <Building className="w-5 h-5 text-[#2E3A23] mx-auto mt-1" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">ROOMS</span>
              <span className="text-xl font-bold font-mono text-slate-900 block">{totalRoomsCount}</span>
              <Home className="w-5 h-5 text-[#2E3A23] mx-auto mt-1" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">DEVICES</span>
              <span className="text-xl font-bold font-mono text-slate-900 block">{totalDevicesCount}</span>
              <Server className="w-5 h-5 text-[#2E3A23] mx-auto mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Power Usage Effectiveness (PUE) | Power | Power Usage Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Gadget 4: Power Usage Effectiveness */}
        <div className="lg:col-span-4 bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="bg-[#2E3A23] text-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase">
            POWER USAGE EFFECTIVENESS
          </div>
          <div className="p-4 text-center my-auto space-y-1">
            <div className="w-32 h-16 mx-auto relative flex items-end justify-center border-b-2 border-slate-300 pb-1">
              <span className="text-2xl font-bold font-mono text-emerald-700">2.00</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              PUE OF LAST 24 HOURS
            </span>
          </div>
        </div>

        {/* Gadget 5: Power */}
        <div className="lg:col-span-3 bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="bg-[#2E3A23] text-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase">
            POWER
          </div>
          <div className="p-4 flex items-center justify-center gap-4 my-auto">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
              <Zap className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-slate-900 block">
                {totalPower} W
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                IT EQUIPMENT POWER
              </span>
            </div>
          </div>
        </div>

        {/* Gadget 6: Power Usage in Graph Form */}
        <div className="lg:col-span-5 bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="bg-[#2E3A23] text-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase flex justify-between items-center">
            <span>POWER USAGE IN GRAPH FORM</span>
            <span className="text-[10px] text-amber-300 font-mono">POWER (WATTS)</span>
          </div>
          <div className="p-3 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerTrendData}>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis domain={[0, 'auto']} stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="power" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Hotspots List */}
      <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
        <div className="bg-[#2E3A23] text-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase flex items-center justify-between">
          <span>HOTSPOTS</span>
          <span className="text-[10px] text-emerald-200">HIGHEST TEMPERATURE OF ALL DEVICES LIST</span>
        </div>
        <div className="p-3 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-2 border-r border-slate-200">Name</th>
                <th className="p-2 border-r border-slate-200">IP</th>
                <th className="p-2">Temperature (°C)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {hotspotsList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-slate-400 italic">
                    No devices in system.
                  </td>
                </tr>
              ) : (
                hotspotsList.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 font-semibold text-[#2E3A23]">{h.name}</td>
                    <td className="p-2 border-r border-slate-200 font-mono">{h.ip}</td>
                    <td className="p-2 font-mono font-bold text-amber-700">{h.temp} °C</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
