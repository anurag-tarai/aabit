import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Add any custom props here if needed
}

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className = '', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 transition-colors w-full font-mono text-xs",
          className
        )}
        {...rest}
      />
    );
  }
);

CustomInput.displayName = 'CustomInput';
