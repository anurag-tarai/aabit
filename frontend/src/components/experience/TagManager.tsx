import { useState, useEffect } from 'react';
import { X, Edit2, Check, XCircle, Search } from 'lucide-react'; // Added Search icon
import { api } from '../../api/client';
import type { Tag } from '../../api/client';

export const TagManager = ({ onClose, onTagsChanged }: { onClose: () => void, onTagsChanged: () => void }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [filterText, setFilterText] = useState(''); // New: state for the search filter
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTags = async () => {
    try {
      const res = await api.get<Tag[]>('/tags');
      setTags(res.data);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleEditClick = (tag: Tag) => {
    setEditingId(tag.id);
    setEditValue(tag.name);
  };

  const handleSave = async (id: string) => {
    if (!editValue.trim()) return;
    try {
      await api.put(`/tags/${id}`, { name: editValue });
      setEditingId(null);
      fetchTags();
      onTagsChanged(); // Refresh the main feed so updated names show up
    } catch (error) {
      console.error("Failed to update tag", error);
      alert("Failed to update. Make sure the name isn't a duplicate.");
    }
  };

  // New: Filter the tags based on the input text
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-os-surface border border-os-border rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-os-border">
          <h2 className="text-lg font-bold text-white">Tag Database</h2>
          <button onClick={onClose} className="text-os-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* New: Filter Input Field */}
        {!loading && tags.length > 0 && (
          <div className="p-4 pb-0">
            <div className="relative flex items-center bg-os-bg border border-os-border rounded-lg px-3 py-2 text-sm">
              <Search size={16} className="text-os-muted mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Filter tags..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="bg-transparent text-white outline-none w-full placeholder-os-muted"
              />
              {filterText && (
                <button 
                  onClick={() => setFilterText('')} 
                  className="text-os-muted hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tag List */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
          {loading ? (
             <p className="text-sm text-os-muted">Loading tags...</p>
          ) : tags.length === 0 ? (
             <p className="text-sm text-os-muted">No tags created yet.</p>
          ) : filteredTags.length === 0 ? (
             <p className="text-sm text-os-muted">No matching tags found.</p>
          ) : (
            filteredTags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between bg-os-bg border border-os-border p-2 rounded-lg">
                {editingId === tag.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-os-muted">#</span>
                    <input 
                      autoFocus
                      type="text" 
                      value={editValue} 
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-transparent text-sm text-white outline-none w-full border-b border-gray-600 focus:border-white transition-colors"
                    />
                    <button onClick={() => handleSave(tag.id)} className="text-green-500 hover:text-green-400">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400">
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-gray-200">#{tag.name}</span>
                    <button onClick={() => handleEditClick(tag)} className="text-os-muted hover:text-white transition-colors p-1">
                      <Edit2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};