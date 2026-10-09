import React, { useState, useEffect, useMemo } from "react";
import { X, Server, RefreshCw, ArrowLeft, ShieldCheck, AlertTriangle, Plus, Check } from "lucide-react";
import { ServerDevice } from "../types";
import { fetchRedfishTelemetry } from "../services/redfishService";
import { saveServers, getSavedHierarchy } from "../services/api";

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddServer: (server: ServerDevice, telemetry?: any) => void;
  availableRacks?: string[];
  activeRack?: string;
  servers?: ServerDevice[];
  onSelectServer?: (server: ServerDevice) => void;
}

function findServerLocationStr(server: ServerDevice): string {
  try {
    const hierarchy = getSavedHierarchy();
    for (const dc of hierarchy) {
      for (const room of dc.rooms || []) {
        for (const row of room.rows || []) {
          for (const rack of row.racks || []) {
            if (
              rack.id === server.rackId ||
              rack.name === server.rackName ||
              (rack.devices && rack.devices.some((s: ServerDevice) => s.id === server.id || s.ip === server.ip))
            ) {
              return `Location: [ Data Center: ${dc.name} | Room: ${room.name} | Row: ${row.name} | Rack: ${rack.name} ]`;
            }
          }
        }
      }
    }
  } catch (_) {}
  if (server.rackName) return `Location: [ Rack: ${server.rackName} ]`;
  return "Location: Unassigned (Devices not in Hierarchy)";
}

