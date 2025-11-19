import React from 'react';

interface NavItemProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick, onContextMenu }) => {

    const iconClasses = `h-6 w-6 transition-all duration-500 ease-[var(--fi-cubic-bezier)] ${isActive ? 'nav-icon-active' : 'text-[var(--text-secondary)] group-hover:text-white'
        }`;

    const finalIcon = React.isValidElement<{ className?: string, filled?: boolean }>(icon)
        ? React.cloneElement(icon, { className: iconClasses, filled: isActive })
        : icon;

    return (
        <button
            onClick={onClick}
            onContextMenu={onContextMenu}
            className="relative z-10 flex flex-col items-center justify-center h-full w-full transition-colors duration-300 group focus:outline-none"
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
        >
            {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-[var(--dynamic-accent-start)] rounded-full opacity-10 blur-xl"></div>
            )}

            <div className={`relative flex flex-col items-center justify-center transition-transform duration-300 transform-gpu group-active:scale-90 ${isActive ? '-translate-y-1' : 'translate-y-0'}`}>
                {finalIcon}
                <span
                    className={`text-[10px] mt-1 font-bold tracking-wide transition-all duration-300 ease-[var(--fi-cubic-bezier)] 
          ${isActive ? 'text-white opacity-100 translate-y-0' : 'text-[var(--text-secondary)] opacity-0 translate-y-2 scale-75'}`}
                >
                    {label}
                </span>
            </div>
        </button>
    );
};

export default NavItem;
