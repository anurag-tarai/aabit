import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Copy, Check, Loader2, AlertTriangle } from "lucide-react";
import {
  generateMasterKey,
  generateRecoveryPhrase,
  wrapMasterKey,
  vault,
  VAULT_LS,
} from "../../utils/vaultCrypto";
import { api } from "../../api/client";
import { runMigration } from "../../utils/vaultMigration";

interface Props {
  onComplete: () => void;
}

type Step = "INTRO" | "PIN" | "PHRASE" | "SAVING";

export const VaultSetupModal = ({ onComplete }: Props) => {
  const [step, setStep] = useState<Step>("INTRO");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [copied, setCopied] = useState(false);
  const [phraseAcked, setPhraseAcked] = useState(false);
  const [error, setError] = useState("");
  const [migrationMsg, setMigrationMsg] = useState("");

  // ── UI Frontend Validation Rules ──
  const hasWhitespace = /\s/.test(pin) || /\s/.test(pinConfirm);
  
  // 💡 FIXED: Real-time validation warning rule for mismatching inputs
  const pinMismatchError = pin.length >= 4 && pinConfirm.length >= 4 && pin !== pinConfirm;
  
  const isPinInvalid = pin.length < 4 || pin !== pinConfirm || hasWhitespace;

  const handlePinNext = () => {
    if (hasWhitespace) {
      setError("Whitespaces/spaces are strictly prohibited in security keys.");
      return;
    }
    if (pin.length < 4) {
      setError("PIN must be at least 4 characters.");
      return;
    }
    if (pin !== pinConfirm) {
      setError("PINs do not match.");
      return;
    }
    setError("");
    setPhrase(generateRecoveryPhrase());
    setStep("PHRASE");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinalize = async () => {
    if (!phraseAcked) {
      setError("Please confirm you have saved your recovery phrase.");
      return;
    }
    setError("");
    setStep("SAVING");
    try {
      const masterKey = await generateMasterKey();
      const [pinWrapped, phraseWrapped] = await Promise.all([
        wrapMasterKey(masterKey, pin),
        wrapMasterKey(masterKey, phrase),
      ]);

      await api.put("/user/vault-setup", {
        vaultPinWrapped: pinWrapped,
        vaultPhraseWrapped: phraseWrapped,
      });

      vault.unlock(masterKey);
      localStorage.setItem(VAULT_LS.INITIALIZED, "true");

      try {
        await runMigration(masterKey, setMigrationMsg);
      } catch (migrationErr) {
        console.warn("Migration incomplete, will retry on next unlock:", migrationErr);
      }
      onComplete();
    } catch (err: any) {
      console.error("Vault setup failed:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Setup failed — system execution context interrupted.");
      }
      setStep("PHRASE");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center border-b border-neutral-800 pb-4 relative">
          <Link 
            to="/sprints"
            className="absolute top-0 right-0 text-red-500 hover:text-red-400 font-mono text-[10px] flex items-center gap-1 border border-red-950/40 bg-red-950/10 px-2 py-0.5 rounded transition-all cursor-pointer"
          >
             EXIT
          </Link>
          <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-blue-400">
            <ShieldCheck size={22} />
          </div>
          <h2 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
            Initialize Experience Vault
          </h2>
        </div>

        {/* INTRO STEP */}
        {step === "INTRO" && (
          <div className="flex flex-col gap-4">
            <div className="bg-black border border-neutral-800 rounded-lg p-4 text-xs font-mono space-y-2 text-neutral-400">
              <p className="text-white font-semibold mb-1">How it works</p>
              <p>① A random <span className="text-blue-400">Master Key</span> is generated in your browser.</p>
              <p>② Your <span className="text-blue-400">PIN</span> encrypts the Master Key — your daily unlock.</p>
              <p>③ A <span className="text-blue-400">Recovery Phrase</span> also encrypts the Master Key — your backup.</p>
              <p>④ Only encrypted data reaches the server. <span className="text-green-400">Zero knowledge.</span></p>
            </div>
            <button onClick={() => setStep("PIN")}
              className="w-full py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              Set Up Vault →
            </button>
          </div>
        )}

        {/* PIN STEP */}
        {step === "PIN" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Vault PIN</label>
              <div className={`flex items-center gap-2 bg-black border rounded-lg px-3 py-2 focus-within:border-neutral-500 transition-all ${hasWhitespace ? 'border-red-500/60 bg-red-950/5' : 'border-neutral-800'}`}>
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Minimum 4 characters"
                  autoFocus
                  className="bg-transparent text-sm text-white outline-none flex-1 font-mono"
                />
                <button type="button" onClick={() => setShowPin(v => !v)} className="text-neutral-500 hover:text-white">
                  {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Confirm PIN</label>
              <input
                type="password"
                value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isPinInvalid && handlePinNext()}
                placeholder="Repeat PIN"
                className={`bg-black border rounded-lg px-3 py-2 text-sm text-white outline-none font-mono focus:border-neutral-500 transition-all ${hasWhitespace || pinMismatchError ? 'border-red-500/60 bg-red-950/5' : 'border-neutral-800'}`}
              />
            </div>

            {/* Visual Whitespace Warning */}
            {hasWhitespace && (
              <div className="flex items-start gap-1.5 text-[11px] font-mono text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg animate-in fade-in duration-150">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>Spaces are not allowed in security keys. Please remove any spaces.</span>
              </div>
            )}

            {/* 💡 FIXED: Real-time validation mismatch message banner block */}
            {pinMismatchError && !hasWhitespace && (
              <div className="flex items-start gap-1.5 text-[11px] font-mono text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg animate-in fade-in duration-150">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>Vault PIN and Confirmation PIN do not match.</span>
              </div>
            )}

            {error && !hasWhitespace && !pinMismatchError && <p className="text-xs text-red-400 font-mono">{error}</p>}
            
            <button 
              onClick={handlePinNext}
              disabled={isPinInvalid}
              className={`w-full py-2 text-sm font-semibold rounded-lg transition-all ${isPinInvalid ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200 cursor-pointer'}`}
            >
              Continue →
            </button>
          </div>
        )}

        {/* PHRASE STEP */}
        {step === "PHRASE" && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-yellow-400 font-mono bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3">
              ⚠ Write this down. If you forget your PIN, this is the only way to recover your data. It will not be shown again.
            </p>
            <div className="bg-black border border-neutral-800 rounded-lg p-4 font-mono text-sm text-yellow-100 leading-7 select-all tracking-wide">
              {phrase}
            </div>
            <button onClick={handleCopy}
              className="flex items-center justify-center gap-2 text-xs text-neutral-400 hover:text-white border border-neutral-800 rounded-lg py-1.5 transition-colors cursor-pointer">
              {copied ? <><Check size={13} className="text-green-400" /> Copied!</> : <><Copy size={13} /> Copy to Clipboard</>}
            </button>
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={phraseAcked} onChange={e => setPhraseAcked(e.target.checked)} className="mt-0.5 accent-green-400" />
              <span className="text-xs text-neutral-400 font-mono">
                I have saved my recovery phrase. I understand losing it means permanent data loss if I also forget my PIN.
              </span>
            </label>
            {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
            <button 
              onClick={handleFinalize}
              disabled={!phraseAcked}
              className={`w-full py-2 text-sm font-semibold rounded-lg transition-all ${!phraseAcked ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200 cursor-pointer'}`}
            >
              Activate Vault →
            </button>
          </div>
        )}

        {/* SAVING STEP */}
        {step === "SAVING" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 size={28} className="animate-spin text-blue-400" />
            <p className="text-sm text-white font-mono">{migrationMsg || "Initializing vault..."}</p>
          </div>
        )}

      </div>
    </div>
  );
};