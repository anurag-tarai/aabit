import { useState } from 'react';
import { Settings as SettingsIcon, Type, ShieldCheck, LogOut, X } from 'lucide-react';
import { useFontSize } from './FontSizeContext';
import { useTheme, type Theme } from './ThemeContext';
import { vault } from '../../utils/vaultCrypto';
import { api } from '../../api/client';
import { RegeneratePhraseCard } from './RegeneratePhraseCard';

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children,
}) => (
  <div className="border border-neutral-800 bg-neutral-950 rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-800">
      <span className="text-neutral-500">{icon}</span>
      <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-neutral-500">{title}</span>
    </div>
    <div className="px-5 py-4 flex flex-col gap-4">
      {children}
    </div>
  </div>
);

// ─── Row ──────────────────────────────────────────────────────────────────────
const Row: React.FC<{ label: string; right: React.ReactNode }> = ({ label, right }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-neutral-300 font-medium">{label}</span>
    </div>
    <div className="flex-shrink-0">{right}</div>
  </div>
);

// ─── Theme Selector ───────────────────────────────────────────────────────────
const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const themes: { value: Theme, label: string }[] = [
    { value: 'default', label: 'Stark Dark' },
    { value: 'matte-teal', label: 'Matte Teal' },
    { value: 'matte-charcoal', label: 'Matte Charcoal' },
    { value: 'midnight-purple', label: 'Midnight Purple' },
    { value: 'light-classic', label: 'Classic Light' },
  ];

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 text-sm outline-none hover:border-neutral-600 transition-colors cursor-pointer"
    >
      {themes.map(t => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>
  );
};

// ─── Font size stepper ────────────────────────────────────────────────────────
const FontStepper: React.FC = () => {
  const { fontSize, increaseFontSize, decreaseFontSize } = useFontSize();
  const sizes = ['sm', 'base', 'lg', 'xl', '2xl', '3xl'];
  const idx   = sizes.indexOf(fontSize);
  const labels: Record<string, string> = { sm: 'Small', base: 'Default', lg: 'Large', xl: 'X-Large', '2xl': '2X-Large', '3xl': '3X-Large' };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={decreaseFontSize}
        disabled={idx === 0}
        className="w-7 h-7 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-25 transition-colors flex items-center justify-center text-sm font-bold"
      >
        −
      </button>
      <span className="text-xs font-mono text-neutral-300 w-16 text-center">{labels[fontSize]}</span>
      <button
        onClick={increaseFontSize}
        disabled={idx === sizes.length - 1}
        className="w-7 h-7 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-25 transition-colors flex items-center justify-center text-sm font-bold"
      >
        +
      </button>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export const Settings: React.FC = () => {
  const isVaultUnlocked = vault.isOpen();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showVaultInfo, setShowVaultInfo] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await api.post('/auth/logout'); } catch {}
    vault.lock();
    ['aabit_session_token','aabit_user_profile','aabit_vault_init',
     'aabit_vault_initialized','isAuthenticated','aabit_vault_pin_wrapped',
     'aabit_vault_phrase_wrapped'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/auth';
  };

  return (
    <div className="flex flex-col gap-5 max-w-xl animate-in fade-in duration-200">

      {/* Page title */}
      <div className="flex items-center gap-3 mb-1">
        <SettingsIcon size={18} className="text-neutral-500" />
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Settings</h1>
        </div>
      </div>

      {/* ── Appearance ───────────────────────────────────────────────────────── */}
      <Section title="Appearance" icon={<Type size={13} />}>
        <Row
          label="Color Theme"
          right={<ThemeSelector />}
        />
        <div className="border-t border-neutral-800 my-1" />
        <Row
          label="Text size"
          right={<FontStepper />}
        />
      </Section>

      {/* ── Security & Vault ─────────────────────────────────────────────────── */}
      <Section title="Security & Vault" icon={<ShieldCheck size={13} />}>
        {isVaultUnlocked ? (
          <>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-mono text-emerald-600">Vault unlocked</span>
              </div>
              <button onClick={() => setShowVaultInfo(true)} className="text-[10px] text-emerald-500 hover:text-emerald-400 font-mono underline underline-offset-2">
                Read about Vault
              </button>
            </div>
            <RegeneratePhraseCard />
          </>
        ) : (
          <div className="border border-dashed border-neutral-800 rounded-xl p-5 text-center">
            <p className="text-neutral-600 font-mono text-xs">Vault is locked.</p>
          </div>
        )}
      </Section>

      {/* ── Session ──────────────────────────────────────────────────────────── */}
      <Section title="Session" icon={<LogOut size={13} />}>
        <Row
          label="Sign out"
          right={
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-950/30 hover:border-red-800 transition-colors text-xs font-mono font-bold disabled:opacity-40"
            >
              <LogOut size={12} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          }
        />
      </Section>

      <div className="flex gap-4 text-[10px] font-mono text-neutral-700 px-1">
        <span>V1.0.0</span>
      </div>

      {showVaultInfo && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl max-w-sm w-full p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">The Experience Vault</h2>
              <button onClick={() => setShowVaultInfo(false)} className="text-neutral-500 hover:text-white"><X size={14} /></button>
            </div>
            <div className="text-xs text-neutral-400 space-y-3 leading-relaxed">
              <p>Your journal entries are <strong>end-to-end encrypted</strong> using AES-GCM-256 cryptography.</p>
              <p>Your encryption key is derived directly from your PIN or recovery phrase and never leaves your device. The server only sees locked ciphertext.</p>
              <p>Because it is a <strong>zero-knowledge architecture</strong>, losing your recovery phrase means permanently losing access to your journal entries.</p>
            </div>
            <div className="flex justify-end mt-2">
              <button onClick={() => setShowVaultInfo(false)} className="px-4 py-2 bg-neutral-800 text-white rounded text-xs font-medium hover:bg-neutral-700">Got it</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};