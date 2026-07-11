import React, { createContext, useContext, useState, useEffect } from 'react';

type FontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';

interface FontSizeContextType {
  fontSize: FontSize;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const fontSizes: FontSize[] = ['sm', 'base', 'lg', 'xl', '2xl', '3xl'];

// Map sizes to the actual CSS root percentage values
const sizeMap: Record<FontSize, string> = {
  sm: '90%',    // Scales text down slightly
  base: '100%',  // Default system standard (usually 16px)
  lg: '115%',   // Scaled up
  xl: '130%',   // High accessibility/readability scale
  '2xl': '150%', // Extra large
  '3xl': '175%', // Maximum scale
};

export const FontSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved preference from localStorage or default to 'base'
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('aabit_font_size') as FontSize) || 'base';
  });

  useEffect(() => {
    // 💡 THE TRICK: Apply the percentage to the root html element document
    document.documentElement.style.fontSize = sizeMap[fontSize];
    localStorage.setItem('aabit_font_size', fontSize);
  }, [fontSize]);

  const increaseFontSize = () => {
    const currentIndex = fontSizes.indexOf(fontSize);
    if (currentIndex < fontSizes.length - 1) {
      setFontSizeState(fontSizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const currentIndex = fontSizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSizeState(fontSizes[currentIndex - 1]);
    }
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, increaseFontSize, decreaseFontSize, setFontSize: setFontSizeState }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context) throw new Error('useFontSize must be used within a FontSizeProvider');
  return context;
};