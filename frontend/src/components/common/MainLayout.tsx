import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { api } from '../../api/client';
import { LogOut, ShieldAlert, X, Power } from 'lucide-react';

export const MainLayout = () => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userName, setUserName] = useState('DEV');

  // Load the authenticated user's name on component mount
  useEffect(() => {
    const cachedProfile = localStorage.getItem('aabit_user_profile');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (parsed?.name) {
          // Capitalize name to keep it uniform with terminal aesthetics
          setUserName(parsed.name.toUpperCase());
        }
      } catch (err) {
        console.error("Failed to parse user profile context string", err);
      }
    }
  }, []);

  const handleSystemLogout = async () => {
    try {
      // 1. Flush active security contexts on the Spring Boot backend thread pool [cite: 2266]
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Context clearing bypassed or server offline", err);
    } finally {
      // 2. Clear token states from local browser memory cache arrays [cite: 2264]
      localStorage.removeItem('aabit_session_token');
      localStorage.removeItem('aabit_user_profile');
      
      // 3. Force redirect straight back onto the public identity gateway lock screen 
      window.location.href = '/auth';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans p-4 md:p-8 flex flex-col items-center selection:bg-neutral-800 selection:text-white">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        
        {/* Dynamic Multi-State System Status Bar Layout [cite: 2270] */}
        <div className="relative overflow-hidden border-b border-neutral-800 pb-2 tracking-wider min-h-[28px]">
          
          {/* State A: Baseline Operational Metrics Row */}
          <div className={`flex items-center justify-between text-[11px] font-mono text-neutral-500 transition-all duration-200 transform ${
            showLogoutConfirm ? '-translate-y-8 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-neutral-400 font-bold tracking-tight">{userName}</span>
              <span className="text-neutral-600">//</span>
              <span>COGNITIVE_CORE_V1</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:block select-none">
                {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' })}
              </div>
              
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 text-[10px] text-red-500/80 hover:text-red-400 font-bold border border-red-950/40 hover:border-red-900/60 bg-red-950/10 hover:bg-red-950/30 px-2.5 py-0.5 rounded transition-all outline-none cursor-pointer"
                title="Trigger System Logout"
              >
                <LogOut size={11} /> [ SHUTDOWN ]
              </button>
            </div>
          </div>

          {/* State B: Modern Inline Session Termination Guard Drawer */}
          <div className={`absolute inset-0 flex items-center justify-between text-[11px] font-mono bg-red-950/10 border border-red-900/30 rounded px-3 py-0.5 transition-all duration-200 transform ${
            showLogoutConfirm ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <ShieldAlert size={12} className="animate-bounce" />
              <span>TERMINATE_SECURE_SESSION_CORE?</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white border border-neutral-800 bg-neutral-900 px-2 py-0.5 rounded transition-all outline-none cursor-pointer"
              >
                <X size={10} /> ABORT
              </button>
              <button
                onClick={handleSystemLogout}
                className="flex items-center gap-1 text-[10px] bg-red-600 hover:bg-red-500 text-white font-bold px-2.5 py-0.5 rounded shadow-lg shadow-red-950/50 transition-all outline-none cursor-pointer"
              >
                <Power size={10} /> CONFIRM
              </button>
            </div>
          </div>

        </div>

        {/* Master Active Module Screen Mount Point Slot [cite: 2271] */}
        <main className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Outlet />
        </main>

      </div>
    </div>
  );
};