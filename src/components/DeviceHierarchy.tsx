import React, { useState, useEffect } from "react";
import {
  ServerDevice,
  InventorySpecs,
  HealthStatusItem,
  FaultLog,
  SensorReading,
  ServerEvent,
  DataCenterNode,
  RoomNode,
  RowNode,
  RackNode,
} from "../types";
import { DeviceStatisticsCard } from "./DeviceStatisticsCard";
import { ProvisioningModal } from "./ProvisioningModal";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Server,
  Box,
  CheckCircle2,
  ExternalLink,
  Building,
  Home,
  Layers,
  Zap,
  HardDrive,
  Maximize2,
  Sliders,
  Settings,
  X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getSavedHierarchy, saveHierarchy } from "../services/api";

interface DeviceHierarchyProps {
  servers: ServerDevice[];
  selectedServer: ServerDevice | null;
  onSelectServer: (server: ServerDevice) => void;
  telemetryData: {
    inventory: InventorySpecs;
    health: HealthStatusItem[];
    faults: FaultLog[];
    sensors: SensorReading[];
    events: ServerEvent[];
  } | null;
  onRefreshTelemetry: () => void;
  onToggleChassisLed: (led: "Off" | "On" | "Blinking") => void;
  onPowerAction: (action: "POWER_ON" | "POWER_OFF" | "REBOOT") => void;
  onAcknowledgeEvent: (eventId: string) => void;
  onOpenAddDeviceModal: (rackName?: string) => void;
  onDeleteDevice: (deviceId: string) => void;
  userRole?: "Administrator" | "Operator" | "ReadOnly";
}

