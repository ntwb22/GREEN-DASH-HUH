import React, { useState } from "react";
import { Cpu, Search, Plus, SlidersHorizontal, RefreshCw, CheckCircle2 } from "lucide-react";
import { ServerDevice } from "../types";

interface GpuViewProps {
  servers?: ServerDevice[];
}

export function GpuView({ servers = [] }: GpuViewProps) {
  const [activeTab, setActiveTab] = useState<
    "GPU List" | "GPU Task" | "Analysis" | "Anomaly Detection" | "GPU Errors"
  >("GPU List");

  const [searchQuery, setSearchQuery] = useState("");
  const [unhealthyOnly, setUnhealthyOnly] = useState(false);
  const [selectedGpuIds, setSelectedGpuIds] = useState<string[]>([]);

  // Generate GPU list per server
  const gpuList = (servers.length > 0 ? servers : [
    { id: "s1", name: "Tyrone Primary Server", ip: "172.16.12.50", serialNumber: "SN-172161250" },
    { id: "s2", name: "Tyrone Primary Server", ip: "172.16.12.250", serialNumber: "SN-1721612250" },
    { id: "s3", name: "Tyrone Primary Server", ip: "172.16.12.200", serialNumber: "SN-1721612200" },
    { id: "s4", name: "Tyrone Primary Server", ip: "172.16.12.150", serialNumber: "SN-1721612150" },
  ]).flatMap((srv, index) => {
    const models = ["NVIDIA A100-SXM4-80GB", "NVIDIA H100-PCIe-80GB", "NVIDIA L40S 48GB", "NVIDIA RTX 6000 Ada"];
    const modelName = models[index % models.length];
    const serialClean = srv.serialNumber ? srv.serialNumber.replace(/\./g, "") : `SN-${srv.ip}`;

    return [
      {
        id: `gpu-${srv.ip}-0`,
        uuid: `GPU-UUID-A100-${srv.ip.split(".").pop()}-01`,
        productName: modelName,
        firmwareVersion: "95.00.41.00.01",
        serialNumber: `${serialClean}-GPU1`,
        serverIp: srv.ip,
        serverName: srv.name || `Server (${srv.ip})`,
        rack: "Rack 1",
        licenseState: "Valid License",
        health: "Optimal",
        vram: "80 GB HBM3",
        temp: "42°C",
        utilization: "68%",
      },
      {
        id: `gpu-${srv.ip}-1`,
        uuid: `GPU-UUID-A100-${srv.ip.split(".").pop()}-02`,
        productName: modelName,
        firmwareVersion: "95.00.41.00.01",
        serialNumber: `${serialClean}-GPU2`,
        serverIp: srv.ip,
        serverName: srv.name || `Server (${srv.ip})`,
        rack: "Rack 1",
        licenseState: "Valid License",
        health: "Optimal",
        vram: "80 GB HBM3",
        temp: "44°C",
        utilization: "72%",
      },
    ];
  });

  const filteredGpus = gpuList.filter((g) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      g.uuid.toLowerCase().includes(q) ||
      g.productName.toLowerCase().includes(q) ||
      g.serialNumber.toLowerCase().includes(q) ||
      g.serverIp.includes(q);
    const matchesHealth = !unhealthyOnly || g.health !== "Optimal";
    return matchesSearch && matchesHealth;
  });

  const toggleSelectAll = () => {
    if (selectedGpuIds.length === filteredGpus.length) {
      setSelectedGpuIds([]);
    } else {
      setSelectedGpuIds(filteredGpus.map((g) => g.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedGpuIds.includes(id)) {
      setSelectedGpuIds(selectedGpuIds.filter((i) => i !== id));
    } else {
      setSelectedGpuIds([...selectedGpuIds, id]);
    }
  };

  const emptyRowsCount = Math.max(0, 14 - filteredGpus.length);

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 select-none pb-8">
      {/* Top Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-300 pb-0 text-xs font-semibold">
        {(["GPU List", "GPU Task", "Analysis", "Anomaly Detection", "GPU Errors"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-md transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-[#2E3A23] text-white shadow-xs"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-slate-300 p-2.5 rounded-t-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GPU UUID, Product Name, Serial..."
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2E3A23] w-56"
          />
          <button className="px-3.5 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded text-xs transition-colors cursor-pointer">
            Search
          </button>
          <button
            onClick={() => setSearchQuery("")}
            className="px-3.5 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Clear
          </button>
          <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={unhealthyOnly}
              onChange={(e) => setUnhealthyOnly(e.target.checked)}
              className="accent-[#2E3A23]"
            />
            <span>Unhealthy GPU only</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-600 font-medium">
            Selected: <span className="font-mono text-slate-900">{selectedGpuIds.length}</span>
          </span>
          <span className="text-slate-600 font-medium">
            Total GPUs: <span className="font-mono text-slate-900">{gpuList.length}</span>
          </span>
          <button className="px-4 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Grid Data Table */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-[#D9E1E8] text-slate-800 font-semibold text-[11px] border-b border-slate-300">
              <th className="p-2 border-r border-slate-300 w-8 text-center">
                <input
                  type="checkbox"
                  checked={filteredGpus.length > 0 && selectedGpuIds.length === filteredGpus.length}
                  onChange={toggleSelectAll}
                  className="accent-[#2E3A23]"
                />
              </th>
              <th className="p-2 border-r border-slate-300 font-semibold">UUID ↑↓</th>
              <th className="p-2 border-r border-slate-300 font-semibold">Product Name ↑↓</th>
              <th className="p-2 border-r border-slate-300 font-semibold">Firmware Version ↑↓</th>
              <th className="p-2 border-r border-slate-300 font-semibold">Serial Number ↑↓</th>
              <th className="p-2 border-r border-slate-300 font-semibold">Server ↑↓</th>
              <th className="p-2 border-r border-slate-300 font-semibold">Rack ↑↓</th>
              <th className="p-2 border-r border-slate-300 font-semibold">VRAM / Temp / Util</th>
              <th className="p-2 border-r border-slate-300 font-semibold">License State ↑↓</th>
              <th className="p-2 font-semibold">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
            {filteredGpus.map((gpu) => (
              <tr key={gpu.id} className="hover:bg-slate-100/80 transition-colors border-b border-slate-200">
                <td className="p-2 border-r border-slate-300 text-center">
                  <input
                    type="checkbox"
                    checked={selectedGpuIds.includes(gpu.id)}
                    onChange={() => toggleSelect(gpu.id)}
                    className="accent-[#2E3A23]"
                  />
                </td>
                <td className="p-2 border-r border-slate-300 font-mono text-[#2E3A23] font-semibold truncate max-w-[140px]">
                  {gpu.uuid}
                </td>
                <td className="p-2 border-r border-slate-300 font-bold text-slate-900">
                  {gpu.productName}
                </td>
                <td className="p-2 border-r border-slate-300 font-mono text-slate-600">
                  {gpu.firmwareVersion}
                </td>
                <td className="p-2 border-r border-slate-300 font-mono text-slate-700">
                  {gpu.serialNumber}
                </td>
                <td className="p-2 border-r border-slate-300 font-mono text-blue-600 font-semibold">
                  {gpu.serverIp}
                </td>
                <td className="p-2 border-r border-slate-300 font-mono">
                  {gpu.rack}
                </td>
                <td className="p-2 border-r border-slate-300 font-mono text-[11px]">
                  <span className="text-purple-700 font-bold">{gpu.vram}</span> • <span className="text-amber-700">{gpu.temp}</span> • <span className="text-emerald-700 font-bold">{gpu.utilization}</span>
                </td>
                <td className="p-2 border-r border-slate-300 font-semibold text-emerald-700">
                  {gpu.licenseState}
                </td>
                <td className="p-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-max">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{gpu.health}</span>
                  </span>
                </td>
              </tr>
            ))}

            {Array.from({ length: emptyRowsCount }).map((_, idx) => (
              <tr key={`empty-${idx}`} className="h-7 border-b border-slate-200">
                <td className="p-2 border-r border-slate-300 text-center">&nbsp;</td>
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                <td className="p-2">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
