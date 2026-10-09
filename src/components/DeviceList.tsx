import React, { useState, useMemo } from "react";
import { ServerDevice } from "../types";
import { Settings, Plus, Trash2, Edit2, X } from "lucide-react";

interface DeviceListProps {
  servers: ServerDevice[];
  onSelectServer: (server: ServerDevice) => void;
  onOpenAddModal: () => void;
  onDeleteServer: (id: string) => void;
  onRefreshAll: () => void;
  userRole?: "Administrator" | "Operator" | "ReadOnly";
}

export function DeviceList({
  servers,
  onSelectServer,
  onOpenAddModal,
  onDeleteServer,
  onRefreshAll,
  userRole = "Administrator",
}: DeviceListProps) {
  const [activeTab, setActiveTab] = useState<"all" | "discovery">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Column Settings Modal State
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("tyrone_visible_device_table_columns");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      address: true,
      name: false,
      serialNumber: true,
      rack: false,
      weight: false,
      biosInfo: false,
      numCpu: false,
      totalMemory: false,
      power: false,
      size: false,
      deviceType: true,
      model: true,
      mgmtVersion: true,
      mgmtUrl: true,
      chassisLed: true,
    };
  });

  const [viewUnassignedOnly, setViewUnassignedOnly] = useState(false);

  const filteredServers = useMemo(() => {
    return servers.filter((s) => {
      if (viewUnassignedOnly && (s.rackId || s.rackName)) return false;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.ip.includes(q) ||
        s.serialNumber.toLowerCase().includes(q) ||
        s.model.toLowerCase().includes(q)
      );
    });
  }, [servers, viewUnassignedOnly, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredServers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServers.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} selected device(s)?`)) {
      selectedIds.forEach((id) => onDeleteServer(id));
      setSelectedIds([]);
    }
  };

  const emptyRowsCount = Math.max(0, 18 - filteredServers.length);

  return (
    <div className="flex-1 bg-[#F4F6F0] p-4 overflow-y-auto font-sans select-none text-slate-800 space-y-3">

      {/* Top Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-300 pb-0">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 font-semibold text-xs transition-all cursor-pointer border-b-2 ${
            activeTab === "all"
              ? "bg-slate-200 text-slate-900 border-[#2E3A23]"
              : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200"
          }`}
        >
          {viewUnassignedOnly ? "Unassigned Devices" : "All Devices"}
        </button>
        <button
          onClick={() => setActiveTab("discovery")}
          className={`px-4 py-2 font-semibold text-xs transition-all cursor-pointer rounded-t-sm ${
            activeTab === "discovery"
              ? "bg-[#2E3A23] text-white"
              : "bg-[#2E3A23] text-white/90 hover:bg-[#3B4A2D]"
          }`}
        >
          Discovery and Import
        </button>
      </div>

      {/* Device List Header Bar */}
      <div className="bg-[#2E3A23] text-white px-4 py-2.5 rounded-t flex items-center justify-between shadow-xs">
        <h2 className="font-semibold text-xs tracking-wider uppercase">
          {viewUnassignedOnly ? "DEVICES NOT IN HIERARCHY (UNASSIGNED SERVERS)" : "DEVICE LIST"}
        </h2>
        <button
          onClick={() => setIsColumnSettingsOpen(true)}
          className="text-white/80 hover:text-white transition-colors cursor-pointer"
          title="Columns to be showed Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-slate-300 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IP, Model..."
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2E3A23] w-48"
          />
          <button
            onClick={() => {}}
            className="px-3.5 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Search
          </button>
          <button
            onClick={() => setSearchQuery("")}
            className="px-3.5 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={() => {}}
            className="px-3.5 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Advanced
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-600 font-medium">
            Selected Devices: <span className="font-mono text-slate-900">{selectedIds.length}</span>
          </span>
          <span className="text-slate-600 font-medium">
            Total Devices: <span className="font-mono text-slate-900">{filteredServers.length}</span>
          </span>

          <button
            disabled={userRole === "ReadOnly"}
            onClick={onOpenAddModal}
            className={`px-4 py-1.5 font-semibold rounded text-xs transition-colors flex items-center gap-1 shadow-xs ${
              userRole === "ReadOnly"
                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                : "bg-[#2E3A23] hover:bg-[#3B4A2D] text-white cursor-pointer"
            }`}
            title={userRole === "ReadOnly" ? "ReadOnly users cannot add devices" : "Add Device"}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={userRole === "ReadOnly" || selectedIds.length === 0}
            className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold rounded text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
          <button
            disabled={userRole === "ReadOnly" || selectedIds.length !== 1}
            onClick={() => {
              const target = servers.find((s) => s.id === selectedIds[0]);
              if (target) onSelectServer(target);
            }}
            className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold rounded text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
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
                  checked={filteredServers.length > 0 && selectedIds.length === filteredServers.length}
                  onChange={toggleSelectAll}
                  className="accent-[#2E3A23]"
                />
              </th>
              {visibleColumns.name && <th className="p-2 border-r border-slate-300 font-semibold">Name ↑↓</th>}
              {visibleColumns.address && <th className="p-2 border-r border-slate-300 font-semibold">Address ↑↓</th>}
              {visibleColumns.serialNumber && <th className="p-2 border-r border-slate-300 font-semibold">Serial Number</th>}
              {visibleColumns.deviceType && <th className="p-2 border-r border-slate-300 font-semibold">Device Type ↑</th>}
              {visibleColumns.model && <th className="p-2 border-r border-slate-300 font-semibold">Model ↑</th>}
              {visibleColumns.rack && <th className="p-2 border-r border-slate-300 font-semibold">Rack ↑↓</th>}
              {visibleColumns.weight && <th className="p-2 border-r border-slate-300 font-semibold">Weight (kg)</th>}
              {visibleColumns.power && <th className="p-2 border-r border-slate-300 font-semibold">Power (W)</th>}
              {visibleColumns.size && <th className="p-2 border-r border-slate-300 font-semibold">Size (U)</th>}
              {visibleColumns.numCpu && <th className="p-2 border-r border-slate-300 font-semibold">Number of CPU</th>}
              {visibleColumns.totalMemory && <th className="p-2 border-r border-slate-300 font-semibold">Total Memory</th>}
              {visibleColumns.biosInfo && <th className="p-2 border-r border-slate-300 font-semibold">BIOS Information</th>}
              {visibleColumns.mgmtVersion && <th className="p-2 border-r border-slate-300 font-semibold">Mgmt Version</th>}
              {visibleColumns.mgmtUrl && <th className="p-2 border-r border-slate-300 font-semibold">Mgmt URL</th>}
              {visibleColumns.chassisLed && <th className="p-2 border-r border-slate-300 font-semibold">Chassis LED</th>}
              <th className="p-2 border-r border-slate-300 font-semibold">Protocol ↑↓</th>
              <th className="p-2 font-semibold">Capability ↑</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
            {filteredServers.map((srv) => {
              const isChecked = selectedIds.includes(srv.id);
              return (
                <tr key={srv.id} className="hover:bg-slate-100/80 transition-colors border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(srv.id)}
                      className="accent-[#2E3A23]"
                    />
                  </td>
                  {visibleColumns.name && (
                    <td className="p-2 border-r border-slate-300 font-semibold text-slate-900">
                      {srv.name}
                    </td>
                  )}
                  {visibleColumns.address && (
                    <td className="p-2 border-r border-slate-300 font-mono">
                      <button
                        onClick={() => onSelectServer(srv)}
                        className="text-blue-600 hover:underline font-medium text-left cursor-pointer"
                      >
                        {srv.ip}
                      </button>
                    </td>
                  )}
                  {visibleColumns.serialNumber && (
                    <td className="p-2 border-r border-slate-300 font-mono text-slate-700">
                      {srv.serialNumber}
                    </td>
                  )}
                  {visibleColumns.deviceType && (
                    <td className="p-2 border-r border-slate-300">Server</td>
                  )}
                  {visibleColumns.model && (
                    <td className="p-2 border-r border-slate-300 text-slate-700 truncate max-w-[140px]">
                      {srv.model}
                    </td>
                  )}
                  {visibleColumns.rack && (
                    <td className="p-2 border-r border-slate-300 font-mono">Rack</td>
                  )}
                  {visibleColumns.weight && (
                    <td className="p-2 border-r border-slate-300 font-mono">{srv.weightKg} kg</td>
                  )}
                  {visibleColumns.power && (
                    <td className="p-2 border-r border-slate-300 font-mono text-amber-700">{srv.powerW} W</td>
                  )}
                  {visibleColumns.size && (
                    <td className="p-2 border-r border-slate-300 font-mono">{srv.sizeU} U</td>
                  )}
                  {visibleColumns.numCpu && (
                    <td className="p-2 border-r border-slate-300 font-mono">2 Sockets</td>
                  )}
                  {visibleColumns.totalMemory && (
                    <td className="p-2 border-r border-slate-300 font-mono">256 GB ECC</td>
                  )}
                  {visibleColumns.biosInfo && (
                    <td className="p-2 border-r border-slate-300 font-mono">UEFI v3.5b</td>
                  )}
                  {visibleColumns.mgmtVersion && (
                    <td className="p-2 border-r border-slate-300 font-mono text-[#2E3A23]">
                      {srv.mgmtModuleVersion}
                    </td>
                  )}
                  {visibleColumns.mgmtUrl && (
                    <td className="p-2 border-r border-slate-300 font-mono text-blue-600 truncate max-w-[140px]">
                      {srv.mgmtConsoleUrl}
                    </td>
                  )}
                  {visibleColumns.chassisLed && (
                    <td className="p-2 border-r border-slate-300">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-300">
                        {srv.chassisLed}
                      </span>
                    </td>
                  )}
                  <td className="p-2 border-r border-slate-300 font-medium">{srv.protocol}</td>
                  <td className="p-2 text-slate-600 truncate max-w-[220px]">
                    {srv.capabilities.join("; ")}
                  </td>
                </tr>
              );
            })}

            {Array.from({ length: emptyRowsCount }).map((_, idx) => (
              <tr key={`empty-${idx}`} className="h-7 border-b border-slate-200">
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                {visibleColumns.name && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.address && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.serialNumber && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.deviceType && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.model && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.rack && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.weight && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.power && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.size && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.numCpu && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.totalMemory && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.biosInfo && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.mgmtVersion && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.mgmtUrl && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                {visibleColumns.chassisLed && <td className="p-2 border-r border-slate-300">&nbsp;</td>}
                <td className="p-2 border-r border-slate-300">&nbsp;</td>
                <td className="p-2">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Columns Settings Modal (Matching Image 2) */}
      {isColumnSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header: Dark Olive Green */}
            <div className="bg-[#2E3A23] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide">Columns to be showed.</h3>
              <button
                onClick={() => setIsColumnSettingsOpen(false)}
                className="text-slate-200 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs font-semibold text-slate-800">
              {/* Checkboxes Grid in 3 Columns (Matching Image 2) */}
              <div className="grid grid-cols-3 gap-y-4 gap-x-6">
                {[
                  { key: "address", label: "Address" },
                  { key: "name", label: "Name" },
                  { key: "serialNumber", label: "Serial Number" },
                  { key: "rack", label: "Rack" },
                  { key: "weight", label: "Weight (kg)" },
                  { key: "biosInfo", label: "BIOS Information" },
                  { key: "numCpu", label: "Number of CPU" },
                  { key: "totalMemory", label: "Total Memory" },
                  { key: "power", label: "Power (W)" },
                  { key: "size", label: "Size (U)" },
                  { key: "deviceType", label: "Device Type" },
                  { key: "model", label: "Device Model" },
                  { key: "mgmtVersion", label: "Mgmt Version" },
                  { key: "mgmtUrl", label: "Mgmt URL" },
                  { key: "chassisLed", label: "Chassis LED" },
                ].map((col) => (
                  <label key={col.key} className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={!!visibleColumns[col.key]}
                      onChange={(e) => {
                        const updated = { ...visibleColumns, [col.key]: e.target.checked };
                        setVisibleColumns(updated);
                        localStorage.setItem("tyrone_visible_device_table_columns", JSON.stringify(updated));
                      }}
                      className="accent-[#C8102E] w-4 h-4 rounded cursor-pointer"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>

              {/* Action Buttons: Red Save & Light Gray Cancel */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsColumnSettingsOpen(false)}
                  className="px-6 py-2 bg-[#C8102E] hover:bg-red-800 text-white font-bold text-xs rounded-md shadow-xs transition-all cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsColumnSettingsOpen(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-md transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
