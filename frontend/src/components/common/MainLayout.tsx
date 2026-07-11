import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Layers, Settings, Menu, BarChart2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Position { x: number; y: number }

const STORAGE_KEY = 'aabit_dock_position';
const DEFAULT_POS: Position = { x: window.innerWidth - 64, y: window.innerHeight / 2 };

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function loadPosition(): Position {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Position;
      // Re-clamp in case window was resized since last save
      return {
        x: clamp(p.x, 0, window.innerWidth  - 48),
        y: clamp(p.y, 0, window.innerHeight - 48),
      };
    }
  } catch {}
  return DEFAULT_POS;
}

// ─── Floating Dock ────────────────────────────────────────────────────────────
const FloatingDock = () => {
  const [pos, setPos]         = useState<Position>(loadPosition);
  const [expanded, setExpanded] = useState(false);
  const [userName, setUserName] = useState('DEV');
  const navigate  = useNavigate();
  const location  = useLocation();

  // Drag state — stored in refs so pointer handlers don't need re-creation
  const dragging    = useRef(false);
  const dragOffset  = useRef<Position>({ x: 0, y: 0 });
  const hasMoved    = useRef(false);          // distinguish drag vs click
  const dockRef     = useRef<HTMLDivElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = localStorage.getItem('aabit_user_profile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.name) setUserName(parsed.name.split(' ')[0].toUpperCase());
      } catch {}
    }
  }, []);

  // Close panel on outside click/tap
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e instanceof TouchEvent ? e.touches[0]?.target : e.target;
      if (dockRef.current && !dockRef.current.contains(target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Re-clamp position on window resize
  useEffect(() => {
    const handleResize = () => {
      setPos(p => {
        const nextPos = {
          x: clamp(p.x, 0, window.innerWidth - 48),
          y: clamp(p.y, 0, window.innerHeight - 48),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPos));
        return nextPos;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Pointer drag handlers ──────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    // Only drag with primary button / single touch
    if (e.button > 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current  = true;
    hasMoved.current  = false;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    hasMoved.current = true;
    const nextX = clamp(e.clientX - dragOffset.current.x, 0, window.innerWidth  - 48);
    const nextY = clamp(e.clientY - dragOffset.current.y, 0, window.innerHeight - 48);
    setPos({ x: nextX, y: nextY });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    // Persist the new position
    const nextPos: Position = {
      x: clamp(e.clientX - dragOffset.current.x, 0, window.innerWidth  - 48),
      y: clamp(e.clientY - dragOffset.current.y, 0, window.innerHeight - 48),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPos));

    // Only toggle menu if the user didn't actually drag
    if (!hasMoved.current) {
      setExpanded(v => !v);
    }
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/',           icon: Activity,  label: 'Journal'    },
    { path: '/sprints',    icon: Layers,    label: 'Sprints'    },
    { path: '/visualizer', icon: BarChart2, label: 'Visualizer' },
    { path: '/settings',   icon: Settings,  label: 'Settings'   },
  ];

  // Decide whether panel opens left or right based on dock position
  const openLeft = pos.x > window.innerWidth / 2;

  return (
    <div
      ref={dockRef}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
    >
      {/* ── Expanded nav panel ─────────────────────────────────────────────── */}
      {expanded && (
        <div
          ref={panelRef}
          style={{ [openLeft ? 'right' : 'left']: 52 }}
          className={`
            absolute top-1/2 -translate-y-1/2
            flex flex-col gap-0.5
            bg-neutral-950 border border-neutral-800
            rounded-xl shadow-2xl shadow-black/60 backdrop-blur-md
            py-2 w-44 animate-in fade-in zoom-in-95 duration-150 origin-left max-w-[calc(100vw-64px)]
          `}
        >
          {/* User chip */}
          <div className="px-4 pt-2 pb-2 border-b border-neutral-800 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0">
                {userName[0]}
              </div>
              <span className="text-xs font-semibold text-neutral-300 tracking-wide truncate">{userName}</span>
            </div>
          </div>

          {/* Nav items */}
          <div className="px-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setExpanded(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5 ${
                  isActive(path)
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon size={13} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Draggable toggle button ─────────────────────────────────────────── */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: 'none', cursor: dragging.current ? 'grabbing' : 'grab' }}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          border shadow-lg shadow-black/50 transition-colors duration-150 select-none
          ${expanded
            ? 'bg-neutral-800 border-neutral-600 text-white'
            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600'
          }
        `}
        title="Menu (drag to move)"
      >
        <Menu size={16} />
      </button>
    </div>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-os-bg text-os-text font-sans selection:bg-neutral-800 selection:text-white">
      <FloatingDock />
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-6 md:py-10">
        <main className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};