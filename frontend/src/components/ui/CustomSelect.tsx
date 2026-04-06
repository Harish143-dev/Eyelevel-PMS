import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select...',
  disabled = false,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-main mb-1.5">{label}</label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          relative w-full flex items-center justify-between gap-2
          px-3.5 py-2.5 rounded-xl text-sm text-left
          border transition-all duration-200
          ${disabled
            ? 'bg-background/50 border-border/50 text-text-muted cursor-not-allowed opacity-60'
            : isOpen
              ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/5'
              : 'bg-surface border-border hover:border-primary/50 hover:shadow-md'
          }
          ${error ? 'border-danger ring-1 ring-danger/20' : ''}
        `}
      >
        <span className="flex items-center gap-2.5 truncate">
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/20"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          <span className={selectedOption ? 'text-text-main font-medium' : 'text-text-muted'}>
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="bg-surface border border-border rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
            <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left
                      transition-all duration-150 group
                      ${isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text-main hover:bg-primary/5 hover:text-primary'
                      }
                    `}
                  >
                    {option.color && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 transition-all ${isSelected ? 'ring-primary/30 scale-110' : 'ring-transparent group-hover:ring-primary/20'}`}
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.icon && (
                      <span className="flex-shrink-0">{option.icon}</span>
                    )}
                    <span className="flex-1 truncate">{option.label}</span>
                    {isSelected && (
                      <Check size={16} className="text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-danger">{error}</p>
      )}
    </div>
  );
};

export default CustomSelect;
