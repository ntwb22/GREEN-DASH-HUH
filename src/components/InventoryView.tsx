import React, { useState } from "react";
import { InventorySpecs, ServerDevice } from "../types";
import { RefreshCw, ChevronRight } from "lucide-react";

interface InventoryViewProps {
  server: ServerDevice;
  inventory: InventorySpecs;
  onRefresh?: () => void;
}

export function InventoryView({ server, inventory, onRefresh }: InventoryViewProps) {
  const [selectedSubsystem, setSelectedSubsystem] = useState<
    "Processor" | "Memory" | "Storage" | "Firmware" | "Virtual Media" | "Host NIC" | "Fan" | "Peripheral"
  >("Processor");

  const [selectedCpuIndex, setSelectedCpuIndex] = useState<number>(0);
  const [selectedDimmIndex, setSelectedDimmIndex] = useState<number>(0);
  const [selectedDriveIndex, setSelectedDriveIndex] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const subsystems = [
    { id: "Processor", label: "Processor" },
    { id: "Memory", label: "Memory" },
    { id: "Storage", label: "Storage" },
    { id: "Firmware", label: "Firmware" },
    { id: "Virtual Media", label: "Virtual Media" },
    { id: "Host NIC", label: "Host NIC" },
    { id: "Fan", label: "Fan" },
    { id: "Peripheral", label: "Peripheral" },
  ] as const;

  // CPU details
  const cpusCount = inventory.processor.count || 2;
  const cpus = Array.from({ length: cpusCount }, (_, i) => ({
    name: `CPU ${i + 1}`,
    model: inventory.processor.model || "Intel(R) Xeon(R) Silver 4416+",
    architecture: inventory.processor.architecture || "x86-64",
    family: inventory.processor.family || "Intel(R) Xeon(R) Scalable",
    manufacturer: inventory.processor.manufacturer || "Intel(R) Corporation",
    maxFrequency: `${inventory.processor.maxFrequencyMHz || 4200} MHz`,
    type: "CPU",
    serialNumber: inventory.processor.serialNumber || `CPU${i + 1}-10`,
    totalCores: inventory.processor.totalCores || 20,
    totalThreads: inventory.processor.totalThreads || 40,
  }));

  const activeCpu = cpus[selectedCpuIndex] || cpus[0];

  return (
    <div className="flex-1 bg-[#F8F9FA] p-4 overflow-y-auto font-sans select-none text-slate-800 space-y-4">
      {/* Top Banner Header (Matching User Screenshot) */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 text-base">Inventory Information</h2>
        <button
          onClick={handleRefreshClick}
          className="px-3.5 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded-md text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid Layout (Matching User Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Subsystem Navigation Tree (Matching Screenshot) */}
        <div className="lg:col-span-3 bg-slate-100/90 border border-slate-200 rounded-lg p-3 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 px-3 py-1 mb-1">Subsystem 1</div>
          {subsystems.map((sub) => {
            const isSelected = selectedSubsystem === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubsystem(sub.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#2E3A23] text-white shadow-xs font-bold"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{sub.label}</span>
                {isSelected && <ChevronRight className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>

        {/* Right Detail Card (Matching Screenshot Table Style) */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          {/* Subsystem 1: PROCESSOR */}
          {selectedSubsystem === "Processor" && (
            <div className="space-y-4">
              {/* CPU Selection Buttons */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                {cpus.map((cpu, idx) => (
                  <button
                    key={cpu.name}
                    onClick={() => setSelectedCpuIndex(idx)}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                      selectedCpuIndex === idx
                        ? "bg-[#2E3A23] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {cpu.name}
                  </button>
                ))}
              </div>

              {/* Specs Rows (Matching Screenshot Table Dividers) */}
              <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Model</span>
                  <span className="font-semibold text-slate-900 font-sans">{activeCpu.model}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Architecture</span>
                  <span className="font-mono font-semibold text-slate-900">{activeCpu.architecture}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Processor Family</span>
                  <span className="font-semibold text-slate-900">{activeCpu.family}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Manufacturer</span>
                  <span className="font-semibold text-slate-900">{activeCpu.manufacturer}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Max Frequency (MHz)</span>
                  <span className="font-mono font-semibold text-slate-900">{activeCpu.maxFrequency}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Type</span>
                  <span className="font-semibold text-slate-900">{activeCpu.type}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Serial Number</span>
                  <span className="font-mono font-semibold text-slate-900">{activeCpu.serialNumber}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Total Cores</span>
                  <span className="font-mono font-semibold text-slate-900">{activeCpu.totalCores}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Total Threads</span>
                  <span className="font-mono font-semibold text-slate-900">{activeCpu.totalThreads}</span>
                </div>
              </div>
            </div>
          )}

          {/* Subsystem 2: MEMORY */}
          {selectedSubsystem === "Memory" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                {inventory.memory.dimms.slice(0, 8).map((dimm, idx) => (
                  <button
                    key={dimm.slot}
                    onClick={() => setSelectedDimmIndex(idx)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      selectedDimmIndex === idx
                        ? "bg-[#2E3A23] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {dimm.slot}
                  </button>
                ))}
              </div>

              {inventory.memory.dimms[selectedDimmIndex] && (
                <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Slot Name</span>
                    <span className="font-bold text-[#2E3A23]">{inventory.memory.dimms[selectedDimmIndex].slot}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Capacity</span>
                    <span className="font-mono font-bold text-slate-900">{inventory.memory.dimms[selectedDimmIndex].sizeGiB} GB</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Speed</span>
                    <span className="font-mono font-bold text-slate-900">{inventory.memory.dimms[selectedDimmIndex].speedMHz} MHz</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Type</span>
                    <span className="font-semibold text-slate-900">{inventory.memory.dimms[selectedDimmIndex].type}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Manufacturer</span>
                    <span className="font-semibold text-slate-900">{inventory.memory.dimms[selectedDimmIndex].manufacturer}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Part Number</span>
                    <span className="font-mono text-slate-600">{inventory.memory.dimms[selectedDimmIndex].partNumber}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Serial Number</span>
                    <span className="font-mono text-slate-900 font-semibold">{inventory.memory.dimms[selectedDimmIndex].serialNumber}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subsystem 3: STORAGE */}
          {selectedSubsystem === "Storage" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                {inventory.storage.drives.map((drv, idx) => (
                  <button
                    key={drv.id}
                    onClick={() => setSelectedDriveIndex(idx)}
                    className={`px-3.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      selectedDriveIndex === idx
                        ? "bg-[#2E3A23] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {drv.id}
                  </button>
                ))}
              </div>

              {inventory.storage.drives[selectedDriveIndex] && (
                <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Drive ID</span>
                    <span className="font-bold text-[#2E3A23]">{inventory.storage.drives[selectedDriveIndex].id}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Model Name</span>
                    <span className="font-semibold text-slate-900">{inventory.storage.drives[selectedDriveIndex].model}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Capacity</span>
                    <span className="font-mono font-bold text-slate-900">{inventory.storage.drives[selectedDriveIndex].capacityGB} GB</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Media Type</span>
                    <span className="font-semibold text-slate-900">{inventory.storage.drives[selectedDriveIndex].mediaType}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Interface</span>
                    <span className="font-mono font-semibold text-slate-900">{inventory.storage.drives[selectedDriveIndex].interface}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Serial Number</span>
                    <span className="font-mono font-semibold text-slate-900">{inventory.storage.drives[selectedDriveIndex].serialNumber}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subsystem 4: FIRMWARE */}
          {selectedSubsystem === "Firmware" && (
            <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">BIOS Version</span>
                <span className="font-mono font-semibold text-slate-900">{server.mgmtModuleVersion}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">BMC Redfish Firmware</span>
                <span className="font-mono font-semibold text-slate-900">v1.8.0-Tyrone-BMC</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Build Date</span>
                <span className="font-mono text-slate-600">2026-08-20</span>
              </div>
            </div>
          )}

          {/* Subsystem 5: VIRTUAL MEDIA */}
          {selectedSubsystem === "Virtual Media" && (
            <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Virtual Drive Status</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Ready</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Mounted Image</span>
                <span className="font-mono text-slate-500">None</span>
              </div>
            </div>
          )}

          {/* Subsystem 6: HOST NIC */}
          {selectedSubsystem === "Host NIC" && (
            <div className="space-y-2 text-xs font-medium">
              {inventory.hostNic.nics.map((nic) => (
                <div key={nic.name} className="p-3 border border-slate-200 rounded-md flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#2E3A23] block">{nic.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">MAC: {nic.macAddress}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">{nic.speed}</span>
                    <span className="text-[10px] font-bold text-emerald-600">{nic.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subsystem 7: FAN */}
          {selectedSubsystem === "Fan" && (
            <div className="space-y-2 text-xs font-medium">
              {inventory.fan.fans.map((fan) => (
                <div key={fan.name} className="p-3 border border-slate-200 rounded-md flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#2E3A23] block">{fan.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">SN: {fan.serialNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">{fan.currentRPM} RPM</span>
                    <span className="text-[10px] font-bold text-emerald-600">{fan.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subsystem 8: PERIPHERAL */}
          {selectedSubsystem === "Peripheral" && (
            <div className="space-y-2 text-xs font-medium">
              {inventory.aoc?.cards.map((card) => (
                <div key={card.slot} className="p-3 border border-slate-200 rounded-md flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#2E3A23] block">{card.slot}: {card.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">Vendor: {card.vendor} | SN: {card.serialNumber}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{card.pcieWidth}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
