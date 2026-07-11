import { CustomInput } from '../common/CustomInput';
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MarkdownToolbar } from "../common/MarkdownToolbar";
import { api } from "../../api/client";
import type { ExperienceResponse, Tag } from "../../api/client";
import {
  Trash2,
  Lock,
  Edit2,
  Check,
  X,
  Hash,
} from "lucide-react";
import { encryptContent, decryptContent, vault } from "../../utils/vaultCrypto";

interface ExperienceFeedProps {
  feed: ExperienceResponse[];
  loading: boolean;
  allTags: Tag[];
  onMutationRequired: () => void;
  setActiveTagFilter: (tag: string | null) => void;
}

export const ExperienceFeed: React.FC<ExperienceFeedProps> = ({
  feed,
  loading,
  allTags,
  onMutationRequired,
  setActiveTagFilter,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editIsSensitive, setEditIsSensitive] = useState(false);
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [showEditDropdown, setShowEditDropdown] = useState(false);

  const [editLocation, setEditLocation] = useState<string>("");


  // Decrypted plaintext cache: entry id → plaintext string
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});

  // Decrypt all entries whenever the feed changes
  useEffect(() => {
    const masterKey = vault.getKey();
    if (!masterKey) return;

    const run = async () => {
      const result: Record<string, string> = {};
      await Promise.all(
        feed.map(async (entry) => {
          if (!entry.clientEncrypted) {
            // Legacy plaintext entry — display as-is (shouldn't happen after migration)
            result[entry.id] = entry.markdownContent;
            return;
          }
          try {
            result[entry.id] = await decryptContent(
              entry.markdownContent,
              masterKey,
            );
          } catch {
            result[entry.id] =
              "[Decryption failed — data may be from a different vault]";
          }
        }),
      );
      setDecryptedMap(result);
    };

    run();
  }, [feed]);

  const filteredEditTags = allTags.filter((t) => {
    const input = editTagInput.trim().toLowerCase();
    return (
      input.length > 0 &&
      t.name.toLowerCase().includes(input) &&
      !editSelectedTags.includes(t.name.toLowerCase())
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry permanently?")) return;
    try {
      await api.delete(`/experiences/${id}`);
      onMutationRequired();
    } catch (error) {
      console.error("Failed to execute deletion schema", error);
    }
  };

  const handleEditStart = (entry: ExperienceResponse) => {
    setEditingId(entry.id);
    setEditContent(decryptedMap[entry.id] ?? ""); // use decrypted plaintext
    setEditIsSensitive(entry.sensitive);
    setEditSelectedTags([...entry.tags]);
    setEditTagInput("");
    setEditLocation("");
  };

  const handleEditSave = async (entry: ExperienceResponse) => {
    const masterKey = vault.getKey();
    if (!masterKey) {
      alert("Vault is locked. Please refresh and unlock your vault.");
      return;
    }

    try {
      let finalContent = editContent;
      if (editLocation) {
        if (finalContent.includes("\n\n```\n📍")) {
          const parts = finalContent.split("\n\n```\n📍");
          parts.pop();
          finalContent =
            parts.join("\n\n```\n📍") +
            `\n\n\`\`\`\n📍 ${editLocation}\n\`\`\``;
        } else {
          finalContent += `\n\n\`\`\`\n📍 ${editLocation}\n\`\`\``;
        }
      }

      const encryptedContent = await encryptContent(finalContent, masterKey);

      await api.put(`/experiences/${entry.id}`, {
        markdownContent: encryptedContent,
        sensitive: editIsSensitive,
        clientEncrypted: true,
        tags: editSelectedTags,
      });
      setEditingId(null);
      setEditLocation("");
      onMutationRequired();
    } catch (error) {
      console.error("Failed to mutate entry parameters", error);
    }
  };


  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cleanName = editTagInput.trim().toLowerCase();
      if (cleanName && !editSelectedTags.includes(cleanName)) {
        setEditSelectedTags([...editSelectedTags, cleanName]);
      }
      setEditTagInput("");
      setShowEditDropdown(false);
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const dateStr = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const timeStr = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return {
      label: isToday ? "Today" : isYesterday ? "Yesterday" : dateStr,
      time: timeStr,
    };
  };

  if (loading)
    return (
      <p className="text-os-muted text-sm tracking-wide animate-pulse">
        Querying relational tables...
      </p>
    );

  if (feed.length === 0)
    return (
      <p className="text-os-muted text-sm text-center py-8 bg-os-surface/10 rounded-xl border border-dashed border-os-border">
        No matching experience datasets logged.
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      {feed.map(entry => {
        const dt = formatDateTime(entry.timestamp);

        return (
          <div
            key={entry.id}
            tabIndex={0}
            className="group relative bg-neutral-950 border border-neutral-800 rounded-xl px-6 py-5 hover:border-neutral-700 focus:border-neutral-700 transition-colors shadow-sm outline-none"
          >
            {/* Timestamp + actions row */}
            <div className="flex flex-row items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-neutral-300">{dt.label}</span>
                <span className="text-xs text-neutral-600">{dt.time}</span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100 transition-opacity">
                <button onClick={() => handleEditStart(entry)} className="text-neutral-600 hover:text-neutral-300 transition-colors p-1 rounded hover:bg-neutral-800">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDelete(entry.id)} className="text-neutral-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-neutral-800">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Edit mode */}
            {editingId === entry.id ? (
              <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                <MarkdownToolbar
                  textareaId={`edit-textarea-${entry.id}`}
                  content={editContent}
                  setContent={setEditContent}
                />
                <textarea
                  id={`edit-textarea-${entry.id}`}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className={`w-full h-[50vh] md:h-40 min-h-[160px] p-4 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 outline-none resize-y text-sm leading-relaxed focus:border-neutral-500 transition-colors ${editIsSensitive ? 'blur-[3px] focus:blur-none hover:blur-none' : ''}`}
                />
                {editLocation && (
                  <p className="text-[11px] text-emerald-500 bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-2">
                    📍 {editLocation}
                  </p>
                )}

                {/* Tag input */}
                <div className="relative">
                  <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus-within:border-neutral-500 transition-colors">
                    <Hash size={13} className="text-neutral-600" />
                    <CustomInput
                      type="text"
                      value={editTagInput}
                      onChange={e => { setEditTagInput(e.target.value); setShowEditDropdown(true); }}
                      onFocus={() => setShowEditDropdown(true)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add tags..."
                      className="bg-transparent text-sm w-full outline-none text-white placeholder-neutral-600"
                    />
                  </div>
                  {showEditDropdown && editTagInput && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-30 max-h-32 overflow-y-auto">
                      {filteredEditTags.map(tag => (
                        <button key={tag.id} type="button"
                          onClick={() => { const c = tag.name.trim().toLowerCase(); if (!editSelectedTags.includes(c)) setEditSelectedTags([...editSelectedTags, c]); setEditTagInput(''); setShowEditDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 text-neutral-300 transition-colors">
                          #{tag.name}
                        </button>
                      ))}
                      {!filteredEditTags.find(t => t.name.toLowerCase() === editTagInput.toLowerCase().trim()) && !editSelectedTags.includes(editTagInput.toLowerCase().trim()) && (
                        <button type="button"
                          onClick={() => { const c = editTagInput.trim().toLowerCase(); if (c && !editSelectedTags.includes(c)) setEditSelectedTags([...editSelectedTags, c]); setEditTagInput(''); setShowEditDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-neutral-800 transition-colors border-t border-neutral-700">
                          Create: #{editTagInput.toLowerCase().trim()}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editSelectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {editSelectedTags.map(tag => (
                      <span key={tag} onClick={() => setEditSelectedTags(editSelectedTags.filter(t => t !== tag))}
                        className="px-2 py-0.5 text-xs bg-neutral-800 text-neutral-400 rounded-full cursor-pointer hover:bg-red-950/40 hover:text-red-400 transition-colors flex items-center gap-1">
                        #{tag} <X size={10} />
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end items-center pt-2 border-t border-neutral-800">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(null); setEditLocation(''); }}
                      className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
                      <X size={13} /> Cancel
                    </button>
                    <button onClick={() => handleEditSave(entry)}
                      className="flex items-center gap-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                      <Check size={13} /> Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Read mode */
              <div className="flex flex-col gap-3">
                {entry.sensitive && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-400/80 mb-1">
                    <Lock size={11} /> Sensitive
                  </div>
                )}
                <div className={`text-sm leading-relaxed text-neutral-300 ${entry.sensitive ? 'blur-[4px] hover:blur-none transition-all duration-300' : ''}`}>
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-semibold prose-p:text-neutral-300 prose-p:leading-relaxed prose-code:text-pink-400 prose-code:text-xs prose-a:text-blue-400">
                    <ReactMarkdown>{decryptedMap[entry.id] ?? 'Decrypting...'}</ReactMarkdown>
                  </div>
                </div>

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {entry.tags.map(tag => (
                      <button key={tag} onClick={() => setActiveTagFilter(tag)}
                        className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors before:content-['#']">
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
