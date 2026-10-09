import React, { useState, useEffect } from "react";
import { ServerDevice, InventorySpecs, HealthStatusItem, FaultLog, SensorReading, ServerEvent } from "./types";
import { getSavedServers, saveServers, fetchServerTelemetry, getFastServerTelemetry, getSavedHierarchy } from "./services/api";
import { fetchRedfishTelemetry } from "./services/redfishService";
import { LoginPage } from "./components/LoginPage";
import { Navbar } from "./components/Navbar";
import { Sidebar, NavTab } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { DeviceHierarchy } from "./components/DeviceHierarchy";
import { DeviceList } from "./components/DeviceList";
import { InventoryView } from "./components/InventoryView";
import { LogsAndEvents } from "./components/LogsAndEvents";
import { DiagnosticTools } from "./components/DiagnosticTools";
import { SettingsView } from "./components/SettingsView";
import { ReportsView } from "./components/ReportsView";
import { GpuView } from "./components/GpuView";
import { AboutModal } from "./components/AboutModal";
import { AddServerModal } from "./components/AddServerModal";

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("tyrone_logged_in") === "true";
  });
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("tyrone_username") || "admin";
  });
  const [userRole, setUserRole] = useState<"Administrator" | "Operator" | "ReadOnly">(() => {
    return (localStorage.getItem("tyrone_user_role") as any) || "Administrator";
  });

  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [servers, setServers] = useState<ServerDevice[]>(() => getSavedServers());
  const [hierarchy, setHierarchy] = useState(() => getSavedHierarchy());
  const [selectedServer, setSelectedServer] = useState<ServerDevice | null>(null);

  const [telemetry, setTelemetry] = useState<{
    inventory: InventorySpecs;
    health: HealthStatusItem[];
    faults: FaultLog[];
    sensors: SensorReading[];
    events: ServerEvent[];
  } | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeRackForAdd, setActiveRackForAdd] = useState<string>("");
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  useEffect(() => {
    if (servers.length > 0 && !selectedServer) {
      setSelectedServer(servers[0]);
      loadServerTelemetry(servers[0]);
    }
  }, [servers]);

  const loadServerTelemetry = (srv: ServerDevice) => {
    // 1. INSTANT SYNCHRONOUS UPDATE (0ms delay)
    const fastData = getFastServerTelemetry(srv);
    setTelemetry({
      inventory: fastData.inventory,
      health: fastData.health,
      faults: fastData.faults,
      sensors: fastData.sensors,
      events: fastData.events,
    });

    // 2. NON-BLOCKING BACKGROUND REDFISH FETCH (updates if live BMC is available)
    fetchRedfishTelemetry(srv.ip, srv.username || "admin", srv.password, srv)
      .then((redfishResult) => {
        if (redfishResult && redfishResult.inventory) {
          setTelemetry({
            inventory: redfishResult.inventory,
            health: redfishResult.health,
            faults: redfishResult.faults,
            sensors: redfishResult.sensors,
            events: redfishResult.events,
          });
        }
      })
      .catch(() => {});
  };

  const handleSelectServer = (srv: ServerDevice) => {
    setSelectedServer(srv);
    loadServerTelemetry(srv);
  };

  const handleAddServer = (newServer: ServerDevice, redfishResult?: any) => {
    const existing = servers.find((s) => s.ip === newServer.ip || (s.serialNumber && s.serialNumber.toLowerCase() === newServer.serialNumber.toLowerCase()));
    if (existing) {
      alert(`Duplicate Server Warning: Server ${newServer.ip} (${existing.name}) is already added to the console.`);
      return;
    }
    const updated = [newServer, ...servers];
    setServers(updated);
    saveServers(updated);
    setSelectedServer(newServer);
    if (redfishResult) {
      setTelemetry({
        inventory: redfishResult.inventory,
        health: redfishResult.health,
        faults: redfishResult.faults,
        sensors: redfishResult.sensors,
        events: redfishResult.events,
      });
    } else {
      loadServerTelemetry(newServer);
    }
  };

  const handleDeleteServer = (id: string) => {
    const updated = servers.filter((s) => s.id !== id);
    setServers(updated);
    saveServers(updated);
    if (selectedServer?.id === id) {
      const next = updated.length > 0 ? updated[0] : null;
      setSelectedServer(next);
      if (next) loadServerTelemetry(next);
      else setTelemetry(null);
    }
  };

  const handleToggleChassisLed = (led: "Off" | "On" | "Blinking") => {
    if (!selectedServer) return;
    const updatedServer = { ...selectedServer, chassisLed: led };
    setSelectedServer(updatedServer);
    const updatedList = servers.map((s) => (s.id === selectedServer.id ? updatedServer : s));
    setServers(updatedList);
    saveServers(updatedList);
  };

  const handlePowerAction = (action: "POWER_ON" | "POWER_OFF" | "REBOOT") => {
    if (!selectedServer) return;
    const newStatus = action === "POWER_OFF" ? "Offline" : "Online";
    const updatedServer = { ...selectedServer, status: newStatus as any };
    setSelectedServer(updatedServer);
    const updatedList = servers.map((s) => (s.id === selectedServer.id ? updatedServer : s));
    setServers(updatedList);
    saveServers(updatedList);
  };

  const handleAcknowledgeEvent = (eventId: string) => {
    if (!telemetry) return;
    const updatedEvents = telemetry.events.map((ev) =>
      ev.id === eventId ? { ...ev, acknowledged: true } : ev
    );
    setTelemetry({ ...telemetry, events: updatedEvents });
  };

  const handleOpenAddModal = (rackName?: string) => {
    if (rackName) setActiveRackForAdd(rackName);
    setIsAddModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("tyrone_logged_in");
    setIsLoggedIn(false);
  };

  const handleLoginSuccess = (u: string, role: "Administrator" | "Operator" | "ReadOnly") => {
    setUsername(u);
    setUserRole(role);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#F4F6F0] flex flex-col font-sans select-none text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentUser={`${username} (${userRole})`}
        onLogout={handleLogout}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex w-full relative">
        {/* Left Sticky Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
          }}
          eventCount={telemetry?.events.filter((e) => !e.acknowledged).length || 0}
          serverCount={servers.length}
          userRole={userRole}
        />

        {/* View Router Main Scroll Area */}
        <main className="flex-1 overflow-y-auto bg-[#F4F6F0] p-4 min-h-[calc(100vh-3.5rem)]">
          {activeTab === "dashboard" && (
            <Dashboard
              servers={servers}
              hierarchyData={hierarchy}
              telemetryData={telemetry}
            />
          )}

          {activeTab === "hierarchy" && (
            <DeviceHierarchy
              servers={servers}
              selectedServer={selectedServer}
              onSelectServer={handleSelectServer}
              telemetryData={telemetry}
              onRefreshTelemetry={() => selectedServer && loadServerTelemetry(selectedServer)}
              onToggleChassisLed={handleToggleChassisLed}
              onPowerAction={handlePowerAction}
              onAcknowledgeEvent={handleAcknowledgeEvent}
              onOpenAddDeviceModal={handleOpenAddModal}
              onDeleteDevice={handleDeleteServer}
              userRole={userRole}
            />
          )}

          {activeTab === "devices" && (
            <DeviceList
              servers={servers}
              onSelectServer={(srv) => {
                handleSelectServer(srv);
                setActiveTab("hierarchy");
              }}
              onOpenAddModal={() => handleOpenAddModal()}
              onDeleteServer={handleDeleteServer}
              onRefreshAll={() => {
                if (selectedServer) loadServerTelemetry(selectedServer);
              }}
              userRole={userRole}
            />
          )}

          {activeTab === "inventory" && selectedServer && telemetry && (
            <InventoryView server={selectedServer} inventory={telemetry.inventory} />
          )}

          {activeTab === "events" && (
            <LogsAndEvents
              events={telemetry?.events || []}
              sensors={telemetry?.sensors || []}
              faults={telemetry?.faults || []}
              servers={servers}
              onAcknowledgeEvent={handleAcknowledgeEvent}
            />
          )}

          {activeTab === "gpus" && <GpuView servers={servers} />}

          {activeTab === "reports" && <ReportsView />}

          {activeTab === "about" && <SettingsView userRole={userRole} />}

          {activeTab === "diagnostics" && <DiagnosticTools />}


        </main>
      </div>

      {/* Modals */}
      <AddServerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddServer={handleAddServer}
        activeRack={activeRackForAdd}
        servers={servers}
        onSelectServer={(srv) => {
          setSelectedServer(srv);
          loadServerTelemetry(srv);
          setIsAddModalOpen(false);
        }}
      />
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        serverCount={servers.length}
      />
    </div>
  );
}
