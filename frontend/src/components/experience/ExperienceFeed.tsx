import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MarkdownToolbar } from "../common/MarkdownToolbar";
import { api } from "../../api/client";
import type { ExperienceResponse, Tag } from "../../api/client";
import { Trash2, Lock, Edit2, Check, X, Hash } from "lucide-react";

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
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [showEditDropdown, setShowEditDropdown] = useState(false);

  useEffect(() => {
    const closeDropdowns = () => setShowEditDropdown(false);
    window.addEventListener("click", closeDropdowns);
    return () => window.removeEventListener("click", closeDropdowns);
  }, []);

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
    setEditContent(entry.markdownContent);
    setEditSelectedTags([...entry.tags]);
    setEditTagInput("");
  };

  const handleEditSave = async (entry: ExperienceResponse) => {
    try {
      await api.put(`/experiences/${entry.id}`, {
        markdownContent: editContent,
        sensitive: entry.sensitive,
        tags: editSelectedTags,
      });
      setEditingId(null);
      onMutationRequired();
    } catch (error) {
      console.error("Failed to mutate entry parameters", error);
    }
  };

  // Overwrite the old handleTagInputKeyDown method with this clean array push layout:
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Stop standard form or page refresh triggers
      
      const cleanName = editTagInput.trim().toLowerCase();
      if (cleanName && !editSelectedTags.includes(cleanName)) {
        setEditSelectedTags([...editSelectedTags, cleanName]);
      }
      setEditTagInput("");
      setShowEditDropdown(false);
    }
  };

  // DATE FORMATTING LOGIC
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
    <div className="flex flex-col gap-4">
      {feed.map((entry) => {
        const dt = formatDateTime(entry.timestamp);

        return (
          <div
            key={entry.id}
            className="bg-os-surface border border-os-border rounded-lg p-4 group shadow-lg transition-all hover:border-neutral-800"
          >
            {/* CARD HEADER */}
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-os-muted font-medium flex flex-col leading-tight">
                <span>{dt.label}</span>
                <span className="text-[10px] text-os-muted/70">{dt.time}</span>
              </span>

              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditStart(entry)}
                  className="text-os-muted hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-os-muted hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* INLINE EDIT MODE CONDITIONAL RENDERING FRAMEWORK */}
            {editingId === entry.id ? (
              <div
                className="flex flex-col gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <MarkdownToolbar
                  textareaId={`edit-textarea-${entry.id}`}
                  content={editContent}
                  setContent={setEditContent}
                />

                <textarea
                  id={`edit-textarea-${entry.id}`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-32 p-3 bg-os-bg border border-os-border rounded-lg text-white outline-none resize-none font-mono text-sm focus:border-gray-500"
                />

                {/* TAG CONSOLE DROPDOWN SELECTOR */}
                <div className="relative">
                  <div className="flex items-center gap-2 p-2 bg-os-bg border border-os-border rounded-lg focus-within:border-gray-500 transition-colors">
                    <Hash size={14} className="text-os-muted" />
                    <input
                      type="text"
                      value={editTagInput}
                      onChange={(e) => {
                        setEditTagInput(e.target.value);
                        setShowEditDropdown(true);
                      }}
                      onFocus={() => setShowEditDropdown(true)}
                      onKeyDown={handleTagInputKeyDown} // Bound keydown to listen for Enter
                      placeholder="Attach system tokens... (Press Enter to spawn new tag)"
                      className="bg-transparent text-xs w-full outline-none text-white placeholder-os-muted"
                    />
                  </div>

                  {showEditDropdown && editTagInput && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-os-surface border border-os-border rounded-lg shadow-2xl z-30 max-h-32 overflow-y-auto">
                      {filteredEditTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            const clean = tag.name.trim().toLowerCase();
                            if (!editSelectedTags.includes(clean)) {
                              setEditSelectedTags([...editSelectedTags, clean]);
                            }
                            setEditTagInput("");
                            setShowEditDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-os-bg text-gray-200 transition-colors cursor-pointer"
                        >
                          #{tag.name}
                        </button>
                      ))}

                      {/* 💡 ADD THIS CONDITIONAL CHECK BOX BELOW THE MAP TIMELINE LOOP */}
                      {!filteredEditTags.find(
                        (t) =>
                          t.name.toLowerCase() ===
                          editTagInput.toLowerCase().trim(),
                      ) &&
                        !editSelectedTags.includes(
                          editTagInput.toLowerCase().trim(),
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              const cleanName = editTagInput
                                .trim()
                                .toLowerCase();
                              if (
                                cleanName &&
                                !editSelectedTags.includes(cleanName)
                              ) {
                                setEditSelectedTags([
                                  ...editSelectedTags,
                                  cleanName,
                                ]);
                              }
                              setEditTagInput("");
                              setShowEditDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-os-bg transition-colors cursor-pointer border-t border-os-border/30 font-medium"
                          >
                            Create new tag: #{editTagInput.toLowerCase().trim()}
                          </button>
                        )}
                    </div>
                  )}
                </div>

                {/* ACTIVE SELECTED ACCUMULATED TAG PILLS */}
                {editSelectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {editSelectedTags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() =>
                          setEditSelectedTags(
                            editSelectedTags.filter((t) => t !== tag),
                          )
                        }
                        className="px-2 py-0.5 text-[11px] bg-os-bg border border-os-border text-gray-300 rounded cursor-pointer hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/50 transition-all flex items-center gap-1"
                      >
                        #{tag}
                        <X size={10} />
                      </span>
                    ))}
                  </div>
                )}

                {/* EDITING INTERACTION FOOTER CONTROLS */}
                <div className="flex justify-end gap-2 mt-1 pt-2 border-t border-os-border/40">
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 text-xs text-os-muted hover:text-white px-2 py-1 cursor-pointer"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={() => handleEditSave(entry)}
                    className="flex items-center gap-1 text-xs bg-green-900/40 text-green-400 hover:bg-green-900/60 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD DISPLAY RENDER LAYER WITH BLUR CONTROL FLAGGINGS */
              <div className="flex flex-col gap-2">
                <div
                  className={`text-sm max-w-none text-gray-200 ${
                    entry.sensitive
                      ? "blur-[4px] hover:blur-none transition-all duration-300"
                      : ""
                  }`}
                >
                  {entry.sensitive && (
                    <div className="flex items-center gap-1 text-xs font-mono text-red-400 mb-1 select-none">
                      <Lock size={12} /> SECURE_DATA_NODE
                    </div>
                  )}

                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-gray-300 prose-code:text-pink-400 font-sans">
                    <ReactMarkdown>{entry.markdownContent}</ReactMarkdown>
                  </div>
                </div>

                {/* CARD ATTACHED FOOTER TAG BUTTON ARRAY */}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-os-border/40">
                    {entry.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setActiveTagFilter(tag)}
                        className="text-[11px] font-mono text-os-muted hover:text-white bg-os-surface/40 hover:bg-os-bg px-2 py-0.5 rounded border border-os-border/60 transition-colors cursor-pointer before:content-['#']"
                      >
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