export function AddServerModal({
  isOpen,
  onClose,
  onAddServer,
  availableRacks = ["Rack 1"],
  activeRack = "Rack 1",
  servers = [],
  onSelectServer,
}: AddServerModalProps) {
  const [activeModalTab, setActiveModalTab] = useState<"add_form" | "devices_list">("add_form");
  const [name, setName] = useState("Tyrone Server Node");
  const [ip, setIp] = useState("172.16.12.50");
  const [serialNumber, setSerialNumber] = useState("");
  const [deviceType, setDeviceType] = useState("Server");

  // Dynamically extract ONLY racks that exist in the physical hierarchy
  const dynamicExistingRacks = useMemo(() => {
    try {
      const hierarchy = getSavedHierarchy();
      const rackList = hierarchy
        .flatMap((dc) => dc.rooms || [])
        .flatMap((rm) => rm.rows || [])
        .flatMap((rw) => rw.racks || [])
        .map((rk) => rk.name)
        .filter((rName, idx, arr) => rName && arr.indexOf(rName) === idx);

      return rackList;
    } catch (_) {}
    return [];
  }, [isOpen]);

  const [selectedRack, setSelectedRack] = useState(() => {
    return dynamicExistingRacks[0] || "";
  });

  useEffect(() => {
    if (dynamicExistingRacks.length > 0 && (!selectedRack || !dynamicExistingRacks.includes(selectedRack))) {
      setSelectedRack(dynamicExistingRacks[0]);
    } else if (dynamicExistingRacks.length === 0) {
      setSelectedRack("");
    }
  }, [dynamicExistingRacks]);
  const [protocol, setProtocol] = useState<"IPMI" | "SSH" | "WMI" | "Redfish">("Redfish");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [powerW, setPowerW] = useState("400");
  const [sizeU, setSizeU] = useState("1");
  const [weightKg, setWeightKg] = useState("15");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedIp = ip.trim();
    const trimmedSerial = serialNumber.trim();

    if (!trimmedIp) {
      setError("Please enter the IP Address for IPMI / BMC.");
      return;
    }

    // Check for duplicate server IP or BMC IP with exact location readout
    const existingIp = servers.find((s) => s.ip === trimmedIp || s.bmcIp === trimmedIp);
    if (existingIp) {
      const loc = findServerLocationStr(existingIp);
      setError(`Duplicate Server Warning: A device with IP Address ${trimmedIp} ("${existingIp.name}") already exists in the system. ${loc}`);
      return;
    }

    // Check for duplicate Serial Number with exact location readout
    if (trimmedSerial) {
      const existingSerial = servers.find((s) => s.serialNumber && s.serialNumber.toLowerCase() === trimmedSerial.toLowerCase());
      if (existingSerial) {
        const loc = findServerLocationStr(existingSerial);
        setError(`Duplicate Server Warning: A device with Serial Number "${trimmedSerial}" ("${existingSerial.name}" - ${existingSerial.ip}) already exists in the system. ${loc}`);
        return;
      }
    }

    if (!username.trim()) {
      setError("Please enter the BMC Username.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await fetchRedfishTelemetry(trimmedIp, username.trim(), password, {
        name: name.trim() || `Tyrone Server ${trimmedIp}`,
        serialNumber: serialNumber.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
        powerW: powerW.trim() || "400",
        sizeU: sizeU.trim() || "1",
        weightKg: weightKg.trim() || "15",
        protocol: protocol === "Redfish" ? "Redfish" : "IPMI",
      });

      setIsSubmitting(false);
      onAddServer({ ...result.server, rackName: selectedRack }, result);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Authentication Denied: Failed to connect to BMC Redfish API.");
    }
  };

  const filteredModalServers = servers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.ip.includes(q) ||
      s.serialNumber.toLowerCase().includes(q) ||
      s.model.toLowerCase().includes(q) ||
      (s.rackName && s.rackName.toLowerCase().includes(q))
    );
  });

  const toggleSelectAllModal = () => {
    if (selectedDeviceIds.length === filteredModalServers.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredModalServers.map((s) => s.id));
    }
  };

  const toggleSelectModal = (id: string) => {
    if (selectedDeviceIds.includes(id)) {
      setSelectedDeviceIds(selectedDeviceIds.filter((i) => i !== id));
    } else {
      setSelectedDeviceIds([...selectedDeviceIds, id]);
    }
  };

  const handleAddSelectedIntoRack = () => {
    if (selectedDeviceIds.length === 0) return;
    if (!selectedRack) {
      alert("No target rack available. Please create a Rack in the Data Center Hierarchy first before assigning devices.");
      return;
    }

    // Update rackName for selected devices
    const updatedServers = servers.map((srv) => {
      if (selectedDeviceIds.includes(srv.id)) {
        return { ...srv, rackName: selectedRack };
      }
      return srv;
    });

    saveServers(updatedServers);
    alert(`Successfully added ${selectedDeviceIds.length} device(s) into ${selectedRack}!`);
    setSelectedDeviceIds([]);
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Dark Olive Green Banner Header */}
        <div className="px-6 py-3 bg-[#2E3A23] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#2E3A23] bg-white rounded-full p-1 font-bold text-xs">
              +
            </span>
            <h3 className="font-semibold text-sm tracking-wide">
              {activeModalTab === "add_form"
                ? "Add New Device & Fetch Redfish Telemetry"
                : "Registered Devices List"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Navigation Tabs Bar matching User Screenshot (Image 7) */}
        <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveModalTab("devices_list")}
              className={`px-3.5 py-1.5 font-semibold rounded-md transition-colors cursor-pointer border ${
                activeModalTab === "devices_list"
                  ? "bg-[#2E3A23] text-white border-[#2E3A23] shadow-xs"
                  : "bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300"
              }`}
            >
              Devices not in Hierarchy
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab("add_form")}
              className={`px-3.5 py-1.5 font-semibold rounded-md transition-colors cursor-pointer border ${
                activeModalTab === "add_form"
                  ? "bg-[#2E3A23] text-white border-[#2E3A23] shadow-xs font-bold"
                  : "bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300"
              }`}
            >
              Add New Device
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveModalTab("devices_list")}
            className="text-[#2E3A23] font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Devices not in Hierarchy</span>
          </button>
        </div>

        {/* TAB 1: ADD NEW DEVICE FORM */}
        {activeModalTab === "add_form" ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-md text-red-700 font-medium flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Server Addition Denied</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-[#2E3A23] uppercase tracking-wider text-xs flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#2E3A23]" />
                  <span>DEVICE INFORMATION</span>
                </span>
                <span className="text-[11px] text-slate-500 font-normal">* Indicates Required Fields</span>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-4 font-semibold text-slate-700 text-right pr-2">Name *</label>
                <div className="col-span-8">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tyrone Primary Node"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-4 font-semibold text-slate-700 text-right pr-2">
                  IP Address for IPMI / BMC *
                </label>
                <div className="col-span-8">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 172.16.12.50"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-4 font-semibold text-slate-700 text-right pr-2">
                  BMC Username & Password *
                </label>
                <div className="col-span-8 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                  />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-4 font-semibold text-slate-700 text-right pr-2">
                  Device Capacities *
                </label>
                <div className="col-span-8 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Power (W)</span>
                    <input
                      type="text"
                      value={powerW}
                      onChange={(e) => setPowerW(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Space (U)</span>
                    <input
                      type="text"
                      value={sizeU}
                      onChange={(e) => setSizeU(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Weight (kg)</span>
                    <input
                      type="text"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Back to Devices List button matching Image 7 */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveModalTab("devices_list")}
                className="text-[#2E3A23] font-semibold hover:underline flex items-center gap-1 text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#2E3A23]" />
                <span>Back to Devices list</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded-md transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials & Fetching Redfish...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>+ Verify Credentials & Fetch Telemetry</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* TAB 2: DEVICES LIST VIEW WITH CHECKBOXES & SELECT ALL */
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Devices by IP, Model, Serial..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveModalTab("add_form")}
                className="px-4 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded-md text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>+ Add New Device</span>
              </button>
            </div>

            <div className="bg-white border border-slate-300 rounded-md overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#2E3A23] text-white font-semibold text-[11px]">
                    <th className="p-2.5">IP Address</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Model</th>
                    <th className="p-2.5">Serial Number</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Rack Location</th>
                    <th className="p-2.5 text-center w-16">
                      <div className="flex items-center justify-center gap-1 cursor-pointer" onClick={toggleSelectAllModal}>
                        <input
                          type="checkbox"
                          checked={filteredModalServers.length > 0 && selectedDeviceIds.length === filteredModalServers.length}
                          onChange={toggleSelectAllModal}
                          className="accent-white w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[10px] uppercase font-bold text-emerald-200">All</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {filteredModalServers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 space-y-2">
                        <p className="font-semibold text-xs text-slate-700">
                          {searchQuery
                            ? `No devices found matching "${searchQuery}".`
                            : "No registered devices in console memory."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveModalTab("add_form")}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-bold text-xs rounded transition-colors shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add New Device Now</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredModalServers.map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-mono text-[#2E3A23] font-bold">{srv.ip}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{srv.name}</td>
                        <td className="p-2.5 text-slate-700">{srv.model}</td>
                        <td className="p-2.5 font-mono text-slate-600">{srv.serialNumber}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {srv.status}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {srv.rackName ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">
                              Rack: {srv.rackName}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedDeviceIds.includes(srv.id)}
                            onChange={() => toggleSelectModal(srv.id)}
                            className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Batch Add Selected Devices to Rack Footer */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-700">Target Rack:</span>
                <select
                  value={selectedRack}
                  onChange={(e) => setSelectedRack(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-xs text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                >
                  {dynamicExistingRacks.length === 0 ? (
                    <option value="">No Racks Exist in Hierarchy</option>
                  ) : (
                    dynamicExistingRacks.map((rk) => (
                      <option key={rk} value={rk}>
                        {rk}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-600 font-medium mr-2">
                  Selected: <span className="font-mono font-bold text-slate-900">{selectedDeviceIds.length}</span> / {filteredModalServers.length}
                </span>

                <button
                  type="button"
                  disabled={selectedDeviceIds.length === 0}
                  onClick={handleAddSelectedIntoRack}
                  className="px-4 py-2 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-bold text-xs rounded-md transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Selected Devices into {selectedRack} ({selectedDeviceIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
