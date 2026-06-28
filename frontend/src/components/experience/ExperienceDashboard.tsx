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
import { Settings2, XCircle, Search, Hash, ChevronDown, Database, Activity, Loader2 } from 'lucide-react';
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
    <div className="flex flex-col gap-8 w-full" onClick={e => e.stopPropagation()}>

      <div className="flex justify-between items-center bg-os-surface/40 p-4 rounded-xl border border-os-border/60">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Experience Logs</h2>
          <p className="text-xs text-os-muted">Documenting historical progression nodes</p>
        </div>
        <button
          onClick={() => setIsTagManagerOpen(true)}
          className="text-os-muted hover:text-white flex items-center gap-2 text-xs bg-os-surface border border-os-border px-3 py-1.5 rounded-lg transition-colors"
        >
          <Settings2 size={14} /> Manage Tags
        </button>
      </div>

      <ExperienceLogger onLogSuccess={triggerGlobalSystemSync} />

      <div className="grid grid-cols-2 gap-3 bg-os-surface/20 border border-os-border rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-3 border-r border-os-border/50 py-1">
          <Database size={15} className="text-os-muted" />
          <div className="text-left">
            <span className="text-[10px] font-mono tracking-wider text-os-muted uppercase block leading-none mb-1">LIFETIME_LOGS</span>
            <span className="text-sm font-mono font-bold text-white leading-none">{stats.totalLifetimeLogs}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 py-1">
          <Activity size={15} className="text-os-muted" />
          <div className="text-left">
            <span className="text-[10px] font-mono tracking-wider text-os-muted uppercase block leading-none mb-1">MONTHLY_VELOCITY</span>
            <span className="text-sm font-mono font-bold text-blue-400 leading-none">{stats.currentMonthLogs}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <div className="flex items-center gap-2 bg-os-surface border border-os-border rounded-lg p-3 h-[46px] focus-within:border-gray-500 transition-colors shadow-lg">
              <Search size={18} className="text-os-muted" />
              <input
                type="text"
                value={searchTagInput}
                onChange={e => { setSearchTagInput(e.target.value); setShowSearchDropdown(true); }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Search history metrics by tag..."
                className="bg-transparent text-sm outline-none text-white w-full placeholder-os-muted"
              />
            </div>
            {showSearchDropdown && searchTagInput && (
              <div className="absolute top-full left-0 w-full mt-1 bg-os-surface border border-os-border rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                {filteredSearchTags.length > 0
                  ? filteredSearchTags.map(tag => (
                      <button key={tag.id}
                        onClick={() => { setActiveTagFilter(tag.name); setSearchTagInput(''); setShowSearchDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-os-bg transition-colors flex items-center gap-2 text-gray-200">
                        <Hash size={14} className="text-os-muted" />{tag.name}
                      </button>
                    ))
                  : <div className="px-4 py-2.5 text-sm text-os-muted italic">No matching tags.</div>
                }
              </div>
            )}
          </div>
          <TemporalFilter value={timeframe} onChange={setTimeframe} />
        </div>

        <div className="flex justify-between items-center border-b border-os-border pb-2 mt-2">
          <h3 className="text-xs font-semibold text-os-muted uppercase tracking-wider">Timeline Feed</h3>
          {activeTagFilter && (
            <div className="flex items-center gap-2 bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-900/50">
              Filtered: #{activeTagFilter}
              <button onClick={() => { setActiveTagFilter(null); setSearchTagInput(''); }} className="hover:text-white transition-colors">
                <XCircle size={14} />
              </button>
            </div>
          )}
        </div>

        <ExperienceFeed
          feed={feed}
          loading={loading}
          allTags={allTags}
          onMutationRequired={triggerGlobalSystemSync}
          setActiveTagFilter={setActiveTagFilter}
        />

        {hasMore && (
          <button onClick={loadMoreEntries} disabled={loadingMore}
            className="w-full py-2.5 mt-2 flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-wider text-os-muted hover:text-white bg-os-surface/20 hover:bg-os-surface/60 border border-os-border rounded-xl transition-all outline-none">
            {loadingMore ? 'SYNCING_NEXT_DATASET...' : <><ChevronDown size={14} /> FETCH_OLDER_LOGS</>}
          </button>
        )}
      </div>

      {isTagManagerOpen && (
        <TagManager onClose={() => setIsTagManagerOpen(false)} onTagsChanged={triggerGlobalSystemSync} />
      )}
    </div>
  );
};
