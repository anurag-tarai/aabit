import { CustomInput } from '../common/CustomInput';
import { useEffect, useState } from 'react';
import { ExperienceLogger } from './ExperienceLogger';
import { TagManager } from './TagManager';
import { ExperienceFeed } from './ExperienceFeed';
import { TemporalFilter } from '../common/TemporalFilter';
import type { TemporalValue } from '../common/TemporalFilter';
import { VaultSetupModal } from './VaultSetupModal';
import { VaultUnlockModal } from './VaultUnlockModal';
import { vault } from '../../utils/vaultCrypto';
import { api } from '../../api/client';
import type { ExperienceResponse, Tag } from '../../api/client';
import { Settings2, XCircle, Search, Hash, ChevronDown, Loader2 } from 'lucide-react';
import { runMigration } from '../../utils/vaultMigration';

interface SystemStats {
  totalLifetimeLogs: number;
  currentMonthLogs: number;
}

export const ExperienceDashboard = () => {
  const [feed, setFeed]             = useState<ExperienceResponse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore]       = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [timeframe, setTimeframe]   = useState<TemporalValue>({ year: null, month: null, day: null });
  const [stats, setStats]           = useState<SystemStats>({ totalLifetimeLogs: 0, currentMonthLogs: 0 });
  const [allTags, setAllTags]       = useState<Tag[]>([]);
  const [searchTagInput, setSearchTagInput] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // 💡 Default state safely to 'unlock' until server handshake completes
  const [vaultState, setVaultState] = useState<'setup' | 'unlock' | 'ready'>('unlock');
  const [checkingVault, setCheckingVault] = useState(true);

  // 💡 FIXED: Single Source of Truth server handshake check on layout mount
  useEffect(() => {
    api.get<{ vaultPinWrapped: string | null }>('/user/vault-metadata')
      .then(res => {
        if (res.data && res.data.vaultPinWrapped) {
          setVaultState(vault.isOpen() ? 'ready' : 'unlock');
        } else {
          setVaultState('setup');
        }
      })
      .catch((err) => {
        console.error("Failed to load vault initialization status parameters", err);
      })
      .finally(() => {
        setCheckingVault(false);
      });
  }, []);

  const fetchFeed = async (page: number, tagFilter = activeTagFilter, time = timeframe, append = false) => {
    if (page === 0 && !append) setLoading(true);
    else setLoadingMore(true);
    try {
      let params = `page=${page}&size=10`;
      if (tagFilter)  params += `&tag=${tagFilter}`;
      if (time.year)  params += `&year=${time.year}`;
      if (time.month) params += `&month=${time.month}`;
      if (time.day)   params += `&day=${time.day}`;
      const res = await api.get<{ content: ExperienceResponse[]; last: boolean }>(`/experiences?${params}`);
      setFeed(prev => append ? [...prev, ...res.data.content] : res.data.content);
      setHasMore(!res.data.last);
    } catch (error) {
      console.error('Failed to fetch paginated database rows', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const res = await api.get<SystemStats>('/experiences/stats/summary');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load system stats', error);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get<Tag[]>('/tags');
      setAllTags(res.data);
    } catch (error) {
      console.error('Failed to fetch tags', error);
    }
  };

  const triggerGlobalSystemSync = () => {
    setCurrentPage(0);
    fetchFeed(0, activeTagFilter, timeframe, false);
    fetchSystemStats();
    fetchTags();
  };

  // 💡 Included checkingVault boundary constraint to avoid early execution passes
  useEffect(() => {
    if (vaultState === 'ready' && !checkingVault) {
      triggerGlobalSystemSync();
    }
  }, [activeTagFilter, timeframe, vaultState, checkingVault]);

  useEffect(() => {
    const close = () => setShowSearchDropdown(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  useEffect(() => {
  if (vaultState !== 'ready' || checkingVault) return;
  const masterKey = vault.getKey();
  if (!masterKey) return;

  // Silently attempt to encrypt any remaining plaintext entries
  runMigration(masterKey).catch(err => {
    console.warn("Background migration failed:", err);
});
}, [vaultState, checkingVault]);

  const loadMoreEntries = () => {
    const next = currentPage + 1;
    setCurrentPage(next);
    fetchFeed(next, activeTagFilter, timeframe, true);
  };

  const filteredSearchTags = allTags.filter(t => {
    const input = searchTagInput.trim().toLowerCase();
    return input.length > 0 && t.name.toLowerCase().includes(input);
  });

  // ── Vault gate rendering layer ──────────────────────────────────────────

  // Intercept layout rendering while asynchronous handshake fetches execution context
  if (checkingVault) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[250px] font-mono text-xs text-neutral-500 gap-2">
        <Loader2 size={16} className="animate-spin text-neutral-600" />
        <span>CONNECTING_SECURE_VAULT_NODE...</span>
      </div>
    );
  }

  // 💡 FIXED: Cleaned out onLogout parameters entirely to rely purely on internal custom routing targets
  if (vaultState === 'setup') {
    return <VaultSetupModal onComplete={() => setVaultState('ready')} />;
  }
  if (vaultState === 'unlock') {
    return <VaultUnlockModal onUnlocked={() => setVaultState('ready')} />;
  }

 return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto" onClick={e => e.stopPropagation()}>

      {/* ── Page header — clean, no terminal noise ── */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Journal</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {stats.totalLifetimeLogs} entries · {stats.currentMonthLogs} this month
          </p>
        </div>
        <button
          onClick={() => setIsTagManagerOpen(true)}
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Settings2 size={13} /> Tags
        </button>
      </div>

      {/* ── Logger ── */}
      <ExperienceLogger onLogSuccess={triggerGlobalSystemSync} />

      {/* ── Filter bar ── */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="relative">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 focus-within:border-neutral-600 transition-colors">
              <Search size={14} className="text-neutral-600 flex-shrink-0" />
              <CustomInput
                type="text"
                value={searchTagInput}
                onChange={e => { setSearchTagInput(e.target.value); setShowSearchDropdown(true); }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Filter by tag..."
                className="bg-transparent text-sm outline-none text-white w-full placeholder-neutral-600"
              />
            </div>
            {showSearchDropdown && searchTagInput && (
              <div className="absolute top-full left-0 w-full mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                {filteredSearchTags.length > 0
                  ? filteredSearchTags.map(tag => (
                      <button key={tag.id}
                        onClick={() => { setActiveTagFilter(tag.name); setSearchTagInput(''); setShowSearchDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 transition-colors flex items-center gap-2 text-neutral-300">
                        <Hash size={13} className="text-neutral-600" />{tag.name}
                      </button>
                    ))
                  : <div className="px-4 py-2.5 text-sm text-neutral-600">No matching tags.</div>
                }
              </div>
            )}
          </div>
          <TemporalFilter value={timeframe} onChange={setTimeframe} />
        </div>

        {activeTagFilter && (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Filtered by</span>
            <span className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full">
              #{activeTagFilter}
              <button onClick={() => { setActiveTagFilter(null); setSearchTagInput(''); }} className="hover:text-white transition-colors">
                <XCircle size={12} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* ── Timeline feed ── */}
      <ExperienceFeed
        feed={feed}
        loading={loading}
        allTags={allTags}
        onMutationRequired={triggerGlobalSystemSync}
        setActiveTagFilter={setActiveTagFilter}
      />

      {hasMore && (
        <button onClick={loadMoreEntries} disabled={loadingMore}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-xs text-neutral-600 hover:text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-all">
          {loadingMore ? 'Loading...' : <><ChevronDown size={14} /> Load older entries</>}
        </button>
      )}

      {isTagManagerOpen && (
        <TagManager onClose={() => setIsTagManagerOpen(false)} onTagsChanged={triggerGlobalSystemSync} />
      )}
    </div>
  );
};
