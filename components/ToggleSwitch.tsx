
import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, id }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <label htmlFor={id} className="flex items-center cursor-pointer group">
      <div className="relative">
        <input 
          id={id} 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={handleChange} 
        />
        {/* Track */}
        <div 
            className="block w-12 h-7 rounded-full transition-all duration-300 ease-[var(--fi-cubic-bezier)] border border-transparent group-hover:border-white/10"
            style={{
                backgroundColor: checked ? 'var(--dynamic-accent-start)' : 'rgba(255, 255, 255, 0.1)',
                boxShadow: checked ? '0 0 10px var(--dynamic-accent-glow)' : 'inset 0 1px 3px rgba(0,0,0,0.5)'
            }}
        ></div>
        {/* Thumb */}
        <div 
            className={`absolute top-1 bg-white w-5 h-5 rounded-full transition-all duration-300 ease-[var(--fi-cubic-bezier)] shadow-md flex items-center justify-center`}
            style={{
                left: checked ? 'calc(100% - 1.5rem)' : '0.25rem',
                transform: checked ? 'translateX(0)' : 'translateX(0)'
            }}
        >
        </div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
