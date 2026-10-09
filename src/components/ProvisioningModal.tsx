import React, { useState } from "react";
import { X, Upload, Disc, Cpu, CheckCircle2 } from "lucide-react";
import { ServerDevice } from "../types";

interface ProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: ServerDevice | null;
}

export function ProvisioningModal({ isOpen, onClose, server }: ProvisioningModalProps) {
  const [activeTab, setActiveTab] = useState<"FIRMWARE" | "MOUNT_ISO">("FIRMWARE");

  // Firmware Update Form State
  const [memo, setMemo] = useState("");
  const [schedule, setSchedule] = useState<"NOW" | "SPECIFIC_TIME">("NOW");
  const [component, setComponent] = useState("Management Module Firmware (BMC)");
  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);
  const [autoReset, setAutoReset] = useState(true);

  // Mount ISO Form State
  const [isoMemo, setIsoMemo] = useState("");
  const [isoFile, setIsoFile] = useState<File | null>(null);
  const [isoUrl, setIsoUrl] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isoSchedule, setIsoSchedule] = useState<"NOW" | "SPECIFIC_TIME">("NOW");
  const [rebootToIso, setRebootToIso] = useState(true);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !server) return null;

  const handleUploadFirmware = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStatusMessage("Uploading & flashing firmware via Redfish UpdateService...");

    setTimeout(() => {
      setIsProcessing(false);
      setStatusMessage(`Firmware update successfully deployed to ${server.name} (${server.ip}). Component: ${component}`);
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 2500);
    }, 2000);
  };

  const handleMountIso = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStatusMessage("Mounting virtual media ISO via Redfish VirtualMedia service...");

    setTimeout(() => {
      setIsProcessing(false);
      setStatusMessage(`ISO image successfully mounted to ${server.name} (${server.ip}). Rebooting to ISO...`);
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 2500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar (Matching Image 2/3) */}
        <div className="bg-[#2E3A23] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-300" />
            <h3 className="font-bold text-sm tracking-wide">Provisioning — {server.name} ({server.ip})</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-200 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Tabs: Firmware Update | Mount ISO */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("FIRMWARE")}
            className={`px-4 py-2 rounded-t-md transition-all cursor-pointer border ${
              activeTab === "FIRMWARE"
                ? "bg-white text-[#2E3A23] border-slate-300 border-b-white font-extrabold shadow-2xs"
                : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
            }`}
          >
            Firmware Update
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MOUNT_ISO")}
            className={`px-4 py-2 rounded-t-md transition-all cursor-pointer border ${
              activeTab === "MOUNT_ISO"
                ? "bg-white text-[#2E3A23] border-slate-300 border-b-white font-extrabold shadow-2xs"
                : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
            }`}
          >
            Mount ISO
          </button>
        </div>

        {statusMessage && (
          <div className="m-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* SUB-TAB 1: FIRMWARE UPDATE (Matching Image 2) */}
        {activeTab === "FIRMWARE" && (
          <form onSubmit={handleUploadFirmware} className="p-6 space-y-4 text-xs font-medium text-slate-700">
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-4 text-right font-bold text-slate-700 pr-2">Model:</label>
              <div className="col-span-8">
                <input
                  type="text"
                  readOnly
                  value={server.model || "DCMI Tyrone Systems - MD300A3R-212"}
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-4 text-right font-bold text-slate-700 pr-2">Memo:</label>
              <div className="col-span-8">
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Enter memo description"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#2E3A23]"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-4 text-right font-bold text-slate-700 pr-2">Schedule:</label>
              <div className="col-span-8 flex items-center gap-4 font-semibold text-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="fwSchedule"
                    checked={schedule === "NOW"}
                    onChange={() => setSchedule("NOW")}
                    className="accent-[#2E3A23]"
                  />
                  <span>Now</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="fwSchedule"
                    checked={schedule === "SPECIFIC_TIME"}
                    onChange={() => setSchedule("SPECIFIC_TIME")}
                    className="accent-[#2E3A23]"
                  />
                  <span>Specific Time</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-4 text-right font-bold text-slate-700 pr-2">Component:</label>
              <div className="col-span-8">
                <select
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#2E3A23]"
                >
                  <option value="Management Module Firmware (BMC)">Management Module Firmware (BMC)</option>
                  <option value="System BIOS Firmware">System BIOS Firmware</option>
                  <option value="CPLD Firmware Module">CPLD Firmware Module</option>
                </select>
              </div>
            </div>

            {/* Drag & Drop File Upload Box */}
            <div className="grid grid-cols-12 gap-3 items-start">
              <label className="col-span-4 text-right font-bold text-slate-700 pr-2 pt-2">Upload Firmware File:</label>
              <div className="col-span-8 space-y-1">
                <label className="border-2 border-dashed border-slate-300 hover:border-[#2E3A23] rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all">
                  <Upload className="w-7 h-7 text-slate-400 mb-2" />
                  <span className="font-bold text-[#C8102E] hover:underline">
                    {firmwareFile ? firmwareFile.name : "Click to browse or drop firmware file"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal mt-1">
                    Supports .bin, .hex, .iso, .img, .hpm, .zip firmware images
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files && setFirmwareFile(e.target.files[0])}
                  />
                </label>
                <p className="text-[10px] text-slate-500 italic">
                  {firmwareFile ? `Selected file: ${firmwareFile.name} (${(firmwareFile.size / 1024 / 1024).toFixed(2)} MB)` : "No firmware binary selected. Choose a local firmware file to upload."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center pt-1">
              <div className="col-span-4"></div>
              <div className="col-span-8">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReset}
                    onChange={(e) => setAutoReset(e.target.checked)}
                    className="accent-[#2E3A23] w-4 h-4"
                  />
                  <span>Automatically Reset Server After Flashing</span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-bold text-xs rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessing ? "Flashing..." : "Upload & Update Firmware"}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-md transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* SUB-TAB 2: MOUNT ISO (Matching Image 3) */}
        {activeTab === "MOUNT_ISO" && (
          <form onSubmit={handleMountIso} className="p-6 space-y-4 text-xs font-medium text-slate-700">
            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-4 text-right font-bold text-slate-700 pr-2">Memo:</label>
              <div className="col-span-8">
                <input
                  type="text"
                  value={isoMemo}
                  onChange={(e) => setIsoMemo(e.target.value)}
                  placeholder="Enter memo description"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#2E3A23]"
                />
              </div>
            </div>

            {/* Upload ISO Box OR URL Input */}
            <div className="grid grid-cols-12 gap-3 items-start">
              <label className="col-span-4 text-right font-bold text-slate-700 pr-2 pt-2">Upload ISO File / URL:</label>
              <div className="col-span-8 space-y-2">
                <label className="border-2 border-dashed border-slate-300 hover:border-[#2E3A23] rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all">
                  <Disc className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="font-bold text-[#C8102E] hover:underline">
                    {isoFile ? isoFile.name : "Click to browse or drop ISO file"}
                  </span>
                  <input
                    type="file"
                    accept=".iso,.img"
                    className="hidden"
                    onChange={(e) => e.target.files && setIsoFile(e.target.files[0])}
                  />
                </label>

                <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  OR
                </div>

                <input
                  type="text"
                  value={isoUrl}
                  onChange={(e) => setIsoUrl(e.target.value)}
                  placeholder="Enter ISO Image URL (e.g. http://172.16.12.10/iso/ubuntu.iso)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#2E3A23] font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-4 text-right font-bold text-slate-700 pr-2">File Server Auth:</label>
              <div className="col-span-8 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#2E3A23]"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#2E3A23]"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              <label className="col-span-4 text-right font-bold text-slate-700 pr-2">Schedule:</label>
              <div className="col-span-8 flex items-center gap-4 font-semibold text-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isoSchedule"
                    checked={isoSchedule === "NOW"}
                    onChange={() => setIsoSchedule("NOW")}
                    className="accent-[#2E3A23]"
                  />
                  <span>Now</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isoSchedule"
                    checked={isoSchedule === "SPECIFIC_TIME"}
                    onChange={() => setIsoSchedule("SPECIFIC_TIME")}
                    className="accent-[#2E3A23]"
                  />
                  <span>Specific Time</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center pt-1">
              <div className="col-span-4"></div>
              <div className="col-span-8">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rebootToIso}
                    onChange={(e) => setRebootToIso(e.target.checked)}
                    className="accent-[#2E3A23] w-4 h-4"
                  />
                  <span>Reboot to the ISO</span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2 bg-[#2E3A23] hover:bg-[#3B4A2D] text-white font-bold text-xs rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Disc className="w-3.5 h-3.5" />
                <span>{isProcessing ? "Mounting..." : "OK"}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-md transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
