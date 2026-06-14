import React from 'react';
import { Quote, List, Bold } from 'lucide-react';

interface MarkdownToolbarProps {
  textareaId: string;
  content: string;
  setContent: (value: string) => void;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  textareaId,
  content,
  setContent,
}) => {

  const inject = (prefix: string) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const injected = `${prefix}${selected || ''}`;

    const updated =
      content.substring(0, start) +
      injected +
      content.substring(end);

    setContent(updated);

    setTimeout(() => {
      textarea.focus();
      const pos = start + injected.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div className="flex gap-1 bg-os-bg p-1 border border-os-border rounded-lg max-w-max">
      
      {/* Lesson / Quote */}
      <button
        type="button"
        onClick={() => inject('> ')}
        className="p-1.5 text-os-muted hover:text-white hover:bg-os-surface rounded"
        title="Lesson / Quote"
      >
        <Quote size={15} />
      </button>

      {/* Bullet */}
      <button
        type="button"
        onClick={() => inject('- ')}
        className="p-1.5 text-os-muted hover:text-white hover:bg-os-surface rounded"
        title="Bullet"
      >
        <List size={15} />
      </button>

      {/* Bold */}
      <button
        type="button"
        onClick={() => inject('**') }
        className="p-1.5 text-os-muted hover:text-white hover:bg-os-surface rounded"
        title="Bold"
      >
        <Bold size={15} />
      </button>

    </div>
  );
};