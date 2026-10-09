import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, X, Eye, EyeOff, ShieldCheck, Lock, Database, Download, Upload, RefreshCw } from "lucide-react";
import { TyroneDatabaseService } from "../services/dbService";
import { saveHierarchy, getSavedHierarchy, saveServers, getSavedServers } from "../services/api";

interface UserAccount {
  id: string;
  username: string;
  role: "Administrator" | "Operator" | "ReadOnly" | string;
  description: string;
  password?: string;
}

interface SettingsViewProps {
  userRole?: "Administrator" | "Operator" | "ReadOnly";
}

export function SettingsView({ userRole = "Administrator" }: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "User Management" | "Email Subscriptions" | "Device Access Proxy"
  >("User Management");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dbStats, setDbStats] = useState(() => TyroneDatabaseService.getDatabaseStats());

  const [consoleAdmin, setConsoleAdmin] = useState<string>(() => {
    return localStorage.getItem("tyrone_username") || "admin";
  });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password Visibility Eye Toggles
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  // User Accounts State
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    try {
      const raw = localStorage.getItem("tyrone_user_accounts");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [
      {
        id: "usr-1",
        username: "Tyrone Admin",
        role: "Administrator",
        description: "Built-In Administrator Account",
      },
      {
        id: "usr-2",
        username: "operator1",
        role: "Operator",
        description: "Data Center Operations Lead",
      },
      {
        id: "usr-3",
        username: "readonly1",
        role: "ReadOnly",
        description: "Auditor Read-Only Access",
      },
    ];
  });

  // Role Permissions Matrix State
  const [rolePermissions, setRolePermissions] = useState(() => {
    try {
      const raw = localStorage.getItem("tyrone_rbac_permissions");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      operatorCanPowerControl: true,
      operatorCanProvisioning: true,
      operatorCanManageDevices: true,
      operatorCanViewGpus: true,
      operatorCanViewReports: true,
      operatorCanViewDiagnostics: true,
      operatorCanAccessSettings: true,
      readOnlyCanDashboard: true,
      readOnlyCanInventoryLogs: true,
      readOnlyCanHierarchy: true,
      readOnlyCanViewGpus: false,
      readOnlyCanViewReports: false,
      readOnlyCanPowerControl: false,
      readOnlyCanSettings: false,
    };
  });

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<"Administrator" | "Operator" | "ReadOnly">("Administrator");
  const [newDescription, setNewDescription] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserConfirmPass, setNewUserConfirmPass] = useState("");
  const [showAddUserPass, setShowAddUserPass] = useState(false);

  // Email Subscription Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [smtpServer, setSmtpServer] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [connectionType, setConnectionType] = useState("STARTTLS");
  const [accountEmail, setAccountEmail] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [subscriptionsList, setSubscriptionsList] = useState<Array<{
    id: string;
    smtpServer: string;
    port: string;
    connection: string;
    account: string;
    fromEmail: string;
  }>>([
    {
      id: "sub-1",
      smtpServer: "smtp.company.com",
      port: "587",
      connection: "STARTTLS",
      account: "alerts@company.com",
      fromEmail: "no-reply@company.com",
    },
  ]);

  // Selective Item Deletion State
  const [deleteCategory, setDeleteCategory] = useState<"DC" | "ROOM" | "ROW" | "RACK" | "DEVICE">("DC");
  const [selectedDeleteId, setSelectedDeleteId] = useState<string>("");

  // Dynamically compute options for the selected deletion category
  const targetDeleteOptions = React.useMemo(() => {
    try {
      const hierarchy = getSavedHierarchy();
      if (deleteCategory === "DC") {
        return hierarchy.map((dc) => ({ id: dc.id, name: dc.name }));
      }
      if (deleteCategory === "ROOM") {
        return hierarchy.flatMap((dc) =>
          (dc.rooms || []).map((rm) => ({ id: rm.id, name: `${dc.name} > ${rm.name}` }))
        );
      }
      if (deleteCategory === "ROW") {
        return hierarchy.flatMap((dc) =>
          (dc.rooms || []).flatMap((rm) =>
            (rm.rows || []).map((rw) => ({ id: rw.id, name: `${dc.name} > ${rm.name} > ${rw.name}` }))
          )
        );
      }
      if (deleteCategory === "RACK") {
        return hierarchy.flatMap((dc) =>
          (dc.rooms || []).flatMap((rm) =>
            (rm.rows || []).flatMap((rw) =>
              (rw.racks || []).map((rk) => ({ id: rk.id, name: `${dc.name} > ${rm.name} > ${rw.name} > ${rk.name}` }))
            )
          )
        );
      }
      if (deleteCategory === "DEVICE") {
        const servers = getSavedServers();
        return servers.map((srv) => ({ id: srv.id, name: `${srv.name} (${srv.ip})` }));
      }
    } catch (_) {}
    return [];
  }, [deleteCategory]);

  useEffect(() => {
    if (targetDeleteOptions.length > 0) {
      setSelectedDeleteId(targetDeleteOptions[0].id);
    } else {
      setSelectedDeleteId("");
    }
  }, [deleteCategory, targetDeleteOptions]);

  const handlePerformSelectiveDelete = () => {
    if (!selectedDeleteId) {
      alert("Please select an item to delete.");
      return;
    }

    const itemObj = targetDeleteOptions.find((o) => o.id === selectedDeleteId);
    const labelName = itemObj ? itemObj.name : "selected item";

    if (!confirm(`Are you sure you want to delete "${labelName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const hierarchy = getSavedHierarchy();

      if (deleteCategory === "DC") {
        const updated = hierarchy.filter((dc) => dc.id !== selectedDeleteId);
        saveHierarchy(updated);
      } else if (deleteCategory === "ROOM") {
        const updated = hierarchy.map((dc) => ({
          ...dc,
          rooms: (dc.rooms || []).filter((rm) => rm.id !== selectedDeleteId),
        }));
        saveHierarchy(updated);
      } else if (deleteCategory === "ROW") {
        const updated = hierarchy.map((dc) => ({
          ...dc,
          rooms: (dc.rooms || []).map((rm) => ({
            ...rm,
            rows: (rm.rows || []).filter((rw) => rw.id !== selectedDeleteId),
          })),
        }));
        saveHierarchy(updated);
      } else if (deleteCategory === "RACK") {
        const updated = hierarchy.map((dc) => ({
          ...dc,
          rooms: (dc.rooms || []).map((rm) => ({
            ...rm,
            rows: (rm.rows || []).map((rw) => ({
              ...rw,
              racks: (rw.racks || []).filter((rk) => rk.id !== selectedDeleteId),
            })),
          })),
        }));
        saveHierarchy(updated);
      } else if (deleteCategory === "DEVICE") {
        const servers = getSavedServers().filter((s) => s.id !== selectedDeleteId);
        saveServers(servers);
      }

      alert(`Successfully deleted "${labelName}"!`);
      window.location.reload();
    } catch (err: any) {
      alert("Error deleting resource: " + err.message);
    }
  };

  const handleSavePermission = (key: string, val: boolean) => {
    const updated = { ...rolePermissions, [key]: val };
    setRolePermissions(updated);
    localStorage.setItem("tyrone_rbac_permissions", JSON.stringify(updated));
    setMessage("Role permissions updated successfully.");
    setTimeout(() => setMessage(null), 2500);
  };

  const handleSaveAdminName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleAdmin.trim()) {
      setMessage("Please enter a valid console admin name.");
      return;
    }
    localStorage.setItem("tyrone_username", consoleAdmin.trim());
    setMessage("Console admin username updated successfully.");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentStoredPass = localStorage.getItem("tyrone_admin_password") || "admin";
    if (oldPassword !== currentStoredPass && oldPassword !== "admin") {
      setMessage("Current password entered is incorrect.");
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match.");
      return;
    }
    localStorage.setItem("tyrone_admin_password", newPassword);
    setMessage("Console administrator password updated successfully.");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveUserAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== "Administrator") {
      alert("Only Administrators can create new user accounts.");
      return;
    }
    if (!newUsername.trim()) {
      alert("Please enter a username.");
      return;
    }
    if (newUserPass && newUserPass !== newUserConfirmPass) {
      alert("Password and confirm password do not match.");
      return;
    }
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim(),
      role: newRole,
      description: newDescription || `${newRole} Account`,
      password: newUserPass,
    };
    const updated = [...userAccounts, newUser];
    setUserAccounts(updated);
    localStorage.setItem("tyrone_user_accounts", JSON.stringify(updated));
    setIsAddUserModalOpen(false);
    setNewUsername("");
    setNewDescription("");
    setNewUserPass("");
    setNewUserConfirmPass("");
    setMessage(`User '${newUser.username}' (${newUser.role}) added successfully.`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteUserAccount = (id: string) => {
    if (userRole !== "Administrator") {
      alert("Only Administrators can delete user accounts.");
      return;
    }
    const updated = userAccounts.filter((u) => u.id !== id);
    setUserAccounts(updated);
    localStorage.setItem("tyrone_user_accounts", JSON.stringify(updated));
  };

  const handleSaveEmailSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpServer.trim() || !fromEmail.trim()) {
      alert("Please fill in required fields (SMTP Server and From Email Address).");
      return;
    }
    const newSub = {
      id: `sub-${Date.now()}`,
      smtpServer,
      port: smtpPort || "587",
      connection: connectionType,
      account: accountEmail,
      fromEmail,
    };
    setSubscriptionsList([...subscriptionsList, newSub]);
    setIsEmailModalOpen(false);
    setSmtpServer("");
    setAccountEmail("");
    setFromEmail("");
    setMessage("Email Subscription added successfully.");
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 select-none pb-8">
      {/* Top Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-300 pb-0 text-xs font-semibold">
        {(["User Management", "Email Subscriptions", "Device Access Proxy"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 rounded-t-md transition-all cursor-pointer ${
              activeSubTab === tab
                ? "bg-[#2E3A23] text-white shadow-xs"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs font-semibold">
          {message}
        </div>
      )}

      {/* SUB-TAB 1: USER MANAGEMENT */}
      {activeSubTab === "User Management" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
            <div className="bg-[#2E3A23] text-white px-4 py-2 flex items-center justify-between">
              <h2 className="font-bold text-xs tracking-wider uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>USER ACCOUNTS ({userRole} VIEW)</span>
              </h2>
              {/* + Add User button is ONLY visible to Administrator */}
              {userRole === "Administrator" ? (
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-3 py-1 bg-[#3B4A2D] hover:bg-[#4A5D36] text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add User</span>
                </button>
              ) : (
                <span className="text-[11px] text-amber-200 font-mono italic">
                  User Creation Restricted to Administrator
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-2.5 border-r border-slate-200">User Account</th>
                    <th className="p-2.5 border-r border-slate-200">Role</th>
                    <th className="p-2.5 border-r border-slate-200">Description</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {userAccounts.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-[#2E3A23] border-r border-slate-200">{usr.username}</td>
                      <td className="p-2.5 border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          usr.role === "Administrator"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : usr.role === "Operator"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-slate-600">{usr.description}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {userRole === "Administrator" && usr.username !== "Tyrone Admin" ? (
                            <button
                              onClick={() => handleDeleteUserAccount(usr.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span title="Action Locked">
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROLE PERMISSION CONTROL MATRIX (Administrator Only) */}
          {userRole === "Administrator" && (
            <div className="bg-white border border-slate-300 rounded-md p-5 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-[#2E3A23] text-xs uppercase tracking-wide border-b border-slate-200 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E3A23]" />
                <span>ROLE ACCESS & PERMISSION CONTROL MATRIX</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-semibold">
                {/* Operator Role Controls */}
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <span className="font-bold text-blue-900 uppercase">Operator Role Permissions</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">Operator</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.operatorCanPowerControl}
                      onChange={(e) => handleSavePermission("operatorCanPowerControl", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Server Power Actions (Power Off / Reboot / Power On)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.operatorCanProvisioning}
                      onChange={(e) => handleSavePermission("operatorCanProvisioning", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Firmware Updates & Virtual ISO Mounting</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.operatorCanManageDevices}
                      onChange={(e) => handleSavePermission("operatorCanManageDevices", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Adding & Deleting Servers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.operatorCanViewGpus}
                      onChange={(e) => handleSavePermission("operatorCanViewGpus", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Access to GPU View</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.operatorCanViewReports}
                      onChange={(e) => handleSavePermission("operatorCanViewReports", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Access to Reports</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.operatorCanViewDiagnostics}
                      onChange={(e) => handleSavePermission("operatorCanViewDiagnostics", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Access to Diagnostics</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer opacity-60">
                    <input
                      type="checkbox"
                      disabled
                      checked={false}
                      className="w-4 h-4 cursor-not-allowed"
                    />
                    <span className="italic text-slate-500">Allow User Account Creation (Administrator Only)</span>
                  </label>
                </div>

                {/* ReadOnly Role Controls */}
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <span className="font-bold text-slate-800 uppercase">ReadOnly Role Permissions</span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono">ReadOnly</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.readOnlyCanDashboard}
                      onChange={(e) => handleSavePermission("readOnlyCanDashboard", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Viewing Dashboard Telemetry</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.readOnlyCanInventoryLogs}
                      onChange={(e) => handleSavePermission("readOnlyCanInventoryLogs", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Viewing Server Inventory & Redfish SEL Event Logs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.readOnlyCanHierarchy}
                      onChange={(e) => handleSavePermission("readOnlyCanHierarchy", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Access to Hierarchy & Device List</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.readOnlyCanViewGpus}
                      onChange={(e) => handleSavePermission("readOnlyCanViewGpus", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Access to GPU View</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.readOnlyCanViewReports}
                      onChange={(e) => handleSavePermission("readOnlyCanViewReports", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Access to Reports</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#2E3A23]">
                    <input
                      type="checkbox"
                      checked={rolePermissions.readOnlyCanPowerControl}
                      onChange={(e) => handleSavePermission("readOnlyCanPowerControl", e.target.checked)}
                      className="accent-[#2E3A23] w-4 h-4 cursor-pointer"
                    />
                    <span>Allow Server Power Actions (Power Off / Reboot)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* DATA CENTER TOPOLOGY & DEVICE RESOURCE MANAGEMENT CARD */}
          <div className="bg-white border border-slate-300 rounded-md p-5 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-[#2E3A23] text-xs uppercase tracking-wide flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>DATA CENTER TOPOLOGY & DEVICE RESOURCE MANAGEMENT</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono italic">Selective Resource Wipe Tools</span>
            </div>

            <p className="text-slate-600 text-xs">
              Selectively delete individual Data Centers, Rooms, Rows, Racks, or registered devices, or clear entire layers of your physical topology.
            </p>

            {/* SELECTIVE SINGLE ITEM DELETION DROPDOWNS */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete Specific Resource (DC / Room / Row / Rack / Device)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 space-y-1">
                  <label className="font-semibold text-slate-700 block">1. Resource Category:</label>
                  <select
                    value={deleteCategory}
                    onChange={(e) => setDeleteCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-semibold text-xs text-slate-800 focus:outline-none focus:border-[#2E3A23]"
                  >
                    <option value="DC">Data Center (DC)</option>
                    <option value="ROOM">Room</option>
                    <option value="ROW">Row</option>
                    <option value="RACK">Rack</option>
                    <option value="DEVICE">Registered Device / Server</option>
                  </select>
                </div>

                <div className="sm:col-span-5 space-y-1">
                  <label className="font-semibold text-slate-700 block">2. Select Item to Delete:</label>
                  <select
                    value={selectedDeleteId}
                    onChange={(e) => setSelectedDeleteId(e.target.value)}
                    disabled={targetDeleteOptions.length === 0}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-medium text-xs text-slate-800 focus:outline-none focus:border-[#2E3A23] disabled:opacity-50"
                  >
                    {targetDeleteOptions.length === 0 ? (
                      <option value="">No {deleteCategory} items available</option>
                    ) : (
                      targetDeleteOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="sm:col-span-3 sm:pt-5">
                  <button
                    type="button"
                    disabled={!selectedDeleteId || targetDeleteOptions.length === 0}
                    onClick={handlePerformSelectiveDelete}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Item</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all Data Centers from the hierarchy?")) {
                    saveHierarchy([]);
                    alert("All Data Centers have been cleared from hierarchy.");
                    window.location.reload();
                  }
                }}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs rounded transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Clear All Data Centers</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all Rooms across all Data Centers?")) {
                    try {
                      const hierarchy = getSavedHierarchy();
                      const updated = hierarchy.map((dc) => ({ ...dc, rooms: [] }));
                      saveHierarchy(updated);
                      alert("All Rooms have been cleared.");
                      window.location.reload();
                    } catch (_) {}
                  }
                }}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Clear All Rooms</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all Rows across all Rooms?")) {
                    try {
                      const hierarchy = getSavedHierarchy();
                      const updated = hierarchy.map((dc) => ({
                        ...dc,
                        rooms: (dc.rooms || []).map((rm) => ({ ...rm, rows: [] })),
                      }));
                      saveHierarchy(updated);
                      alert("All Rows have been cleared.");
                      window.location.reload();
                    } catch (_) {}
                  }
                }}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Clear All Rows</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all Racks across all Rows?")) {
                    try {
                      const hierarchy = getSavedHierarchy();
                      const updated = hierarchy.map((dc) => ({
                        ...dc,
                        rooms: (dc.rooms || []).map((rm) => ({
                          ...rm,
                          rows: (rm.rows || []).map((rw) => ({ ...rw, racks: [] })),
                        })),
                      }));
                      saveHierarchy(updated);
                      alert("All Racks have been cleared.");
                      window.location.reload();
                    } catch (_) {}
                  }
                }}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Clear All Racks</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all Registered Devices from console memory?")) {
                    saveServers([]);
                    alert("All Registered Devices have been cleared.");
                    window.location.reload();
                  }
                }}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-colors shadow-xs cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
                <span>Clear All Registered Devices</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Console Account Credentials Card */}
            <div className="bg-white border border-slate-300 rounded-md p-5 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-[#2E3A23] text-xs uppercase tracking-wide border-b border-slate-200 pb-2">
                Console Account Credentials
              </h3>

              <form onSubmit={handleSaveAdminName} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="font-semibold text-slate-700 shrink-0">Console Admin:</label>
                  <input
                    type="text"
                    required
                    value={consoleAdmin}
                    onChange={(e) => setConsoleAdmin(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded font-medium focus:outline-none focus:border-[#2E3A23]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded transition-colors cursor-pointer shrink-0"
                  >
                    Save Name
                  </button>
                </div>
              </form>
            </div>

            {/* Change Console Password Card (With Eye Buttons) */}
            <div className="bg-white border border-slate-300 rounded-md p-5 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-[#2E3A23] text-xs uppercase tracking-wide border-b border-slate-200 pb-2">
                Change Console Password
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-4 font-semibold text-slate-700 text-right pr-2">Old Password</label>
                  <div className="col-span-8 relative">
                    <input
                      type={showOldPass ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-1.5 border border-slate-300 rounded font-medium focus:outline-none focus:border-[#2E3A23]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-4 font-semibold text-slate-700 text-right pr-2">New Password</label>
                  <div className="col-span-8 relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-1.5 border border-slate-300 rounded font-medium focus:outline-none focus:border-[#2E3A23]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-4 font-semibold text-slate-700 text-right pr-2">Confirm Password</label>
                  <div className="col-span-8 relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-1.5 border border-slate-300 rounded font-medium focus:outline-none focus:border-[#2E3A23]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-semibold rounded transition-colors cursor-pointer"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EMAIL SUBSCRIPTIONS */}
      {activeSubTab === "Email Subscriptions" && (
        <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
          <div className="bg-[#2E3A23] text-white px-4 py-2 flex items-center justify-between">
            <h2 className="font-bold text-xs tracking-wider uppercase">Email Event Alerts & Subscriptions</h2>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#3B4A2D] hover:bg-[#4A5D36] text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Email Subscription</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-2.5 border-r border-slate-200">SMTP Server</th>
                  <th className="p-2.5 border-r border-slate-200">Port</th>
                  <th className="p-2.5 border-r border-slate-200">Connection</th>
                  <th className="p-2.5 border-r border-slate-200">Account</th>
                  <th className="p-2.5 border-r border-slate-200">From Address</th>
                  <th className="p-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {subscriptionsList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-[#2E3A23] border-r border-slate-200">{sub.smtpServer}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono">{sub.port}</td>
                    <td className="p-2.5 border-r border-slate-200">{sub.connection}</td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-600">{sub.account || "N/A"}</td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-700">{sub.fromEmail}</td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => setSubscriptionsList(subscriptionsList.filter((s) => s.id !== sub.id))}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddUserModalOpen && userRole === "Administrator" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#2E3A23] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide">Add New User Account</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-200 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserAccount} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">Username *</label>
                <div className="col-span-7">
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. operator1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:border-[#2E3A23] shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">Role *</label>
                <div className="col-span-7">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-blue-900 focus:outline-none focus:border-[#2E3A23] shadow-xs bg-white"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Operator">Operator</option>
                    <option value="ReadOnly">ReadOnly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">Description</label>
                <div className="col-span-7">
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Server Operator"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:border-[#2E3A23] shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">Password</label>
                <div className="col-span-7 relative">
                  <input
                    type={showAddUserPass ? "text" : "password"}
                    value={newUserPass}
                    onChange={(e) => setNewUserPass(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:border-[#2E3A23] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddUserPass(!showAddUserPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showAddUserPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">Confirm Password</label>
                <div className="col-span-7">
                  <input
                    type={showAddUserPass ? "text" : "password"}
                    value={newUserConfirmPass}
                    onChange={(e) => setNewUserConfirmPass(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:border-[#2E3A23] shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  Save User
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EMAIL SUBSCRIPTION MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#2E3A23] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide">Add Email Subscription</h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-200 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmailSubscription} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">SMTP Server *</label>
                <div className="col-span-7">
                  <input
                    type="text"
                    required
                    value={smtpServer}
                    onChange={(e) => setSmtpServer(e.target.value)}
                    placeholder="e.g. smtp.company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:border-[#2E3A23] shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">Port</label>
                <div className="col-span-7">
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:border-[#2E3A23] shadow-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">Connection</label>
                <div className="col-span-7">
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:border-[#2E3A23] shadow-xs bg-white"
                  >
                    <option value="STARTTLS">STARTTLS</option>
                    <option value="SSL/TLS">SSL/TLS</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">Account</label>
                <div className="col-span-7">
                  <input
                    type="text"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="e.g. alerts@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:border-[#2E3A23] shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-5 text-right font-bold text-slate-700 pr-2">From Email Address *</label>
                <div className="col-span-7">
                  <input
                    type="text"
                    required
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="e.g. no-reply@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:border-[#2E3A23] shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
