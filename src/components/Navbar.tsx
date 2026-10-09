import React from "react";
import { Search, User, LogOut, HelpCircle, ChevronDown, CheckCircle2 } from "lucide-react";

interface NavbarProps {
  currentUser: string;
  onLogout: () => void;
  onOpenAbout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function Navbar({ currentUser, onLogout, onOpenAbout, searchQuery, setSearchQuery }: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  return (
    <header className="h-14 bg-[#2E3A23] border-b border-[#1E2616] px-4 flex items-center justify-between sticky top-0 z-30 select-none text-white font-sans shadow-md">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-white text-[#2E3A23] flex items-center justify-center font-bold text-lg tracking-wider shadow-sm">
          T
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-tight text-base">TYRONE</span>
          <span className="font-medium text-slate-200 text-xs hidden sm:inline">Data Center Manager Console</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-6 relative hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Locate IP, Device, Serial, or Component..."
            className="w-full pl-9 pr-8 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A5D36] transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 text-xs font-medium">
        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1E2616] hover:bg-[#3B4A2D] text-white rounded-md transition-colors cursor-pointer border border-[#3B4A2D]"
          >
            <User className="w-3.5 h-3.5 text-emerald-200" />
            <span className="font-semibold">{currentUser}</span>
            <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-2xl border border-slate-200 py-1 z-50 text-slate-700">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{currentUser}</p>
                <p className="text-[11px] text-slate-500 font-normal">Administrator Access</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenAbout();
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 hover:text-[#2E3A23] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>About & License</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Direct Logout Button */}
        <button
          onClick={onLogout}
          title="Logout"
          className="p-1.5 text-emerald-200 hover:text-white hover:bg-[#3B4A2D] rounded-md transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
