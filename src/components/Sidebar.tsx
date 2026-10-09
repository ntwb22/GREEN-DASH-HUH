import React, { useState } from "react";
import {
  LayoutDashboard,
  Network,
  Server,
  Bell,
  Cpu,
  FileBarChart,
  Settings,
  ChevronsRight,
  Menu,
  X
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "hierarchy"
  | "devices"
  | "inventory"
  | "events"
  | "gpus"
  | "reports"
  | "diagnostics"
  | "about";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  eventCount: number;
  serverCount?: number;
  userRole?: "Administrator" | "Operator" | "ReadOnly";
}

export function Sidebar({ activeTab, setActiveTab, eventCount, serverCount = 0, userRole = "Administrator" }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const allMenuItems: Array<{ id: NavTab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "hierarchy", label: "Hierarchy", icon: Network },
    { id: "devices", label: "Devices", icon: Server },
    { id: "events", label: "Events", icon: Bell, badge: eventCount > 0 ? eventCount : undefined },
    { id: "gpus", label: "GPUs", icon: Cpu },
    { id: "reports", label: "Reports", icon: FileBarChart },
    { id: "about", label: "Settings", icon: Settings },
  ];

  // Filter items for ReadOnly users (Can ONLY view Dashboard, Hierarchy/Inventory, Events and Logout)
  const menuItems = userRole === "ReadOnly"
    ? allMenuItems.filter((item) => ["dashboard", "hierarchy", "events"].includes(item.id))
    : allMenuItems;

  const handleSelect = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-[#2E3A23] text-white rounded-lg shadow-md"
        aria-label="Toggle Navigation Sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container: Dark Olive Green Theme */}
      <aside
        className={`fixed md:sticky top-14 left-0 z-40 w-56 bg-[#2E3A23] text-white flex flex-col h-[calc(100vh-3.5rem)] select-none border-r border-[#1E2616] shrink-0 font-sans transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Scrollable Nav List */}
        <nav className="flex-1 py-1 overflow-y-auto space-y-0.5 px-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#F4F6F0] text-[#2E3A23] shadow-xs font-bold"
                    : "bg-[#2E3A23] text-white hover:bg-[#3B4A2D]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#2E3A23]" : "text-white"}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? "bg-[#2E3A23] text-white" : "bg-white text-[#2E3A23]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronsRight className={`w-3.5 h-3.5 ${isActive ? "text-[#2E3A23]" : "text-white/80"}`} />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer Info in Sidebar */}
        <div className="p-3 border-t border-[#1E2616] bg-[#1E2616] text-[11px] text-emerald-200 shrink-0">
          <div className="flex items-center justify-between font-mono">
            <span>Server Count:</span>
            <span className="text-white font-semibold">{serverCount} Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
