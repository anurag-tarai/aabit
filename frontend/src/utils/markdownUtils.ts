import React from 'react';

export const handleAutoBullet = (
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  content: string,
  setContent: (val: string) => void
) => {
  if (e.key === 'Enter') {
    const target = e.currentTarget;
    const start = target.selectionStart;
    
    // Get the current line up to the cursor
    const textBeforeCursor = content.substring(0, start);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];

    // Regex to match '- ' or '1. ' at the start of the line (with optional leading spaces)
    const bulletMatch = currentLine.match(/^(\s*)(-\s+|\d+\.\s+)/);

    if (bulletMatch) {
      e.preventDefault();
      const prefix = bulletMatch[0];

      // If the line only contains the bullet, pressing Enter should clear the bullet
      if (currentLine === prefix) {
        const newText = content.substring(0, start - prefix.length) + '\n' + content.substring(start);
        setContent(newText);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start - prefix.length + 1;
        }, 0);
        return;
      }

      // If numbered list, increment the number
      let nextPrefix = prefix;
      const numMatch = prefix.match(/^(\s*)(\d+)\.\s+/);
      if (numMatch) {
        const nextNum = parseInt(numMatch[2], 10) + 1;
        nextPrefix = `${numMatch[1]}${nextNum}. `;
      }

      const injected = `\n${nextPrefix}`;
      const newText = content.substring(0, start) + injected + content.substring(target.selectionEnd);
      setContent(newText);
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + injected.length;
      }, 0);
    }
  }
};
