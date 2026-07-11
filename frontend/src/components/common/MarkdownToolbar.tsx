import React from 'react';
import { Heading1, Code, Quote, Minus } from 'lucide-react';

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

  const inject = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const injected = `${prefix}${selected || ''}${suffix}`;

    const updated =
      content.substring(0, start) +
      injected +
      content.substring(end);

    setContent(updated);

    setTimeout(() => {
      textarea.focus();
      const pos = start + prefix.length + selected.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div className="flex gap-1 bg-os-bg p-1 border border-os-border rounded-lg max-w-max">
      
      {/* Heading */}
      <button
        type="button"
        onClick={() => inject('# ')}
        className="p-1.5 text-os-muted hover:text-white hover:bg-os-surface rounded"
        title="Heading"
      >
        <Heading1 size={15} />
      </button>

      {/* Code Block */}
      <button
        type="button"
        onClick={() => inject('```\n', '\n```')}
        className="p-1.5 text-os-muted hover:text-white hover:bg-os-surface rounded"
        title="Highlighted box"
      >
        <Code size={15} />
      </button>

      {/* Quote */}
      <button
        type="button"
        onClick={() => inject('> ')}
        className="p-1.5 text-os-muted hover:text-white hover:bg-os-surface rounded"
        title="Quote"
      >
        <Quote size={15} />
      </button>

      {/* Horizontal Line */}
      <button
        type="button"
        onClick={() => inject('\n---\n')}
        className="p-1.5 text-os-muted hover:text-white hover:bg-os-surface rounded"
        title="Horizontal line"
      >
        <Minus size={15} />
      </button>

    </div>
  );
};