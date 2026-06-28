import { Sliders, ShieldCheck } from 'lucide-react';
import { vault } from '../../utils/vaultCrypto';
import { RegeneratePhraseCard } from './RegeneratePhraseCard';

export const SettingsDashboard = () => {
  const isVaultUnlocked = vault.isOpen();

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      
      {/* Header Container */}
      <div className="flex justify-between items-center bg-neutral-950/40 p-4 rounded-xl border border-neutral-900">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders size={20} className="text-neutral-400" /> System Settings
          </h2>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Configure application variables and zero-knowledge vault contexts.
          </p>
        </div>
      </div>

      {/* Grid Allocation Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Module Area A: Security & Cryptography Configuration */}
        <div className="border border-neutral-900 bg-neutral-950/20 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-900 pb-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-400" /> Security & Cryptography
          </h3>

          {isVaultUnlocked ? (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
                Your browser session currently holds an authenticated <span className="text-green-400">CryptoKey</span> container instance in volatile memory. You can run operations below.
              </p>
              <RegeneratePhraseCard />
            </div>
          ) : (
            <div className="border border-dashed border-neutral-800 rounded-lg p-6 text-center text-neutral-500 font-mono text-xs">
              🔒 Experience Vault is locked. 
              <p className="text-[10px] text-neutral-600 mt-1">
                Navigate back to the Experience tab and supply your PIN to unlock configuration cards.
              </p>
            </div>
          )}
        </div>

        {/* Module Area B: Interface Preferences (Future Expandability Slot) */}
        <div className="border border-neutral-900 bg-neutral-950/20 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-900 pb-2">
            ⚙ Application Environment
          </h3>
          <div className="text-[11px] font-mono text-neutral-500 space-y-2">
            <div className="flex justify-between border-b border-neutral-900/60 pb-1.5">
              <span>CORE_VERSION:</span>
              <span className="text-white">V1.0.0-RELEASE</span>
            </div>
            <div className="flex justify-between border-b border-neutral-900/60 pb-1.5">
              <span>ENVIRONMENT:</span>
              <span className="text-green-500">PRODUCTION_SECURE</span>
            </div>
            <div className="flex justify-between pb-0.5">
              <span>CRYPTO_STANDARD:</span>
              <span className="text-blue-400">AES-GCM-256 (WebCrypto)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};