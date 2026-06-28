import { useState } from 'react';
import { generateRecoveryPhrase, unwrapMasterKeyExtractable, wrapMasterKey} from '../../utils/vaultCrypto';
import { api } from '../../api/client';
import { RefreshCw, Copy, Check, ShieldAlert } from 'lucide-react';

export const RegeneratePhraseCard = () => {
  const [newPhrase, setNewPhrase] = useState('');
  const [copied, setCopied]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

 const handleRegenerate = async () => {
    const pin = window.prompt(
        "Re-enter your vault PIN to confirm phrase regeneration."
    );

    if (!pin) return;

    setLoading(true);
    setSuccess(false);

    try {
        const { data } = await api.get("/user/vault-metadata");

        const extractableKey =
            await unwrapMasterKeyExtractable(
                data.vaultPinWrapped,
                pin
            );

        const freshPhrase = generateRecoveryPhrase();

        const phraseWrapped = await wrapMasterKey(
            extractableKey,
            freshPhrase
        );

        await api.put("/user/vault-phrase", {
            vaultPhraseWrapped: phraseWrapped,
        });

        setNewPhrase(freshPhrase);
        setSuccess(true);
    } catch (err) {
        console.error(err);
        alert("Unable to regenerate recovery phrase.");
    } finally {
        setLoading(false);
    }
};

  const handleCopy = () => {
    navigator.clipboard.writeText(newPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-neutral-800 bg-neutral-900/40 p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
      <div>
        <h4 className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-yellow-500">
          <ShieldAlert size={13} /> Lost Recovery Phrase?
        </h4>
        <p className="text-neutral-500 text-[10px] mt-1">
          If you know your current PIN, you can overwrite your lost recovery words by generating a fresh backup sequence.
        </p>
      </div>

      {!newPhrase ? (
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="w-full py-2 border border-neutral-800 hover:border-neutral-700 bg-black text-neutral-300 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer outline-none transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'GENERATING_ENVELOPE...' : 'GENERATE NEW RECOVERY PHRASE'}
        </button>
      ) : (
        <div className="flex flex-col gap-2 animate-in fade-in duration-200">
          <div className="bg-black border border-neutral-800 text-yellow-100 p-3 rounded-lg text-sm select-all tracking-wide leading-6">
            {newPhrase}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <><Check size={12} className="text-green-400" /> COPIED</> : <><Copy size={12} /> COPY TO CLIPBOARD</>}
            </button>
            <button
              onClick={() => setNewPhrase('')}
              className="px-4 py-1.5 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              DONE
            </button>
          </div>
          {success && <p className="text-[10px] text-green-400 font-bold mt-1">✓ New backup phrase securely synchronized to the backend server cloud.</p>}
        </div>
      )}
    </div>
  );
};