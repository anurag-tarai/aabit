import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export const GlobalErrorToast = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleApiError = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      setError(customEvent.detail.message);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    };

    window.addEventListener('api-error', handleApiError);
    return () => window.removeEventListener('api-error', handleApiError);
  }, []);

  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="bg-red-950/90 border border-red-900 text-red-200 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-sm">
        <div className="flex-1 text-sm font-medium">{error}</div>
        <button 
          onClick={() => setError(null)}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
