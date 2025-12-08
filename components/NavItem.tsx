import React from 'react';

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick, onContextMenu }) => {
  // Premium icon classes with spring-based transitions
  const iconClasses = `h-6 w-6 transition-all duration-base ease-spring-soft ${
    isActive
      ? 'scale-110'
      : 'text-gray-600 group-hover:text-white group-hover:scale-105'
  }`;

  const iconStyle = isActive
    ? {
        color: 'var(--dynamic-accent-start)',
        filter: 'drop-shadow(0 0 12px var(--dynamic-accent-glow))'
      }
    : {};

  const finalIcon = React.isValidElement<{ className?: string; filled?: boolean; style?: React.CSSProperties }>(icon)
    ? React.cloneElement(icon, { className: iconClasses, filled: isActive, style: iconStyle })
    : icon;

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="relative z-10 flex flex-col items-center justify-center h-full w-full transition-all duration-base ease-spring-soft group focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
      style={{
        ['--focus-outline-color' as any]: 'var(--dynamic-accent-start)'
      }}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active State Glow Background */}
      {isActive && (
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full opacity-20 blur-xl transition-all duration-slower ease-spring-soft"
          style={{
            background: `radial-gradient(circle, var(--dynamic-accent-start), transparent 70%)`,
          }}
        />
      )}

      {/* Icon + Label Container */}
      <div
        className={`relative flex flex-col items-center justify-center transition-all duration-base ease-spring-soft transform-gpu
          ${isActive ? '-translate-y-1' : 'translate-y-0'}
          group-active:scale-90
          group-hover:${isActive ? '' : '-translate-y-0.5'}`}
      >
        {/* Icon */}
        <div className="transition-transform duration-base ease-spring-soft">
          {finalIcon}
        </div>

        {/* Label - appears on active */}
        <span
          className={`text-[10px] mt-1 font-semibold tracking-wider uppercase transition-all duration-base ease-spring-soft
            ${isActive
              ? 'text-white opacity-100 translate-y-0 scale-100'
              : 'text-gray-500 opacity-0 -translate-y-1 scale-90'
            }`}
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          {label}
        </span>
      </div>

      {/* Hover Ripple Effect */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-base pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.05), transparent 70%)',
        }}
      />
    </button>
  );
};

export default NavItem;