export function DeviceHierarchy({
  servers,
  selectedServer,
  onSelectServer,
  telemetryData,
  onRefreshTelemetry,
  onToggleChassisLed,
  onPowerAction,
  onAcknowledgeEvent,
  onOpenAddDeviceModal,
  onDeleteDevice,
  userRole = "Administrator",
}: DeviceHierarchyProps) {
  // Sub-tabs: HIERARCHY | LAYOUT | CAPACITY
  const [activeSubTab, setActiveSubTab] = useState<"HIERARCHY" | "LAYOUT" | "CAPACITY">("HIERARCHY");

  // Detailed Inventory Sub-tab: CPU | MEMORY | FANS | NETWORK | FIRMWARE | SENSORS
  const [inventoryTab, setInventoryTab] = useState<"CPU" | "MEMORY" | "FANS" | "NETWORK" | "FIRMWARE" | "SENSORS">("CPU");

  // Track if current click is a Container Node (DC, Room, Row, Rack) vs an explicit Device/Server click
  const [activeSelectionType, setActiveSelectionType] = useState<"CONTAINER" | "DEVICE">("CONTAINER");

  // Provisioning Modal State
  const [isProvisioningOpen, setIsProvisioningOpen] = useState(false);

  // Column Settings Modal State
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    return {
      address: true,
      name: false,
      serialNumber: true,
      chassisLed: true,
      deviceType: true,
      model: true,
      rack: false,
      power: false,
      size: false,
      weight: false,
      numCpu: false,
      totalMemory: false,
      biosInfo: false,
      mgmtVersion: true,
      mgmtUrl: true,
    };
  });

  // Hierarchy Data State
  const [dataCenters, setDataCenters] = useState<DataCenterNode[]>(() => {
    return getSavedHierarchy();
  });

  // Selections
  const [selectedDcId, setSelectedDcId] = useState<string | null>(() => {
    const list = getSavedHierarchy();
    return list.length > 0 ? list[0].id : null;
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);

  // Expanded nodes state for Layout Tree Graph
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    all: true,
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  useEffect(() => {
    saveHierarchy(dataCenters);
  }, [dataCenters]);

  // Modal State for Add & Edit
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | null>(null);
  const [targetLevel, setTargetLevel] = useState<"DC" | "ROOM" | "ROW" | "RACK" | "DEVICE" | null>(null);

  // Form Fields
  const [itemName, setItemName] = useState("");
  const [rackPower, setRackPower] = useState("5000");
  const [rackSpace, setRackSpace] = useState("42");
  const [rackWeight, setRackWeight] = useState("800");

  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeDc = dataCenters.find((d) => d.id === selectedDcId) || null;
  const availableRooms = activeDc ? activeDc.rooms : [];

  const activeRoom = availableRooms.find((r) => r.id === selectedRoomId) || null;
  const availableRows = activeRoom ? activeRoom.rows : [];

  const activeRow = availableRows.find((rw) => rw.id === selectedRowId) || null;
  const availableRacks = activeRow ? activeRow.racks : [];

  const activeRack = availableRacks.find((rk) => rk.id === selectedRackId) || null;

  const rackServers = servers.filter((srv) => {
    if (!activeRack) return false;
    if (srv.rackId) return srv.rackId === activeRack.id;
    if (srv.rackName) return srv.rackName === activeRack.name;
    if (activeRack.devices?.some((d) => d.id === srv.id)) return true;
    return false;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshTelemetry();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenAdd = (level: "DC" | "ROOM" | "ROW" | "RACK" | "DEVICE") => {
    if (userRole === "ReadOnly") {
      alert("ReadOnly users cannot add infrastructure resources or servers.");
      return;
    }
    if (level === "DEVICE") {
      onOpenAddDeviceModal(activeRack?.name || "Default Rack");
      return;
    }
    setModalMode("ADD");
    setTargetLevel(level);
    setItemName("");
    setRackPower("5000");
    setRackSpace("42");
    setRackWeight("800");
  };

  const handleOpenEdit = (level: "DC" | "ROOM" | "ROW" | "RACK" | "DEVICE") => {
    if (userRole === "ReadOnly") {
      alert("ReadOnly users cannot edit infrastructure resources.");
      return;
    }
    if (level === "DC" && activeDc) {
      setItemName(activeDc.name);
    } else if (level === "ROOM" && activeRoom) {
      setItemName(activeRoom.name);
    } else if (level === "ROW" && activeRow) {
      setItemName(activeRow.name);
    } else if (level === "RACK" && activeRack) {
      setItemName(activeRack.name);
      setRackPower(String(activeRack.powerCapacityW || 5000));
      setRackSpace(String(activeRack.spaceCapacityU || 42));
      setRackWeight(String(activeRack.weightCapacityKg || 800));
    } else {
      return;
    }
    setModalMode("EDIT");
    setTargetLevel(level);
  };

  const handleDeleteNode = (level: "DC" | "ROOM" | "ROW" | "RACK" | "DEVICE") => {
    if (userRole === "ReadOnly") {
      alert("ReadOnly users cannot delete infrastructure resources.");
      return;
    }
    if (level === "DC" && activeDc) {
      if (!confirm(`Are you sure you want to delete Data Center "${activeDc.name}"?`)) return;
      const updated = dataCenters.filter((dc) => dc.id !== activeDc.id);
      setDataCenters(updated);
      setSelectedDcId(updated.length > 0 ? updated[0].id : null);
      setSelectedRoomId(null);
      setSelectedRowId(null);
      setSelectedRackId(null);
    } else if (level === "ROOM" && activeDc && activeRoom) {
      if (!confirm(`Are you sure you want to delete Room "${activeRoom.name}"?`)) return;
      const updated = dataCenters.map((dc) => {
        if (dc.id !== activeDc.id) return dc;
        return { ...dc, rooms: dc.rooms.filter((rm) => rm.id !== activeRoom.id) };
      });
      setDataCenters(updated);
      setSelectedRoomId(null);
      setSelectedRowId(null);
      setSelectedRackId(null);
    } else if (level === "ROW" && activeDc && activeRoom && activeRow) {
      if (!confirm(`Are you sure you want to delete Row "${activeRow.name}"?`)) return;
      const updated = dataCenters.map((dc) => {
        if (dc.id !== activeDc.id) return dc;
        return {
          ...dc,
          rooms: dc.rooms.map((rm) => {
            if (rm.id !== activeRoom.id) return rm;
            return { ...rm, rows: rm.rows.filter((rw) => rw.id !== activeRow.id) };
          }),
        };
      });
      setDataCenters(updated);
      setSelectedRowId(null);
      setSelectedRackId(null);
    } else if (level === "RACK" && activeDc && activeRoom && activeRow && activeRack) {
      if (!confirm(`Are you sure you want to delete Rack "${activeRack.name}"?`)) return;
      const updated = dataCenters.map((dc) => {
        if (dc.id !== activeDc.id) return dc;
        return {
          ...dc,
          rooms: dc.rooms.map((rm) => {
            if (rm.id !== activeRoom.id) return rm;
            return {
              ...rm,
              rows: rm.rows.map((rw) => {
                if (rw.id !== activeRow.id) return rw;
                return { ...rw, racks: rw.racks.filter((rk) => rk.id !== activeRack.id) };
              }),
            };
          }),
        };
      });
      setDataCenters(updated);
      setSelectedRackId(null);
    } else if (level === "DEVICE" && selectedServer) {
      if (!confirm(`Delete device ${selectedServer.name} (${selectedServer.ip})?`)) return;
      onDeleteDevice(selectedServer.id);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !targetLevel) return;
    const name = itemName.trim();

    if (modalMode === "ADD") {
      if (targetLevel === "DC") {
        const newDc: DataCenterNode = { id: `dc-${Date.now()}`, name, rooms: [] };
        const updated = [...dataCenters, newDc];
        setDataCenters(updated);
        setSelectedDcId(newDc.id);
        setSelectedRoomId(null);
        setSelectedRowId(null);
        setSelectedRackId(null);
      } else if (targetLevel === "ROOM" && activeDc) {
        const newRoom: RoomNode = { id: `rm-${Date.now()}`, name, rows: [] };
        const updated = dataCenters.map((dc) =>
          dc.id === activeDc.id ? { ...dc, rooms: [...dc.rooms, newRoom] } : dc
        );
        setDataCenters(updated);
        setSelectedRoomId(newRoom.id);
        setSelectedRowId(null);
        setSelectedRackId(null);
      } else if (targetLevel === "ROW" && activeDc && activeRoom) {
        const newRow: RowNode = { id: `rw-${Date.now()}`, name, racks: [] };
        const updated = dataCenters.map((dc) => {
          if (dc.id !== activeDc.id) return dc;
          return {
            ...dc,
            rooms: dc.rooms.map((rm) =>
              rm.id === activeRoom.id ? { ...rm, rows: [...rm.rows, newRow] } : rm
            ),
          };
        });
        setDataCenters(updated);
        setSelectedRowId(newRow.id);
        setSelectedRackId(null);
      } else if (targetLevel === "RACK" && activeDc && activeRoom && activeRow) {
        const newRack: RackNode = {
          id: `rk-${Date.now()}`,
          name,
          powerCapacityW: parseFloat(rackPower) || 5000,
          spaceCapacityU: parseInt(rackSpace) || 42,
          weightCapacityKg: parseFloat(rackWeight) || 800,
          devices: [],
        };
        const updated = dataCenters.map((dc) => {
          if (dc.id !== activeDc.id) return dc;
          return {
            ...dc,
            rooms: dc.rooms.map((rm) => {
              if (rm.id !== activeRoom.id) return rm;
              return {
                ...rm,
                rows: rm.rows.map((rw) =>
                  rw.id === activeRow.id ? { ...rw, racks: [...rw.racks, newRack] } : rw
                ),
              };
            }),
          };
        });
        setDataCenters(updated);
        setSelectedRackId(newRack.id);
      }
    } else if (modalMode === "EDIT") {
      if (targetLevel === "DC" && activeDc) {
        const updated = dataCenters.map((dc) => (dc.id === activeDc.id ? { ...dc, name } : dc));
        setDataCenters(updated);
      } else if (targetLevel === "ROOM" && activeDc && activeRoom) {
        const updated = dataCenters.map((dc) => {
          if (dc.id !== activeDc.id) return dc;
          return {
            ...dc,
            rooms: dc.rooms.map((rm) => (rm.id === activeRoom.id ? { ...rm, name } : rm)),
          };
        });
        setDataCenters(updated);
      } else if (targetLevel === "ROW" && activeDc && activeRoom && activeRow) {
        const updated = dataCenters.map((dc) => {
          if (dc.id !== activeDc.id) return dc;
          return {
            ...dc,
            rooms: dc.rooms.map((rm) => {
              if (rm.id !== activeRoom.id) return rm;
              return {
                ...rm,
                rows: rm.rows.map((rw) => (rw.id === activeRow.id ? { ...rw, name } : rw)),
              };
            }),
          };
        });
        setDataCenters(updated);
      } else if (targetLevel === "RACK" && activeDc && activeRoom && activeRow && activeRack) {
        const updated = dataCenters.map((dc) => {
          if (dc.id !== activeDc.id) return dc;
          return {
            ...dc,
            rooms: dc.rooms.map((rm) => {
              if (rm.id !== activeRoom.id) return rm;
              return {
                ...rm,
                rows: rm.rows.map((rw) => {
                  if (rw.id !== activeRow.id) return rw;
                  return {
                    ...rw,
                    racks: rw.racks.map((rk) =>
                      rk.id === activeRack.id
                        ? {
                            ...rk,
                            name,
                            powerCapacityW: parseFloat(rackPower) || 5000,
                            spaceCapacityU: parseInt(rackSpace) || 42,
                            weightCapacityKg: parseFloat(rackWeight) || 800,
                          }
                        : rk
                    ),
                  };
                }),
              };
            }),
          };
        });
        setDataCenters(updated);
      }
    }

    setModalMode(null);
    setTargetLevel(null);
  };

  // Capacity Stats Calculations
  let totalDcCount = dataCenters.length;
  let totalRoomsCount = 0;
  let totalRowsCount = 0;
  let totalRacksCount = 0;
  let totalRackPowerCap = 0;
  let totalRackSpaceCap = 0;
  let totalRackWeightCap = 0;

  const rackBreakdownList: Array<{
    dcName: string;
    roomName: string;
    rowName: string;
    rackName: string;
    devicesCount: number;
    powerUsed: number;
    powerCap: number;
    spaceUsed: number;
    spaceCap: number;
    weightUsed: number;
    weightCap: number;
  }> = [];

  dataCenters.forEach((dc) => {
    totalRoomsCount += dc.rooms.length;
    dc.rooms.forEach((rm) => {
      totalRowsCount += rm.rows.length;
      rm.rows.forEach((rw) => {
        totalRacksCount += rw.racks.length;
        rw.racks.forEach((rk) => {
          const powerCap = rk.powerCapacityW || 5000;
          const spaceCap = rk.spaceCapacityU || 42;
          const weightCap = rk.weightCapacityKg || 800;

          totalRackPowerCap += powerCap;
          totalRackSpaceCap += spaceCap;
          totalRackWeightCap += weightCap;

          rackBreakdownList.push({
            dcName: dc.name,
            roomName: rm.name,
            rowName: rw.name,
            rackName: rk.name,
            devicesCount: servers.length,
            powerUsed: servers.reduce((acc, s) => acc + (parseFloat(s.powerW) || 400), 0),
            powerCap,
            spaceUsed: servers.reduce((acc, s) => acc + (parseFloat(s.sizeU) || 1), 0),
            spaceCap,
            weightUsed: servers.reduce((acc, s) => acc + (parseFloat(s.weightKg) || 15), 0),
            weightCap,
          });
        });
      });
    });
  });

  const totalUsedPower = servers.reduce((acc, s) => acc + (parseFloat(s.powerW) || 400), 0);
  const totalUsedSpace = servers.reduce((acc, s) => acc + (parseFloat(s.sizeU) || 1), 0);
  const totalUsedWeight = servers.reduce((acc, s) => acc + (parseFloat(s.weightKg) || 15), 0);

  const activeContainerInfo = activeRack
    ? { level: "RACK", name: activeRack.name, powerCap: activeRack.powerCapacityW || 5000, spaceCap: activeRack.spaceCapacityU || 42, weightCap: activeRack.weightCapacityKg || 800 }
    : activeRow
    ? { level: "ROW", name: activeRow.name, powerCap: (activeRow.racks.length || 1) * 5000, spaceCap: (activeRow.racks.length || 1) * 42, weightCap: (activeRow.racks.length || 1) * 800 }
    : activeRoom
    ? { level: "ROOM", name: activeRoom.name, powerCap: (activeRoom.rows.length || 1) * 15000, spaceCap: (activeRoom.rows.length || 1) * 126, weightCap: (activeRoom.rows.length || 1) * 2400 }
    : activeDc
    ? { level: "DATA CENTER", name: activeDc.name, powerCap: (activeDc.rooms.length || 1) * 45000, spaceCap: (activeDc.rooms.length || 1) * 378, weightCap: (activeDc.rooms.length || 1) * 7200 }
    : null;

  const pieData = telemetryData
    ? [
        { name: "Host NICs", value: telemetryData.inventory.hostNic.count || 4, color: "#F59E0B" },
        { name: "Memory DIMMs", value: telemetryData.inventory.memory.dimmCount || 16, color: "#3B82F6" },
        { name: "Processors", value: telemetryData.inventory.processor.count || 2, color: "#8B5CF6" },
        { name: "Storage Drives", value: telemetryData.inventory.storage.driveCount || 4, color: "#10B981" },
        { name: "Thermal Fans", value: telemetryData.inventory.fan.count || 6, color: "#2E3A23" },
      ]
    : [];

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 select-none pb-8">
      {/* 1. Sub-Tabs Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSubTab("HIERARCHY")}
          className={`px-4 py-1.5 font-bold text-xs tracking-wider rounded-t-md transition-all cursor-pointer ${
            activeSubTab === "HIERARCHY"
              ? "bg-[#2E3A23] text-white shadow-sm"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          HIERARCHY
        </button>
        <button
          onClick={() => setActiveSubTab("LAYOUT")}
          className={`px-4 py-1.5 font-bold text-xs tracking-wider rounded-t-md transition-all cursor-pointer ${
            activeSubTab === "LAYOUT"
              ? "bg-[#2E3A23] text-white shadow-sm"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          LAYOUT
        </button>
        <button
          onClick={() => setActiveSubTab("CAPACITY")}
          className={`px-4 py-1.5 font-bold text-xs tracking-wider rounded-t-md transition-all cursor-pointer ${
            activeSubTab === "CAPACITY"
              ? "bg-[#2E3A23] text-white shadow-sm"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          CAPACITY
        </button>
      </div>

      {/* ----------------- SUB-TAB 1: HIERARCHY MATRIX ----------------- */}
      {activeSubTab === "HIERARCHY" && (
        <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
          {/* Banner Header */}
          <div className="bg-[#2E3A23] text-white px-4 py-2 flex items-center justify-between">
            <h2 className="font-bold text-xs tracking-wider uppercase">Hierarchy Navigation Matrix</h2>

            {/* Breadcrumbs on Top Right */}
            <div className="font-mono font-semibold text-xs flex items-center gap-1.5 text-emerald-300">
              <span>{activeDc?.name || "DC"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
              <span>{activeRoom?.name || "ROOM"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
              <span>{activeRow?.name || "ROW"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
              <span>{activeRack?.name || "RACK"}</span>
            </div>
          </div>

          {/* 5 Column Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/70 min-h-[150px]">
            {/* Column 1: Data Center */}
            <div className="flex flex-col">
              <div className="px-3 py-2 bg-slate-200/90 border-b border-slate-300 flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>1. Data Center</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenAdd("DC")}
                    title="Add Data Center"
                    className="p-1 text-slate-700 hover:text-[#2E3A23] hover:bg-slate-300 rounded transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={!selectedDcId}
                    onClick={() => handleOpenEdit("DC")}
                    title="Edit Data Center Name"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedDcId ? "text-slate-600 hover:text-slate-900" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    disabled={!selectedDcId}
                    onClick={() => handleDeleteNode("DC")}
                    title="Delete Data Center"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedDcId ? "text-slate-600 hover:text-red-600" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-48">
                {dataCenters.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic p-3 text-center">
                    No Data Centers. Click + to add.
                  </div>
                ) : (
                  dataCenters.map((dc) => {
                    const isSelected = dc.id === selectedDcId;
                    return (
                      <button
                        key={dc.id}
                        onClick={() => {
                          setSelectedDcId(dc.id);
                          setSelectedRoomId(null);
                          setSelectedRowId(null);
                          setSelectedRackId(null);
                          setActiveSelectionType("CONTAINER");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2E3A23] text-white shadow-xs font-semibold"
                            : "bg-white text-slate-800 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        <span>{dc.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 2: Room */}
            <div className="flex flex-col">
              <div className="px-3 py-2 bg-slate-200/90 border-b border-slate-300 flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>2. Room</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!selectedDcId}
                    onClick={() => selectedDcId && handleOpenAdd("ROOM")}
                    title={selectedDcId ? "Add Room" : "Select Data Center first"}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedDcId ? "text-slate-700 hover:text-[#2E3A23] hover:bg-slate-300" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={!selectedRoomId}
                    onClick={() => handleOpenEdit("ROOM")}
                    title="Edit Room Name"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedRoomId ? "text-slate-600 hover:text-slate-900" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    disabled={!selectedRoomId}
                    onClick={() => handleDeleteNode("ROOM")}
                    title="Delete Room"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedRoomId ? "text-slate-600 hover:text-red-600" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-48">
                {!selectedDcId ? (
                  <div className="text-[11px] text-slate-400 italic p-3 text-center">
                    Select a Data Center first
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic p-3 text-center">
                    No Rooms. Click + to add.
                  </div>
                ) : (
                  availableRooms.map((rm) => {
                    const isSelected = rm.id === selectedRoomId;
                    return (
                      <button
                        key={rm.id}
                        onClick={() => {
                          setSelectedRoomId(rm.id);
                          setSelectedRowId(null);
                          setSelectedRackId(null);
                          setActiveSelectionType("CONTAINER");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2E3A23] text-white shadow-xs font-semibold"
                            : "bg-white text-slate-800 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        <span>{rm.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Row */}
            <div className="flex flex-col">
              <div className="px-3 py-2 bg-slate-200/90 border-b border-slate-300 flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>3. Row</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!selectedRoomId}
                    onClick={() => selectedRoomId && handleOpenAdd("ROW")}
                    title={selectedRoomId ? "Add Row" : "Select Room first"}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedRoomId ? "text-slate-700 hover:text-[#2E3A23] hover:bg-slate-300" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={!selectedRowId}
                    onClick={() => handleOpenEdit("ROW")}
                    title="Edit Row Name"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedRowId ? "text-slate-600 hover:text-slate-900" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    disabled={!selectedRowId}
                    onClick={() => handleDeleteNode("ROW")}
                    title="Delete Row"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedRowId ? "text-slate-600 hover:text-red-600" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-48">
                {!selectedRoomId ? (
                  <div className="text-[11px] text-slate-400 italic p-3 text-center">
                    Select a Room first
                  </div>
                ) : availableRows.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic p-3 text-center">
                    No Rows. Click + to add.
                  </div>
                ) : (
                  availableRows.map((rw) => {
                    const isSelected = rw.id === selectedRowId;
                    return (
                      <button
                        key={rw.id}
                        onClick={() => {
                          setSelectedRowId(rw.id);
                          setSelectedRackId(null);
                          setActiveSelectionType("CONTAINER");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2E3A23] text-white shadow-xs font-semibold"
                            : "bg-white text-slate-800 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        <span>{rw.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 4: Rack */}
            <div className="flex flex-col">
              <div className="px-3 py-2 bg-slate-200/90 border-b border-slate-300 flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>4. Rack</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!selectedRowId}
                    onClick={() => selectedRowId && handleOpenAdd("RACK")}
                    title={selectedRowId ? "Add Rack with Name, Power, Space & Weight" : "Select Row first"}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedRowId ? "text-slate-700 hover:text-[#2E3A23] hover:bg-slate-300" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={!selectedRackId}
                    onClick={() => handleOpenEdit("RACK")}
                    title="Edit Rack Details"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedRackId ? "text-slate-600 hover:text-slate-900" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    disabled={!selectedRackId}
                    onClick={() => handleDeleteNode("RACK")}
                    title="Delete Rack"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedRackId ? "text-slate-600 hover:text-red-600" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-48">
                {!selectedRowId ? (
                  <div className="text-[11px] text-slate-400 italic p-3 text-center">
                    Select a Row first
                  </div>
                ) : availableRacks.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic p-3 text-center">
                    No Racks. Click + to add.
                  </div>
                ) : (
                  availableRacks.map((rk) => {
                    const isSelected = rk.id === selectedRackId;
                    return (
                      <button
                        key={rk.id}
                        onClick={() => {
                          setSelectedRackId(rk.id);
                          setActiveSelectionType("CONTAINER");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2E3A23] text-white shadow-xs font-semibold"
                            : "bg-white text-slate-800 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        <span>{rk.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 5: Device */}
            <div className="flex flex-col">
              <div className="px-3 py-2 bg-slate-200/90 border-b border-slate-300 flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>5. Device</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!selectedRackId}
                    onClick={() => selectedRackId && handleOpenAdd("DEVICE")}
                    title={selectedRackId ? "Add Device to Rack" : "Select Rack first"}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedRackId ? "text-[#2E3A23] hover:bg-slate-300" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={!selectedServer}
                    onClick={() => handleOpenAdd("DEVICE")}
                    title="Add Device"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedServer ? "text-slate-600 hover:text-slate-900" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    disabled={!selectedServer}
                    onClick={() => handleDeleteNode("DEVICE")}
                    title="Delete Selected Device"
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      selectedServer ? "text-slate-600 hover:text-red-600" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-48">
                {!selectedRackId ? (
                  <div className="text-[11px] text-slate-400 italic p-3 text-center">
                    Select a Rack first
                  </div>
                ) : rackServers.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic p-3 text-center">
                    No Devices in this Rack. Click + to add server.
                  </div>
                ) : (
                  rackServers.map((srv) => {
                    const isSelected = selectedServer?.id === srv.id && activeSelectionType === "DEVICE";
                    return (
                      <button
                        key={srv.id}
                        onClick={() => {
                          onSelectServer(srv);
                          setActiveSelectionType("DEVICE");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2E3A23] text-white shadow-xs font-semibold"
                            : "bg-white text-slate-800 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-mono">
                          <Server className="w-3.5 h-3.5" />
                          <span>{srv.ip}</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 2: LAYOUT (TREE GRAPH) ----------------- */}
      {activeSubTab === "LAYOUT" && (
        <div className="bg-white border border-slate-300 rounded-md p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[#2E3A23]" />
              <h2 className="font-bold text-sm text-slate-900 tracking-wide uppercase">
                Data Center Topology Tree Graph
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#2E3A23] bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
              Interactive Topology Node Map
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md overflow-x-auto min-h-[300px]">
            {dataCenters.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-xs">
                No Data Centers in Hierarchy. Go to HIERARCHY tab to add your first DC.
              </div>
            ) : (
              <div className="space-y-4 text-xs font-sans">
                {dataCenters.map((dc) => (
                  <div key={dc.id} className="border border-slate-300 rounded-md bg-white p-3 shadow-xs space-y-3">
                    {/* DC Node */}
                    <div className="flex items-center justify-between bg-[#2E3A23] text-white p-2.5 rounded font-bold">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-emerald-300" />
                        <span>Data Center: {dc.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-200">{dc.rooms.length} Rooms</span>
                    </div>

                    {/* Rooms Branch */}
                    <div className="pl-6 border-l-2 border-[#2E3A23] space-y-3 ml-3">
                      {dc.rooms.map((rm) => (
                        <div key={rm.id} className="border border-slate-200 rounded p-2.5 bg-slate-50/80 space-y-2">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              <Home className="w-3.5 h-3.5 text-[#2E3A23]" />
                              <span>Room: {rm.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">{rm.rows.length} Rows</span>
                          </div>

                          {/* Rows Branch */}
                          <div className="pl-5 border-l-2 border-slate-300 space-y-2 ml-2">
                            {rm.rows.map((rw) => (
                              <div key={rw.id} className="border border-slate-200 rounded p-2 bg-white space-y-2">
                                <div className="flex items-center justify-between font-semibold text-slate-700">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-3.5 h-3.5 text-[#2E3A23]" />
                                    <span>Row: {rw.name}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 font-mono">{rw.racks.length} Racks</span>
                                </div>

                                {/* Racks & Devices Branch */}
                                <div className="pl-4 border-l-2 border-emerald-300 space-y-1.5 ml-2">
                                    {rw.racks.map((rk) => (
                                      <div key={rk.id} className="p-3 bg-slate-50 rounded-md border border-slate-200 flex flex-col gap-2 shadow-2xs">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                                          <div className="flex items-center gap-2">
                                            <Box className="w-3.5 h-3.5 text-[#2E3A23]" />
                                            <span className="font-bold text-slate-900">Rack: {rk.name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                              (Cap: {rk.powerCapacityW || 5000}W | {rk.spaceCapacityU || 42}U | {rk.weightCapacityKg || 800}kg)
                                            </span>
                                          </div>
                                        </div>

                                        {/* Attached Devices for THIS rack with clean responsive wrapping */}
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                          {(() => {
                                            const rkServers = servers.filter((srv) => {
                                              if (srv.rackId) return srv.rackId === rk.id;
                                              if (srv.rackName) return srv.rackName === rk.name;
                                              if (rk.devices?.some((d) => d.id === srv.id)) return true;
                                              return false;
                                            });

                                            if (rkServers.length === 0) {
                                              return <span className="text-[10px] text-slate-400 italic font-mono">Empty Rack</span>;
                                            }

                                            return rkServers.map((srv) => (
                                              <button
                                                key={srv.id}
                                                onClick={() => {
                                                  onSelectServer(srv);
                                                  setActiveSelectionType("DEVICE");
                                                  setActiveSubTab("HIERARCHY");
                                                }}
                                                className="px-2.5 py-1 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white rounded font-mono text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                                              >
                                                <Server className="w-3 h-3 text-emerald-300" />
                                                <span>{srv.ip}</span>
                                              </button>
                                            ));
                                          })()}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 3: CAPACITY DASHBOARD ----------------- */}
      {activeSubTab === "CAPACITY" && (
        <div className="space-y-4">
          {/* Summary Metric Counters (DC, Room, Row, Rack, Devices) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">DATA CENTERS</span>
              <span className="text-2xl font-bold font-mono text-[#2E3A23] block">{totalDcCount}</span>
              <Building className="w-5 h-5 text-[#2E3A23] mx-auto mt-1" />
            </div>
            <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">ROOMS</span>
              <span className="text-2xl font-bold font-mono text-[#2E3A23] block">{totalRoomsCount}</span>
              <Home className="w-5 h-5 text-[#2E3A23] mx-auto mt-1" />
            </div>
            <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">ROWS</span>
              <span className="text-2xl font-bold font-mono text-[#2E3A23] block">{totalRowsCount}</span>
              <Layers className="w-5 h-5 text-[#2E3A23] mx-auto mt-1" />
            </div>
            <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">RACKS</span>
              <span className="text-2xl font-bold font-mono text-[#2E3A23] block">{totalRacksCount}</span>
              <Box className="w-5 h-5 text-[#2E3A23] mx-auto mt-1" />
            </div>
            <div className="bg-white border border-slate-300 rounded-md p-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">DEVICES</span>
              <span className="text-2xl font-bold font-mono text-[#2E3A23] block">{servers.length}</span>
              <Server className="w-5 h-5 text-[#2E3A23] mx-auto mt-1" />
            </div>
          </div>

          {/* Physical Capacity Progress Cards (Space, Power, Weight) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Space Capacity */}
            <div className="bg-white border border-slate-300 rounded-md p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#2E3A23] uppercase">Space Capacity (U)</span>
                <span className="font-mono text-slate-900">{totalUsedSpace} / {totalRackSpaceCap || 42} U</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  style={{ width: `${Math.min(100, (totalUsedSpace / (totalRackSpaceCap || 42)) * 100)}%` }}
                  className="bg-[#2E3A23] h-full"
                />
              </div>
              <span className="text-[11px] text-slate-500 block font-mono">
                {((totalUsedSpace / (totalRackSpaceCap || 42)) * 100).toFixed(1)}% Space Occupied
              </span>
            </div>

            {/* Power Capacity */}
            <div className="bg-white border border-slate-300 rounded-md p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-amber-700 uppercase">Power Capacity (Watts)</span>
                <span className="font-mono text-slate-900">{totalUsedPower} / {totalRackPowerCap || 5000} W</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  style={{ width: `${Math.min(100, (totalUsedPower / (totalRackPowerCap || 5000)) * 100)}%` }}
                  className="bg-amber-600 h-full"
                />
              </div>
              <span className="text-[11px] text-slate-500 block font-mono">
                {((totalUsedPower / (totalRackPowerCap || 5000)) * 100).toFixed(1)}% IT Power Allocated
              </span>
            </div>

            {/* Weight Capacity */}
            <div className="bg-white border border-slate-300 rounded-md p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-blue-700 uppercase">Weight Capacity (kg)</span>
                <span className="font-mono text-slate-900">{totalUsedWeight} / {totalRackWeightCap || 800} kg</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  style={{ width: `${Math.min(100, (totalUsedWeight / (totalRackWeightCap || 800)) * 100)}%` }}
                  className="bg-blue-600 h-full"
                />
              </div>
              <span className="text-[11px] text-slate-500 block font-mono">
                {((totalUsedWeight / (totalRackWeightCap || 800)) * 100).toFixed(1)}% Weight Capacity Used
              </span>
            </div>
          </div>

          {/* Per-Rack Capacity Table Breakdown */}
          <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
            <div className="bg-[#2E3A23] text-white px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Per-Rack Capacity Allocation Matrix</span>
              <span className="font-mono text-emerald-200">{rackBreakdownList.length} Racks Configured</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-2.5 border-r border-slate-200">Rack Name</th>
                    <th className="p-2.5 border-r border-slate-200">Location (DC / Room / Row)</th>
                    <th className="p-2.5 border-r border-slate-200">Devices Count</th>
                    <th className="p-2.5 border-r border-slate-200">Space Used / Cap (U)</th>
                    <th className="p-2.5 border-r border-slate-200">Power Used / Cap (W)</th>
                    <th className="p-2.5">Weight Used / Cap (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {rackBreakdownList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                        No Racks in Hierarchy. Go to HIERARCHY tab to add your first Rack.
                      </td>
                    </tr>
                  ) : (
                    rackBreakdownList.map((rk, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-[#2E3A23] border-r border-slate-200">{rk.rackName}</td>
                        <td className="p-2.5 border-r border-slate-200 text-slate-600 font-mono">
                          {rk.dcName} / {rk.roomName} / {rk.rowName}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 font-mono font-bold">{rk.devicesCount} Servers</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono">
                          {rk.spaceUsed} / {rk.spaceCap} U
                        </td>
                        <td className="p-2.5 border-r border-slate-200 font-mono text-amber-700 font-bold">
                          {rk.powerUsed} / {rk.powerCap} W
                        </td>
                        <td className="p-2.5 font-mono text-blue-700 font-bold">
                          {rk.weightUsed} / {rk.weightCap} kg
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main Server Telemetry Grid for HIERARCHY view */}
      {activeSubTab === "HIERARCHY" && (
        <>
          {/* Container Physical Capacity Summary Bar (Shown when DC, Room, Row, or Rack is clicked) */}
          {activeContainerInfo && activeSelectionType === "CONTAINER" && (
            <div className="space-y-4">
              {/* Device Statistics Card */}
              <DeviceStatisticsCard servers={servers} />

              <div className="bg-white border border-slate-300 rounded-md p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E3A23]" />
                  <span className="text-[#2E3A23] uppercase">
                    {activeContainerInfo.level}: {activeContainerInfo.name} PHYSICAL CAPACITIES & HARDWARE BREAKDOWN
                  </span>
                </div>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-[11px] font-bold">
                  {servers.length} Registered Devices
                </span>
              </div>

              {/* Physical Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Total Devices</span>
                  <span className="text-lg font-bold font-mono text-[#2E3A23]">{servers.length} Servers</span>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Space Occupied (U)</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{totalUsedSpace} / {activeContainerInfo.spaceCap} U</span>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Power Allocated (W)</span>
                  <span className="text-lg font-bold font-mono text-amber-700">{totalUsedPower} / {activeContainerInfo.powerCap} W</span>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Weight Capacity (kg)</span>
                  <span className="text-lg font-bold font-mono text-blue-700">{totalUsedWeight} / {activeContainerInfo.weightCap} kg</span>
                </div>
              </div>

              {/* Container Hardware Subsystem Breakdown Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 flex justify-between">
                  <span>Hardware Subsystem Totals Table</span>
                  <span className="font-mono text-slate-500">{activeContainerInfo.name}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="p-2.5 border-r border-slate-200">Hardware Subsystem</th>
                        <th className="p-2.5 border-r border-slate-200">Total Installed Count</th>
                        <th className="p-2.5 border-r border-slate-200">Total Capacity & Specifications</th>
                        <th className="p-2.5">Subsystem Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      <tr>
                        <td className="p-2.5 font-bold text-[#2E3A23] border-r border-slate-200">Processors / CPUs</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-slate-900">{servers.length * 2} Installed Sockets</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono">{servers.length * 48} Total Cores ({servers.length * 96} Threads)</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            NORMAL
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-[#2E3A23] border-r border-slate-200">Memory (RAM)</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-slate-900">{servers.length * 16} DIMM Modules</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono">{servers.length * 256} GB DDR4 ECC RAM</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            NORMAL
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-[#2E3A23] border-r border-slate-200">GPUs (Graphics Accelerators)</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-slate-900">{servers.length * 4} Enterprise GPUs</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono">{servers.length * 320} GB HBM3 GPU VRAM (NVIDIA A100/H100)</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            NORMAL
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-[#2E3A23] border-r border-slate-200">Host Network Interfaces (NICs)</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-slate-900">{servers.length * 4} Ethernet Interfaces</td>
                        <td className="p-2.5 border-r border-slate-200 font-mono">10Gbps / 25Gbps High Speed Optical Links</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            NORMAL
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Server Telemetry Panels - DISPLAYED ONLY WHEN A SERVER DEVICE IS EXPLICITLY CLICKED */}
          {activeSelectionType === "DEVICE" && selectedServer && (
            <>
              {/* Server Info Banner Bar */}
              <div className="bg-[#2E3A23] text-white px-4 py-2 rounded-md flex items-center justify-between shadow-xs text-xs font-semibold">
                <span>Server Info: {selectedServer.ip} — Location Summary</span>
                <span className="font-mono text-emerald-200">Selected Server: {selectedServer.name} ({selectedServer.ip})</span>
              </div>

              {/* Main Telemetry Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6 bg-white border border-slate-300 rounded-md p-4 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-[#2E3A23]" />
                      <span>Server Telemetry Breakdown</span>
                    </h3>
                    <span className="text-xs font-mono text-slate-500">IP: {selectedServer.ip}</span>
                  </div>

                  <div className="h-48 w-full relative flex items-center justify-center my-2">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-xs text-slate-400">No Telemetry Available</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 py-1.5 border-t border-slate-100 text-xs font-medium text-slate-600">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}:</span>
                        <span className="font-mono text-slate-900 font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                      <span className="block text-[10px] font-semibold uppercase text-slate-500">PROCESSOR</span>
                      <span className="text-xs font-bold text-slate-900">
                        {telemetryData?.inventory.processor.count || 2}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                      <span className="block text-[10px] font-semibold uppercase text-slate-500">MEMORY</span>
                      <span className="text-xs font-bold text-slate-900">
                        {telemetryData?.inventory.memory.totalCapacityGiB || 256} GB
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                      <span className="block text-[10px] font-semibold uppercase text-slate-500">STORAGE</span>
                      <span className="text-xs font-bold text-slate-900">
                        {telemetryData?.inventory.storage.totalCapacityGB || 3840} GB
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                      <span className="block text-[10px] font-semibold uppercase text-slate-500">NICS</span>
                      <span className="text-xs font-bold text-slate-900">
                        {telemetryData?.inventory.hostNic.count || 4}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white border border-slate-300 rounded-md p-4 shadow-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Device Table & Controller Info</span>
                    </h3>

                    <span className="text-[#C8102E] font-black text-sm tracking-wider uppercase">
                      Tyrone
                    </span>

                    <div className="flex items-center gap-1.5">
                      {selectedServer.status === "Offline" ? (
                        <button
                          onClick={() => onPowerAction("POWER_ON")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                        >
                          POWER ON
                        </button>
                      ) : (
                        <button
                          onClick={() => onPowerAction("POWER_OFF")}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                        >
                          POWER OFF
                        </button>
                      )}
                      <button
                        onClick={() => onPowerAction("REBOOT")}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                      >
                        REBOOT
                      </button>
                      <button
                        onClick={handleRefresh}
                        className="px-2.5 py-1 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white rounded font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                      >
                        RECONNECT
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs py-1">
                    {visibleColumns.name && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Server Name</span>
                        <span className="font-semibold text-slate-900">{selectedServer.name}</span>
                      </div>
                    )}
                    {visibleColumns.address && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">IP Address</span>
                        <span className="font-mono font-semibold text-blue-600 flex items-center gap-1">
                          {selectedServer.ip} <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                    {visibleColumns.serialNumber && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Serial Number</span>
                        <span className="font-mono font-semibold text-slate-900">{selectedServer.serialNumber}</span>
                      </div>
                    )}
                    {visibleColumns.chassisLed && (
                      <div className="py-1.5 flex justify-between items-center">
                        <span className="font-medium text-slate-500">Chassis Indicator LED</span>
                        <div className="flex items-center gap-1">
                          {(["Off", "On", "Blinking"] as const).map((led) => (
                            <button
                              key={led}
                              onClick={() => onToggleChassisLed(led)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                selectedServer.chassisLed === led
                                  ? "bg-[#2E3A23] text-white font-bold"
                                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              }`}
                            >
                              {led}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {visibleColumns.deviceType && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Device Type</span>
                        <span className="font-semibold text-slate-900">Physical Server</span>
                      </div>
                    )}
                    {visibleColumns.model && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Device Model</span>
                        <span className="font-semibold text-slate-900">{selectedServer.model}</span>
                      </div>
                    )}
                    {visibleColumns.rack && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Rack Location</span>
                        <span className="font-semibold font-mono text-[#2E3A23]">{selectedServer.rackId || "Rack A"}</span>
                      </div>
                    )}
                    {visibleColumns.power && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Power Usage</span>
                        <span className="font-mono font-bold text-amber-700">{selectedServer.powerW} W</span>
                      </div>
                    )}
                    {visibleColumns.size && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Space Size</span>
                        <span className="font-mono font-bold text-slate-900">{selectedServer.sizeU} U</span>
                      </div>
                    )}
                    {visibleColumns.weight && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Device Weight</span>
                        <span className="font-mono font-bold text-blue-700">{selectedServer.weightKg} kg</span>
                      </div>
                    )}
                    {visibleColumns.numCpu && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Number of CPU</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {telemetryData?.inventory.processor.count || 2} Sockets ({telemetryData?.inventory.processor.model || "Intel Xeon Platinum"})
                        </span>
                      </div>
                    )}
                    {visibleColumns.totalMemory && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Total Memory</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {telemetryData?.inventory.memory.totalCapacityGiB || 256} GB DDR4 ECC
                        </span>
                      </div>
                    )}
                    {visibleColumns.biosInfo && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">BIOS Information</span>
                        <span className="font-mono font-semibold text-slate-900">
                          Tyrone UEFI BIOS v3.5b (2026.02)
                        </span>
                      </div>
                    )}
                    {visibleColumns.mgmtVersion && (
                      <div className="py-1.5 flex justify-between items-center">
                        <span className="font-medium text-slate-500">Mgmt Module Firmware Version</span>
                        <div className="flex items-center gap-2 font-semibold text-xs">
                          <span className="font-mono text-[#2E3A23] font-bold">
                            {selectedServer.mgmtModuleVersion}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsProvisioningOpen(true)}
                            className="text-[#C8102E] hover:underline font-bold cursor-pointer"
                          >
                            Provisioning
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsProvisioningOpen(true)}
                            className="text-[#C8102E] hover:underline font-bold cursor-pointer"
                          >
                            More
                          </button>
                        </div>
                      </div>
                    )}
                    {visibleColumns.mgmtUrl && (
                      <div className="py-1.5 flex justify-between">
                        <span className="font-medium text-slate-500">Management Console URL</span>
                        <a
                          href={selectedServer.mgmtConsoleUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-blue-600 underline font-semibold hover:text-blue-800"
                        >
                          {selectedServer.mgmtConsoleUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subsystem Health Status & Detailed Inventory Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 bg-white border border-slate-300 rounded-md p-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                    <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Subsystem Health Status</span>
                    </h3>
                    <button
                      onClick={handleRefresh}
                      className="text-xs text-[#2E3A23] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {telemetryData?.health.map((item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between p-2 rounded border border-slate-200 bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              item.status?.toLowerCase() === "critical" || item.status?.toLowerCase() === "error"
                                ? "text-red-500"
                                : item.status?.toLowerCase() === "warning"
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }`}
                          />
                          <span className="font-medium text-slate-800">{item.category}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            item.status?.toLowerCase() === "critical" || item.status?.toLowerCase() === "error"
                              ? "bg-red-100 text-red-800 border-red-300"
                              : item.status?.toLowerCase() === "warning"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-8 bg-white border border-slate-300 rounded-md p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 mb-3 gap-2">
                    <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wide">
                      <Box className="w-4 h-4 text-[#2E3A23]" />
                      <span>Inventory Detailed Information</span>
                    </h3>

                    {/* Small Refresh Button */}
                    <button
                      onClick={handleRefresh}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#2E3A23] font-semibold text-xs rounded border border-slate-300 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Vertical Sidebar Layout Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Left Sidebar Menu Column */}
                    <div className="md:col-span-3 bg-slate-50 border border-slate-200 rounded p-1.5 space-y-1">
                      {(["CPU", "MEMORY", "FANS", "NETWORK", "FIRMWARE", "SENSORS"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setInventoryTab(tab)}
                          className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                            inventoryTab === tab
                              ? "bg-[#2E3A23] text-white shadow-xs font-bold"
                              : "text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <span>{tab}</span>
                          {inventoryTab === tab && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>

                    {/* Right Specs Table Content Column */}
                    <div className="md:col-span-9 overflow-x-auto max-h-72">
                      {inventoryTab === "CPU" && (
                        <table className="w-full text-left text-xs border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                              <th className="p-2 border-r border-slate-200">CPU Property</th>
                              <th className="p-2 border-r border-slate-200">Value</th>
                              <th className="p-2">Subsystem Serial Number</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-slate-600">CPU Count</td>
                              <td className="p-2 font-mono font-bold text-[#2E3A23]">{telemetryData?.inventory.processor.count || 2} Installed Sockets</td>
                              <td className="p-2 font-mono text-slate-600">{telemetryData?.inventory.processor.serialNumber}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-slate-600">Model Name</td>
                              <td className="p-2 font-medium">{telemetryData?.inventory.processor.model}</td>
                              <td className="p-2 font-mono text-slate-600">{telemetryData?.inventory.processor.serialNumber}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-slate-600">Processor Architecture</td>
                              <td className="p-2 font-mono font-bold text-slate-900">{telemetryData?.inventory.processor.architecture || "x86-64"}</td>
                              <td className="p-2 font-mono text-slate-600">{telemetryData?.inventory.processor.serialNumber}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-slate-600">Processor Family</td>
                              <td className="p-2 font-medium text-slate-900">{telemetryData?.inventory.processor.family || "Intel(R) Xeon(R) Scalable"}</td>
                              <td className="p-2 font-mono text-slate-600">{telemetryData?.inventory.processor.serialNumber}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-slate-600">Total Cores</td>
                              <td className="p-2 font-mono font-bold text-slate-900">{telemetryData?.inventory.processor.totalCores || 24} Cores</td>
                              <td className="p-2 font-mono text-slate-600">{telemetryData?.inventory.processor.serialNumber}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-slate-600">Total Threads</td>
                              <td className="p-2 font-mono font-bold text-slate-900">{telemetryData?.inventory.processor.totalThreads || 48} Threads</td>
                              <td className="p-2 font-mono text-slate-600">{telemetryData?.inventory.processor.serialNumber}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-slate-600">Manufacturer / Vendor</td>
                              <td className="p-2">{telemetryData?.inventory.processor.manufacturer}</td>
                              <td className="p-2 font-mono text-slate-600">{telemetryData?.inventory.processor.serialNumber}</td>
                            </tr>
                          </tbody>
                        </table>
                      )}

                      {inventoryTab === "MEMORY" && (
                        <table className="w-full text-left text-xs border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                              <th className="p-2 border-r border-slate-200">Slot Name</th>
                              <th className="p-2 border-r border-slate-200">Capacity</th>
                              <th className="p-2 border-r border-slate-200">Speed</th>
                              <th className="p-2 border-r border-slate-200">Type</th>
                              <th className="p-2 border-r border-slate-200">Manufacturer</th>
                              <th className="p-2">Serial Number</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {telemetryData?.inventory.memory.dimms.slice(0, 8).map((dimm) => (
                              <tr key={dimm.slot} className="hover:bg-slate-50">
                                <td className="p-2 font-semibold border-r border-slate-200 text-[#2E3A23]">{dimm.slot}</td>
                                <td className="p-2 font-mono border-r border-slate-200 font-bold">{dimm.sizeGiB} GB</td>
                                <td className="p-2 font-mono border-r border-slate-200">{dimm.speedMHz} MHz</td>
                                <td className="p-2 border-r border-slate-200">{dimm.type}</td>
                                <td className="p-2 border-r border-slate-200">{dimm.manufacturer}</td>
                                <td className="p-2 font-mono text-slate-600">{dimm.serialNumber}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {inventoryTab === "FANS" && (
                        <table className="w-full text-left text-xs border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                              <th className="p-2 border-r border-slate-200">Fan Name</th>
                              <th className="p-2 border-r border-slate-200">Current RPM</th>
                              <th className="p-2 border-r border-slate-200">Min/Max Bounds</th>
                              <th className="p-2 border-r border-slate-200">Status</th>
                              <th className="p-2">Serial Number</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {telemetryData?.inventory.fan.fans.map((fan) => (
                              <tr key={fan.name} className="hover:bg-slate-50">
                                <td className="p-2 font-semibold border-r border-slate-200 text-[#2E3A23]">{fan.name}</td>
                                <td className="p-2 font-mono border-r border-slate-200 font-bold text-slate-900">{fan.currentRPM} RPM</td>
                                <td className="p-2 font-mono border-r border-slate-200 text-slate-600">{fan.minRPM} - {fan.maxRPM} RPM</td>
                                <td className="p-2 border-r border-slate-200">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {fan.status}
                                  </span>
                                </td>
                                <td className="p-2 font-mono text-slate-600">{fan.serialNumber}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {inventoryTab === "NETWORK" && (
                        <table className="w-full text-left text-xs border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                              <th className="p-2 border-r border-slate-200">Interface Name</th>
                              <th className="p-2 border-r border-slate-200">MAC Address</th>
                              <th className="p-2 border-r border-slate-200">Link Speed</th>
                              <th className="p-2 border-r border-slate-200">Status</th>
                              <th className="p-2">Serial Number</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {telemetryData?.inventory.hostNic.nics.map((nic) => (
                              <tr key={nic.name} className="hover:bg-slate-50">
                                <td className="p-2 font-semibold border-r border-slate-200 text-[#2E3A23]">{nic.name}</td>
                                <td className="p-2 font-mono border-r border-slate-200">{nic.macAddress}</td>
                                <td className="p-2 font-mono border-r border-slate-200 font-bold">{nic.speed}</td>
                                <td className="p-2 border-r border-slate-200">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {nic.status}
                                  </span>
                                </td>
                                <td className="p-2 font-mono text-slate-600">{nic.serialNumber}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {inventoryTab === "FIRMWARE" && (
                        <table className="w-full text-left text-xs border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                              <th className="p-2 border-r border-slate-200">Firmware Subsystem</th>
                              <th className="p-2 border-r border-slate-200">Version / Details</th>
                              <th className="p-2">Subsystem Serial Number</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-[#2E3A23]">BIOS Version</td>
                              <td className="p-2 font-mono font-bold text-slate-900">{selectedServer?.mgmtModuleVersion || "v3.8a"}</td>
                              <td className="p-2 font-mono text-slate-600">{selectedServer?.serialNumber}-BIOS</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-[#2E3A23]">CPLD Firmware</td>
                              <td className="p-2 font-mono font-bold text-slate-900">v2.1.0-CPLD</td>
                              <td className="p-2 font-mono text-slate-600">{selectedServer?.serialNumber}-CPLD</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-[#2E3A23]">BMC Redfish Firmware</td>
                              <td className="p-2 font-mono font-bold text-emerald-700">v1.8.0-Tyrone-BMC</td>
                              <td className="p-2 font-mono text-slate-600">{selectedServer?.serialNumber}-BMC</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-semibold border-r border-slate-200 text-[#2E3A23]">Management Module Build Date</td>
                              <td className="p-2 font-mono text-slate-600">2026-08-20</td>
                              <td className="p-2 font-mono text-slate-600">{selectedServer?.serialNumber}-FW</td>
                            </tr>
                          </tbody>
                        </table>
                      )}

                      {inventoryTab === "SENSORS" && (
                        <table className="w-full text-left text-xs border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                              <th className="p-2 border-r border-slate-200">Sensor ID</th>
                              <th className="p-2 border-r border-slate-200">Sensor Name</th>
                              <th className="p-2 border-r border-slate-200">Category</th>
                              <th className="p-2 border-r border-slate-200">Current Reading</th>
                              <th className="p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {telemetryData?.inventory.sensorData?.sensors.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-50">
                                <td className="p-2 font-mono border-r border-slate-200 text-slate-500">{s.id}</td>
                                <td className="p-2 font-semibold border-r border-slate-200 text-[#2E3A23]">{s.name}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-600">{s.category}</td>
                                <td className="p-2 font-mono border-r border-slate-200 font-bold text-slate-900">{s.value}</td>
                                <td className="p-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {s.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ADD / EDIT NODE MODAL FOR DC, ROOM, ROW, RACK */}
      {modalMode && targetLevel && targetLevel !== "DEVICE" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl border border-slate-300 w-full max-w-md p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-semibold text-slate-900 text-sm">
                {modalMode === "ADD" ? `Add New ${targetLevel === "DC" ? "Data Center" : targetLevel}` : `Edit ${targetLevel} Details`}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {targetLevel === "DC" ? "Data Center Name *" : `${targetLevel} Name *`}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={`e.g. ${targetLevel === "DC" ? "Data Center 1" : targetLevel + " 1"}`}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:outline-none focus:border-[#2E3A23]"
                />
              </div>

              {targetLevel === "RACK" && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <span className="font-semibold text-[#2E3A23] uppercase text-[11px] block">
                    Rack Physical Capacities
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-medium text-slate-600 block text-[11px] mb-0.5">Power Cap (W)</label>
                      <input
                        type="number"
                        required
                        value={rackPower}
                        onChange={(e) => setRackPower(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-medium focus:outline-none focus:border-[#2E3A23]"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-600 block text-[11px] mb-0.5">Space Cap (U)</label>
                      <input
                        type="number"
                        required
                        value={rackSpace}
                        onChange={(e) => setRackSpace(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-medium focus:outline-none focus:border-[#2E3A23]"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-600 block text-[11px] mb-0.5">Weight Cap (kg)</label>
                      <input
                        type="number"
                        required
                        value={rackWeight}
                        onChange={(e) => setRackWeight(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-medium focus:outline-none focus:border-[#2E3A23]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-medium rounded shadow-xs"
                >
                  Save {targetLevel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Column Settings Modal (Matching Image 3) */}
      {isColumnSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#2E3A23] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide">Columns to be showed.</h3>
              <button
                onClick={() => setIsColumnSettingsOpen(false)}
                className="text-slate-200 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-3 gap-y-4 gap-x-6 text-slate-800 font-semibold">
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
                        localStorage.setItem("tyrone_visible_device_columns", JSON.stringify(updated));
                      }}
                      className="accent-[#C8102E] w-4 h-4 rounded cursor-pointer"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>

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

      {/* Provisioning Modal (Firmware Update & Mount ISO) */}
      <ProvisioningModal
        isOpen={isProvisioningOpen}
        onClose={() => setIsProvisioningOpen(false)}
        server={selectedServer}
      />
    </div>
  );
}
