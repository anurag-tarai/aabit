import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, RotateCcw, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from 'react-router-dom';
import {
  unwrapMasterKey,
  unwrapMasterKeyExtractable,
  wrapMasterKey,
  vault,
} from "../../utils/vaultCrypto";
import { api } from "../../api/client";
import type { VaultMetadata } from "../../api/client";

interface Props {
  onUnlocked: () => void;
}

type Mode = "PIN" | "PHRASE";

export const VaultUnlockModal = ({ onUnlocked }: Props) => {
  const [mode, setMode] = useState<Mode>("PIN");
  const [metadata, setMetadata] = useState<VaultMetadata | null>(null);
  const [secret, setSecret] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch the wrapped envelopes from the server on mount
  useEffect(() => {
    api
      .get<VaultMetadata>("/user/vault-metadata")
      .then((res) => setMetadata(res.data))
      .catch(() =>
        setError("Failed to load vault metadata. Check your connection."),
      )
      .finally(() => setFetching(false));
  }, []);

  // ── UI Frontend Validation Safeguards ──
  const secretHasSpace = /\s/.test(secret);
  const newPinHasSpace = /\s/.test(newPin) || /\s/.test(newPinConfirm);
  
  // 💡 FIXED: Real-time check to catch mismatches once both fields have content
  const pinMismatchError = mode === "PHRASE" && newPin.length >= 4 && newPinConfirm.length >= 4 && newPin !== newPinConfirm;

  // Dynamically evaluate whitespace errors across ALL active fields per mode
  const hasWhitespaceError = mode === "PIN" 
    ? secretHasSpace 
    : (secretHasSpace || newPinHasSpace);

  const isFormInvalid = 
    !secret.trim() || 
    hasWhitespaceError || 
    (mode === "PHRASE" && (newPin.length < 4 || newPin !== newPinConfirm));

  const switchMode = (m: Mode) => {
    setMode(m);
    setSecret("");
    setNewPin("");
    setNewPinConfirm("");
    setError("");
    setSuccessMsg("");
  };

  const handleUnlock = async () => {
    if (isFormInvalid || !metadata) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (mode === "PIN") {
        if (!metadata.vaultPinWrapped)
          throw new Error("No PIN envelope found.");
        const masterKey = await unwrapMasterKey(
          metadata.vaultPinWrapped,
          secret,
        );
        vault.unlock(masterKey);
        onUnlocked();
      } else {
        // Recovery flow
        if (!metadata.vaultPhraseWrapped)
          throw new Error("No recovery envelope found.");

        // Unwrap with phrase (extractable so we can re-wrap with new PIN)
        const extractableMasterKey = await unwrapMasterKeyExtractable(
          metadata.vaultPhraseWrapped,
          secret,
        );

        // Wrap with new PIN and persist to server
        const newPinWrapped = await wrapMasterKey(extractableMasterKey, newPin);
        await api.put("/user/vault-pin", { vaultPinWrapped: newPinWrapped });

        setSuccessMsg("✓ Vault envelope updated on cloud! Finalizing session hydration...");
        
        // Give the UI a tiny moment to let the user read the success state before closing the modal
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Load into session (re-import as non-extractable)
        const sessionKey = await unwrapMasterKey(newPinWrapped, newPin);
        vault.unlock(sessionKey);
        onUnlocked();
      }
    } catch (err) {
      console.error("Vault unlock failed:", err);
      setSuccessMsg("");
      setError(
        mode === "PIN"
          ? "Incorrect PIN. Your vault remains locked."
          : "Incorrect recovery phrase. Check every word carefully.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-os-surface border border-os-border rounded-xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center border-b border-os-border pb-4 relative">
          <Link 
            to="/sprints"
            className="absolute top-0 right-0 text-red-500 hover:text-red-400 font-mono text-[10px] flex items-center gap-1 border border-red-950/40 bg-red-950/10 px-2 py-0.5 rounded transition-all cursor-pointer outline-none select-none"
            title="Go to Sprints Module"
          >
           EXIT
          </Link>
          <div className="p-2.5 bg-os-bg border border-os-border rounded-xl text-yellow-400">
            <Lock size={22} />
          </div>
          <h2 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
            Unlock Experience Vault
          </h2>
          <p className="text-xs text-os-muted font-mono">
            {mode === "PIN"
              ? "Enter your vault PIN to decrypt your journals."
              : "Enter your recovery phrase to reset your PIN."}
          </p>
        </div>

        {fetching ? (
          <div className="flex justify-center py-6">
            <Loader2 size={24} className="animate-spin text-os-muted" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-os-muted uppercase tracking-wider">
                {mode === "PIN" ? "Vault PIN" : "Recovery Phrase (12 words)"}
              </label>
              <div className={`flex items-center gap-2 bg-os-bg border rounded-lg px-3 py-2 focus-within:border-gray-500 transition-all ${secretHasSpace ? 'border-red-500/60 bg-red-950/5' : 'border-os-border'}`}>
                <input
                  type={showSecret ? "text" : "password"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isFormInvalid && mode === "PIN" && handleUnlock()
                  }
                  placeholder={
                    mode === "PIN" ? "Your PIN" : "word1 word2 word3 ..."
                  }
                  autoFocus
                  className="bg-transparent text-sm text-white outline-none flex-1 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="text-os-muted hover:text-white"
                >
                  {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Extra fields for recovery mode (Inline Reset Form Layout) */}
            {mode === "PHRASE" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-os-muted uppercase tracking-wider">
                    New PIN
                  </label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Choose a new PIN"
                    className={`bg-os-bg border rounded-lg px-3 py-2 text-sm text-white outline-none font-mono focus:border-gray-500 transition-all ${newPinHasSpace ? 'border-red-500/60 bg-red-950/5' : 'border-os-border'}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-os-muted uppercase tracking-wider">
                    Confirm New PIN
                  </label>
                  <input
                    type="password"
                    value={newPinConfirm}
                    onChange={(e) => setNewPinConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isFormInvalid && handleUnlock()}
                    placeholder="Repeat new PIN"
                    className={`bg-os-bg border rounded-lg px-3 py-2 text-sm text-white outline-none font-mono focus:border-gray-500 transition-all ${newPinHasSpace || pinMismatchError ? 'border-red-500/60 bg-red-950/5' : 'border-os-border'}`}
                  />
                </div>
              </>
            )}

            {/* Real-time Space Warning */}
            {hasWhitespaceError && (
              <div className="flex items-start gap-1.5 text-[11px] font-mono text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg animate-in fade-in duration-150">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>Spaces are not allowed in security items. Please remove any spaces.</span>
              </div>
            )}

            {/* 💡 FIXED: Real-time Mismatch Alert Banner */}
            {pinMismatchError && !hasWhitespaceError && (
              <div className="flex items-start gap-1.5 text-[11px] font-mono text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg animate-in fade-in duration-150">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>New PIN and Confirmation PIN do not match.</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-green-400 bg-green-950/20 border border-green-900/30 p-2 rounded-lg animate-in fade-in duration-200">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && !hasWhitespaceError && !pinMismatchError && <p className="text-xs text-red-400 font-mono">{error}</p>}

            <button
              onClick={handleUnlock}
              disabled={loading || isFormInvalid}
              className={`w-full py-2 text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all ${
                isFormInvalid 
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Decrypting...
                </>
              ) : mode === "PIN" ? (
                "Unlock Vault"
              ) : (
                "Reset PIN & Unlock"
              )}
            </button>

            <button
              onClick={() => switchMode(mode === "PIN" ? "PHRASE" : "PIN")}
              className="flex items-center justify-center gap-1.5 text-xs text-os-muted hover:text-white transition-colors font-mono cursor-pointer outline-none"
            >
              <RotateCcw size={12} />
              {mode === "PIN"
                ? "Forgot PIN? Use recovery phrase"
                : "← Back to PIN"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};