import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { LogOut, ShieldAlert, X, Power, Layers, Activity, Settings } from 'lucide-react';
import { useFontSize } from './FontSizeContext';
import { vault } from '../../utils/vaultCrypto';

export const MainLayout = () => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userName, setUserName] = useState('DEV');
  const { fontSize, increaseFontSize, decreaseFontSize } = useFontSize();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const cachedProfile = localStorage.getItem('aabit_user_profile');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (parsed?.name) {
          setUserName(parsed.name.toUpperCase());
        }
      } catch (err) {
        console.error("Failed to parse user profile context string", err);
      }
    }
  }, []);

  const handleSystemLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Context clearing bypassed or server offline", err);
    } finally {
      // 1. Wipe volatile, in-memory cryptographic master keys safely
      vault.lock();

      // 2. Clear out persistent identity and operational tokens
      localStorage.removeItem('aabit_session_token');
      localStorage.removeItem('aabit_user_profile');
      
      // 3. Clear out all variant initialization flags and tracking states
      localStorage.removeItem('aabit_vault_init');
      localStorage.removeItem('aabit_vault_initialized');
      localStorage.removeItem('isAuthenticated');

      // 4. Clear residual wrapped local envelopes out entirely
      localStorage.removeItem('aabit_vault_pin_wrapped');
      localStorage.removeItem('aabit_vault_phrase_wrapped');

      window.location.href = '/auth';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans p-3 sm:p-6 md:p-8 flex flex-col items-center selection:bg-neutral-800 selection:text-white">
      <div className="w-full max-w-[95vw] sm:max-w-7xl flex flex-col gap-5 transition-all duration-300">

        {/* Dynamic Multi-State System Status Bar Layout */}
        <div className="relative overflow-hidden border-b border-neutral-800 pb-3 tracking-wider min-h-[40px] sm:min-h-[28px]">

          {/* State A: Responsive Grid Row */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-neutral-500 transition-all duration-200 transform ${
            showLogoutConfirm ? '-translate-y-12 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}>
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-neutral-400 font-bold tracking-tight">{userName}</span>
                <span className="text-neutral-600">//</span>
                <span>COGNITIVE_CORE_V1</span>
              </div>
              <div className="sm:hidden text-neutral-600 text-[10px]">
                {new Date().toLocaleDateString([], { month: 'short', day: '2-digit' })}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-neutral-900/60 pt-2 sm:pt-0 sm:border-0">
              {/* Font Scaler Controls Container */}
              <div className="flex items-center border border-neutral-800/60 bg-neutral-900/40 rounded px-1.5 py-0.5 gap-2 text-[10px]">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize === 'sm'}
                  className="hover:text-white font-bold disabled:opacity-30 transition-all cursor-pointer outline-none px-0.5"
                  title="Scale Font Down"
                >
                  A-
                </button>
                <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest select-none">
                  {fontSize}
                </span>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize === 'xl'}
                  className="hover:text-white font-bold disabled:opacity-30 transition-all cursor-pointer outline-none px-0.5"
                  title="Scale Font Up"
                >
                  A+
                </button>
              </div>

              <div className="hidden sm:block select-none text-neutral-400">
                {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' })}
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 text-[10px] text-red-500/80 hover:text-red-400 font-bold border border-red-950/40 hover:border-red-900/60 bg-red-950/10 hover:bg-red-950/30 px-2.5 py-0.5 rounded transition-all outline-none cursor-pointer"
              >
                <LogOut size={11} /> [ SHUTDOWN ]
              </button>
            </div>
          </div>

          {/* State B: Session Termination Drawer */}
          <div className={`absolute inset-0 flex items-center justify-between text-[11px] font-mono bg-red-950/10 border border-red-900/30 rounded px-3 py-1 transition-all duration-200 transform ${
            showLogoutConfirm ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <ShieldAlert size={12} className="animate-bounce" />
              <span className="hidden sm:inline">TERMINATE_SECURE_SESSION_CORE?</span>
              <span className="sm:hidden text-[10px]">SHUTDOWN CORE?</span>
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

        {/* Plug-and-Play Cyberpunk 4-Tabbed Navigation Bar */}
        <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center justify-center gap-1.5 py-2 border rounded transition-all cursor-pointer ${
              isActive('/') ? 'bg-neutral-900 border-neutral-700 text-white shadow-sm font-bold' : 'border-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-800 bg-black'
            }`}
          >
            <Activity size={12} />
            <span>EXPERIENCE</span>
          </button>


          <button
            onClick={() => navigate('/sprints')}
            className={`flex items-center justify-center gap-1.5 py-2 border rounded transition-all cursor-pointer ${
              isActive('/sprints') ? 'bg-neutral-900 border-neutral-700 text-white shadow-sm font-bold' : 'border-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-800 bg-black'
            }`}
          >
            <Layers size={12} />
            <span>SPRINTS</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className={`flex items-center justify-center gap-1.5 py-2 border rounded transition-all cursor-pointer ${
              isActive('/settings') ? 'bg-neutral-900 border-neutral-700 text-white shadow-sm font-bold' : 'border-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-800 bg-black'
            }`}
          >
            <Settings size={12} />
            <span>SETTINGS</span>
          </button>
        </div>

        {/* Master Screen Mount Slot */}
        <main className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Outlet />
        </main>

      </div>
    </div>
  );
};