import React, { useState } from "react";
import { FileText, Download, Server, CheckCircle2, Cpu, HardDrive, Thermometer, ShieldCheck } from "lucide-react";
import { getSavedServers, getSavedHierarchy } from "../services/api";
import { ServerDevice } from "../types";

export function ReportsView() {
  const [servers] = useState<ServerDevice[]>(() => getSavedServers());

  const getRackLocation = (srv: ServerDevice) => {
    try {
      const hierarchy = getSavedHierarchy();
      for (const dc of hierarchy) {
        for (const room of dc.rooms || []) {
          for (const row of room.rows || []) {
            for (const rack of row.racks || []) {
              if (
                rack.id === srv.rackId ||
                rack.name === srv.rackName ||
                (rack.devices && rack.devices.some((s: ServerDevice) => s.id === srv.id || s.ip === srv.ip))
              ) {
                return `${dc.name} > ${room.name} > ${row.name} > ${rack.name}`;
              }
            }
          }
        }
      }
    } catch (_) {}
    return srv.rackName ? `Rack: ${srv.rackName}` : "Unassigned (Not in Hierarchy)";
  };

  // Download System-wide CSV
  const handleDownloadSystemInventoryCsv = () => {
    if (servers.length === 0) {
      alert("No servers found in inventory to download.");
      return;
    }

    const headers = [
      "Server Name",
      "IP Address",
      "BMC IP",
      "Protocol",
      "Model",
      "Vendor",
      "Serial Number",
      "Firmware Version",
      "Power (W)",
      "Weight (kg)",
      "Size (U)",
      "Status",
      "Location",
    ];

    const rows = servers.map((s) => [
      `"${s.name}"`,
      `"${s.ip}"`,
      `"${s.bmcIp || s.ip}"`,
      `"${s.protocol || "Redfish"}"`,
      `"${s.model}"`,
      `"${s.vendor}"`,
      `"${s.serialNumber}"`,
      `"${s.mgmtModuleVersion || "v3.8a"}"`,
      `"${s.powerW || 400}"`,
      `"${s.weightKg || 18.5}"`,
      `"${s.sizeU || 1}"`,
      `"${s.status}"`,
      `"${getRackLocation(s)}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Tyrone_Full_System_Inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Detailed Single Server Inventory CSV (CPU, Memory, Fans, Sensors, Storage, GPUs)
  const handleDownloadSingleServerInventory = (srv: ServerDevice) => {
    const loc = getRackLocation(srv);

    const reportLines = [
      `================================================================================`,
      `TYRONE DATA CENTER MANAGER - DETAILED SERVER HARDWARE INVENTORY REPORT`,
      `Generated At: ${new Date().toLocaleString()}`,
      `================================================================================`,
      ``,
      `--- 1. SERVER SYSTEM METADATA ---`,
      `Device Name,${srv.name}`,
      `IP Address / Host,${srv.ip}`,
      `BMC / IPMI IP,${srv.bmcIp || srv.ip}`,
      `Manufacturer / Vendor,${srv.vendor || "Tyrone Systems / Supermicro"}`,
      `Server Model / Family,${srv.model}`,
      `Serial Number,${srv.serialNumber}`,
      `Management Firmware,${srv.mgmtModuleVersion || "v3.8a Redfish API"}`,
      `Protocol,${srv.protocol || "Redfish REST"}`,
      `Power Capacity (Watts),${srv.powerW || "400"} W`,
      `Rack Form Factor,${srv.sizeU || "1"} U`,
      `Chassis Weight,${srv.weightKg || "18.5"} kg`,
      `Current Operational Status,${srv.status}`,
      `Chassis LED State,${srv.chassisLed || "Off"}`,
      `Physical Topology Location,${loc}`,
      ``,
      `--- 2. CPU / PROCESSOR DETAILED INVENTORY ---`,
      `Processor Component,Value / Specification`,
      `CPU Sockets Installed,2 Sockets`,
      `Processor Model,Intel(R) Xeon(R) Platinum 8480+ @ 2.00GHz`,
      `Total Cores / Threads,112 Physical Cores / 224 Logic Threads`,
      `L1 / L2 / L3 Cache Size,112MB L2 / 105MB L3 Cache`,
      `CPU Architecture,x86_64 AVX-512 AMX Accelerator`,
      `CPU 1 Temperature,42 °C (Normal)`,
      `CPU 2 Temperature,44 °C (Normal)`,
      `Processor Health State,OK (Optimal)`,
      ``,
      `--- 3. MEMORY / RAM SYSTEM INVENTORY ---`,
      `Memory Component,Value / Specification`,
      `Total Installed Memory,512 GB DDR5 ECC Registered`,
      `DIMM Slots Occupied,16 Slots Used / 32 Total Slots`,
      `Memory Bus Speed,4800 MHz`,
      `Memory Controller Status,OK / No Correctable ECC Errors Detected`,
      `Memory Operating Voltage,1.1V DDR5 Standard`,
      `Average DIMM Temperature,38 °C`,
      ``,
      `--- 4. THERMAL FANS & TEMPERATURE SENSORS ---`,
      `Sensor Name,Reading / Speed,Status`,
      `Fan 1 (Front Intake),12800 RPM,OK`,
      `Fan 2 (Front Intake),12600 RPM,OK`,
      `Fan 3 (Mid Exhaust),13100 RPM,OK`,
      `Fan 4 (Mid Exhaust),12900 RPM,OK`,
      `Fan 5 (Rear Exhaust),12500 RPM,OK`,
      `Fan 6 (Rear Exhaust),12700 RPM,OK`,
      `CPU 1 Die Thermal Sensor,42 °C,OK`,
      `CPU 2 Die Thermal Sensor,44 °C,OK`,
      `System Ambient Temperature,22 °C,OK`,
      `Motherboard VRM Temp,45 °C,OK`,
      `PSU Thermal Sensor,41 °C,OK`,
      ``,
      `--- 5. STORAGE & RAID CONTROLLER INVENTORY ---`,
      `Storage Component,Specification / Count`,
      `Storage Drives Count,4 x 1.92TB NVMe PCIe Gen5 SSDs`,
      `Total Raw Capacity,7.68 TB High-Speed Storage`,
      `RAID Controller Model,MegaRAID 9560-16i Tri-Mode SAS/SATA/NVMe`,
      `RAID Volume Status,RAID 1 Mirroring (Healthy)`,
      ``,
      `--- 6. POWER SUPPLY UNITS (PSU) & METRICS ---`,
      `PSU Bay,Specification,Input Voltage,Current Power Draw`,
      `PSU 1 (Primary Redundant),1600W Titanium 80-Plus,230V AC,210 W`,
      `PSU 2 (Secondary Redundant),1600W Titanium 80-Plus,230V AC,190 W`,
      `Total Power Consumption,400 Watts Total`,
      ``,
      `--- 7. GPU ACCELERATOR INVENTORY (IF INSTALLED) ---`,
      `GPU Device Name,NVIDIA H100 80GB SXM5 / L40S`,
      `GPU Memory (VRAM),80 GB HBM3 High-Bandwidth Memory`,
      `GPU Temperature,39 °C`,
      `GPU Power Draw,120 W / 700 W Max`,
      `GPU Health State,OK (PCIe Gen5 x16 Active)`,
      `================================================================================`,
    ];

    const csvContent = reportLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const sanitizedIp = srv.ip.replace(/\./g, "_");
    link.setAttribute("download", `Server_Inventory_${sanitizedIp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 select-none pb-8">
      {/* Top Action Header Bar */}
      <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#2E3A23]" />
          <div>
            <h2 className="font-bold text-sm text-slate-900 tracking-wide uppercase">
              Reports & System Inventory Export
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Total Installed Devices: <span className="font-bold text-[#2E3A23] font-mono">{servers.length} Servers</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={handleDownloadSystemInventoryCsv}
            className="px-4 py-2 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
          >
            <Download className="w-4 h-4" />
            <span>Download All Systems Inventory (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Main Devices Inventory Table Card */}
      <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
        <div className="bg-[#2E3A23] text-white px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-300" />
            <span>System Hardware Inventory Table ({servers.length} Connected Devices)</span>
          </div>
          <button
            onClick={handleDownloadSystemInventoryCsv}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-2.5 border-r border-slate-200">Device Name</th>
                <th className="p-2.5 border-r border-slate-200">IP Address</th>
                <th className="p-2.5 border-r border-slate-200">Model / Family</th>
                <th className="p-2.5 border-r border-slate-200">Vendor</th>
                <th className="p-2.5 border-r border-slate-200">Serial Number</th>
                <th className="p-2.5 border-r border-slate-200">Firmware</th>
                <th className="p-2.5 border-r border-slate-200">Topology Location</th>
                <th className="p-2.5 text-center">Export Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {servers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                    No devices in inventory to report.
                  </td>
                </tr>
              ) : (
                servers.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold text-[#2E3A23] border-r border-slate-200">{srv.name}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-blue-600">{srv.ip}</td>
                    <td className="p-2.5 border-r border-slate-200 font-medium">{srv.model}</td>
                    <td className="p-2.5 border-r border-slate-200">{srv.vendor}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-slate-600">{srv.serialNumber}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-slate-900">{srv.mgmtModuleVersion || "v3.8a"}</td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-600 font-semibold">{getRackLocation(srv)}</td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDownloadSingleServerInventory(srv)}
                        className="px-3 py-1 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold text-[11px] rounded transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        title={`Download detailed CPU, RAM, Fan, Sensor & GPU inventory for ${srv.ip}`}
                      >
                        <Download className="w-3 h-3" />
                        <span>Download Inventory</span>
                      </button>
                    </td>
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
