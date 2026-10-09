import React, { useState } from "react";
import { X, Check } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverCount: number;
}

export function AboutModal({ isOpen, onClose, serverCount }: AboutModalProps) {
  const [activeTab, setActiveTab] = useState<"about" | "license" | "types" | "contact">("about");

  if (!isOpen) return null;

  const licenseFeatures = [
    { name: "Inventory", basic: true, standard: true, premium: true },
    { name: "Health", basic: true, standard: true, premium: true },
    { name: "Power", basic: false, standard: true, premium: true },
    { name: "Thermal", basic: false, standard: true, premium: true },
    { name: "Web UI", basic: true, standard: true, premium: true },
    { name: "RESTful API", basic: true, standard: true, premium: true },
    { name: "Reliability", basic: false, standard: true, premium: true },
    { name: "Provisioning", basic: false, standard: false, premium: true },
    { name: "Tenant Mode", basic: false, standard: false, premium: true },
    { name: "GPU Mode", basic: false, standard: true, premium: true },
    { name: "Data Streaming", basic: false, standard: false, premium: true }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2E3A23] flex items-center justify-center text-white font-extrabold text-base shadow-sm">
              T
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">About TYRONE Data Center Manager</h3>
              <p className="text-xs text-slate-500 font-medium">Console v6.2.0 Enterprise</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab("about")}
            className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "about" ? "border-[#2E3A23] text-[#2E3A23]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            About DCM
          </button>
          <button
            onClick={() => setActiveTab("license")}
            className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "license" ? "border-[#2E3A23] text-[#2E3A23]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            License Information
          </button>
          <button
            onClick={() => setActiveTab("types")}
            className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "types" ? "border-[#2E3A23] text-[#2E3A23]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            License Types
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "contact" ? "border-[#2E3A23] text-[#2E3A23]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Contact Us
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-xs text-slate-700 space-y-4">
          {activeTab === "about" && (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                <span className="font-bold text-[#2E3A23] text-sm block">Version Information</span>
                <p className="text-slate-700 font-medium">Product Name: Tyrone Data Center Manager Console</p>
                <p className="text-slate-700 font-medium">Product Version: 6.2.0-AsD10.08</p>
                <p className="text-emerald-700 font-bold mt-1">License Status: VALID (Enterprise Perpetual)</p>
              </div>
            </div>
          )}

          {activeTab === "license" && (
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-bold text-slate-500">Maximum Device Limit:</span>
                <span className="font-mono font-bold text-slate-900">1000 Devices</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-bold text-slate-500">Consumed Device Licenses:</span>
                <span className="font-mono font-bold text-[#2E3A23]">{serverCount} Devices</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-bold text-slate-500">Expiration Date:</span>
                <span className="font-mono font-bold text-slate-900">2035-12-31</span>
              </div>
            </div>
          )}

          {activeTab === "types" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="p-2">Feature</th>
                    <th className="p-2 text-center">Basic</th>
                    <th className="p-2 text-center">Standard</th>
                    <th className="p-2 text-center text-[#2E3A23]">Premium (Active)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {licenseFeatures.map((f) => (
                    <tr key={f.name} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-800">{f.name}</td>
                      <td className="p-2 text-center">{f.basic ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : "—"}</td>
                      <td className="p-2 text-center">{f.standard ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : "—"}</td>
                      <td className="p-2 text-center">{f.premium ? <Check className="w-4 h-4 text-[#2E3A23] mx-auto font-bold" /> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-3">
              <p className="font-semibold text-slate-800">
                For product support and sales inquiries regarding Tyrone servers and DCM licenses, reach out to our team:
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 font-medium text-slate-700">
                <p>Support Email: <a href="mailto:support@netwebindia.com" className="text-[#2E3A23] font-bold">support@netwebindia.com</a></p>
                <p>Sales Email: <a href="mailto:sales@netwebindia.com" className="text-[#2E3A23] font-bold">sales@netwebindia.com</a></p>
                <p>Official Website: <a href="https://www.tyronesystems.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">www.tyronesystems.com</a></p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium">
          Copyright © 2026 Netweb Technologies India Ltd. All rights reserved.
        </div>
      </div>
    </div>
  );
}
