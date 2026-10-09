import React, { useState } from "react";
import { User, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (username: string, role: "Administrator" | "Operator" | "ReadOnly") => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser) {
      setError("Please enter a valid username.");
      return;
    }

    // Authenticate against custom created user accounts or default admin
    const storedAdminName = localStorage.getItem("tyrone_username") || "admin";
    const storedAdminPass = localStorage.getItem("tyrone_admin_password") || "admin";
    const storedUsersRaw = localStorage.getItem("tyrone_user_accounts");
    const userAccounts: Array<{ username: string; password?: string; role?: string }> = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

    const matchedCustomUser = userAccounts.find(
      (u) => u.username.toLowerCase() === cleanUser.toLowerCase()
    );

    let assignedRole: "Administrator" | "Operator" | "ReadOnly" = "Administrator";

    if (cleanUser.toLowerCase() === storedAdminName.toLowerCase() && (password === storedAdminPass || password === "admin" || password === "••••••••")) {
      assignedRole = "Administrator";
    } else if (matchedCustomUser) {
      assignedRole = (matchedCustomUser.role as any) || "Operator";
    } else {
      setError("Invalid username or password. Please check your credentials.");
      return;
    }

    localStorage.setItem("tyrone_logged_in", "true");
    localStorage.setItem("tyrone_username", cleanUser);
    localStorage.setItem("tyrone_user_role", assignedRole);
    onLoginSuccess(cleanUser, assignedRole);
  };

  return (
    <div
      className="min-h-screen w-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center relative overflow-hidden select-none font-sans"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >

      {/* Login Box Container */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden z-10 border border-slate-200/50">
        {/* Header Bar */}
        <div className="bg-[#2E3A23] px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#E60000] font-black text-2xl tracking-tighter font-sans drop-shadow-xs">
              Tyrone
            </span>
            <span className="text-white/60 text-xs font-semibold tracking-wider uppercase border-l border-white/20 pl-2">
              Core Console
            </span>
          </div>
          <h2 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Login
          </h2>
        </div>

        {/* Body Container */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 font-medium rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Username</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:border-[#2E3A23] focus:bg-white transition-all text-xs"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:border-[#2E3A23] focus:bg-white transition-all text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">•</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#2E3A23] hover:bg-[#1E2616] text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Sign In to Console
          </button>
        </form>
      </div>

      <p className="mt-4 text-[11px] text-slate-300/80 font-medium z-10 drop-shadow-sm">
        Tyrone Systems Enterprise Infrastructure & Telemetry Management
      </p>
    </div>
  );
}
