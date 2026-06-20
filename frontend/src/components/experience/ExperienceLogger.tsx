import { useState, useEffect } from 'react';
import { Send, Lock, Hash, Loader2 } from 'lucide-react';
import { MarkdownToolbar } from '../common/MarkdownToolbar';
import { api } from "../../api/client";
import type { Tag, ExperienceRequest } from "../../api/client";

export const ExperienceLogger = ({ onLogSuccess }: { onLogSuccess: () => void }) => {
  const [content, setContent] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [location, setLocation] = useState<string>('');
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    api.get<Tag[]>('/tags').then(res => setAllTags(res.data)).catch(console.error);
  }, []);

  const filteredTags = allTags.filter(t => {
    const input = tagInput.trim().toLowerCase();
    return input.length > 0 && t.name.toLowerCase().includes(input) && !selectedTags.includes(t.name.toLowerCase());
  });

  const handleAddTag = (tagName: string) => {
    const cleanName = tagName.trim().toLowerCase();
    if (cleanName && !selectedTags.includes(cleanName)) {
      setSelectedTags([...selectedTags, cleanName]);
    }
    setTagInput('');
    setShowDropdown(false);
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);

    try {
      let finalContent = content;

      // Appends location matching your exact plain text format
      if (location) {
        finalContent += `\n\n---\n📍 ${location}`;
      }

      const payload: ExperienceRequest = {
        markdownContent: finalContent,
        sensitive: isSensitive,
        tags: selectedTags,
      };

      await api.post('/experiences', payload);
      setContent('');
      setSelectedTags([]);
      setIsSensitive(false);
      setLocation(''); 
      onLogSuccess();
    } catch (error) {
      console.error('Failed to log experience', error);
      alert('Failed to connect to backend.');
    } finally {
      setIsSubmitting(false);
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
            setLocation(cleanAddress);
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error("Geocoding failed:", error);
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        alert(`Failed to get location: ${error.message}`);
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 300000}
    );
  };

  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4 flex flex-col gap-3 shadow-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold tracking-tight text-white">Today</h2>
      </div>

      <MarkdownToolbar textareaId="main-logger-textarea" content={content} setContent={setContent} />

      <textarea
        id="main-logger-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What happened? What did you learn?"
        className={`w-full h-40 p-3 bg-os-bg border border-os-border rounded-lg text-os-text focus:ring-1 focus:ring-gray-500 outline-none resize-none transition-all ${
          isSensitive ? 'blur-[3px] focus:blur-none hover:blur-none' : ''
        }`}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCurrentLocation}
            disabled={fetchingLocation}
            className="flex items-center gap-1.5 text-xs bg-os-bg border border-os-border hover:text-white px-2.5 py-1.5 rounded-lg text-os-muted transition-colors cursor-pointer"
          >
            {fetchingLocation ? "Getting Location..." : "📍 Auto-Attach Location"}
          </button>
        </div>
        {location && (
          <p className="text-[11px] text-green-400 bg-os-bg/50 border border-os-border/50 rounded-md p-2 font-mono break-words">
            Will append: 📍 {location}
          </p>
        )}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 p-2 bg-os-bg border border-os-border rounded-lg focus-within:border-gray-500 transition-colors">
          <Hash size={16} className="text-os-muted" />
          <input
            type="text"
            value={tagInput}
            onChange={(e) => { setTagInput(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search or create tags..."
            className="bg-transparent text-sm w-full outline-none placeholder-os-muted text-white"
          />
        </div>

        {showDropdown && tagInput && (
          <div className="absolute top-full left-0 w-full mt-1 bg-os-surface border border-os-border rounded-lg shadow-xl z-10 overflow-hidden">
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag.name)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-os-bg transition-colors text-gray-200"
              >
                #{tag.name}
              </button>
            ))}
            {!filteredTags.find(t => t.name === tagInput.toLowerCase().trim()) && (
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-os-bg transition-colors"
              >
                Create new tag: #{tagInput.toLowerCase().trim()}
              </button>
            )}
          </div>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <span
              key={tag}
              onClick={() => removeTag(tag)}
              className="px-2 py-1 text-xs bg-os-border text-os-text rounded-md cursor-pointer hover:bg-red-900/50 hover:text-red-400 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-os-border">
        <button
          type="button"
          onClick={() => setIsSensitive(!isSensitive)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            isSensitive ? 'bg-red-900/20 text-red-400' : 'text-os-muted hover:bg-os-bg hover:text-os-text'
          }`}
        >
          <Lock size={14} />
          {isSensitive ? 'Sensitive' : 'Not Sensitive'}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="flex items-center gap-2 px-4 py-1.5 bg-white text-black font-semibold rounded-md text-sm disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Log
        </button>
      </div>
    </div>
  );
};