import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MarkdownToolbar } from "../common/MarkdownToolbar";
import { api } from "../../api/client";
import type { ExperienceResponse, Tag } from "../../api/client";
import { Trash2, Lock, Edit2, Check, X, Hash, MapPin, Loader2 } from "lucide-react";

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
  const [fetchingLocation, setFetchingLocation] = useState(false);

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
    setEditIsSensitive(entry.sensitive);
    setEditSelectedTags([...entry.tags]);
    setEditTagInput("");
    setEditLocation("");
  };

  // UPDATED: Now identifies and replaces code blocks wrapping location segments
  const handleEditSave = async (entry: ExperienceResponse) => {
    try {
      let finalContent = editContent;

      if (editLocation) {
        // Look for an existing plain text location block wrapped in code syntax to update
        if (finalContent.includes("\n\n\`\`\`\n📍")) {
          const splitArray = finalContent.split("\n\n\`\`\`\n📍");
          splitArray.pop(); // Clear out the old block segment safely
          finalContent = splitArray.join("\n\n\`\`\`\n📍") + `\n\n\`\`\`\n📍 ${editLocation}\n\`\`\``;
        } else {
          finalContent += `\n\n\`\`\`\n📍 ${editLocation}\n\`\`\``;
        }
      }

      await api.put(`/experiences/${entry.id}`, {
        markdownContent: finalContent,
        sensitive: editIsSensitive,
        tags: editSelectedTags,
      });
      setEditingId(null);
      setEditLocation("");
      onMutationRequired();
    } catch (error) {
      console.error("Failed to mutate entry parameters", error);
    }
  };

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const area = addr.suburb || addr.residential || addr.neighbourhood || "";
            const regionalDistrict = addr.city_district || addr.city || addr.town || "";
            
            const cleanAddress = [area, regionalDistrict].filter(Boolean).join(', ');
            setEditLocation(cleanAddress);
          } else {
            setEditLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error("Geocoding failed inside update editor:", error);
          setEditLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        alert(`Failed to get location: ${error.message}`);
        setFetchingLocation(false);
      },  
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 300000 }
    );
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
                  className={`w-full h-32 p-3 bg-os-bg border border-os-border rounded-lg text-white outline-none resize-none font-mono text-sm focus:border-gray-500 transition-all ${
                    editIsSensitive ? 'blur-[3px] focus:blur-none hover:blur-none' : ''
                  }`}
                />

                {/* UPDATED: Informational text helper shows updated code syntax styling context */}
                {editLocation && (
                  <p className="text-[11px] text-green-400 bg-os-bg/50 border border-os-border/50 rounded-md p-2 font-mono break-words">
                    Will update inside code block: 📍 {editLocation}
                  </p>
                )}

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
                      onKeyDown={handleTagInputKeyDown}
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

                      {!filteredEditTags.find(
                        (t) => t.name.toLowerCase() === editTagInput.toLowerCase().trim()
                      ) &&
                        !editSelectedTags.includes(editTagInput.toLowerCase().trim()) && (
                          <button
                            type="button"
                            onClick={() => {
                              const cleanName = editTagInput.trim().toLowerCase();
                              if (cleanName && !editSelectedTags.includes(cleanName)) {
                                setEditSelectedTags([...editSelectedTags, cleanName]);
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
                        onClick={() => setEditSelectedTags(editSelectedTags.filter((t) => t !== tag))}
                        className="px-2 py-0.5 text-[11px] bg-os-bg border border-os-border text-gray-300 rounded cursor-pointer hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/50 transition-all flex items-center gap-1"
                      >
                        #{tag}
                        <X size={10} />
                      </span>
                    ))}
                  </div>
                )}

                {/* EDITING INTERACTION FOOTER CONTROLS */}
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-os-border/40">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditIsSensitive(!editIsSensitive)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        editIsSensitive ? 'bg-red-900/20 text-red-400' : 'text-os-muted hover:bg-os-bg hover:text-os-text'
                      }`}
                    >
                      <Lock size={14} />
                      {editIsSensitive ? 'Sensitive' : 'Not Sensitive'}
                    </button>

                    <button
                      type="button"
                      onClick={fetchCurrentLocation}
                      disabled={fetchingLocation}
                      className="flex items-center gap-1.5 text-xs bg-os-bg border border-os-border text-os-muted hover:text-white px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                    >
                      {fetchingLocation ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <MapPin size={13} className={editLocation ? "text-blue-400" : ""} />
                      )}
                      {editLocation ? "Update Location" : "Attach Location"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingId(null); setEditLocation(""); }}
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