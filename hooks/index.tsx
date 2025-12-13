/**
 * Hooks Index
 * 
 * Barrel export for all custom hooks.
 * Import from '@/hooks' for convenient access.
 */

// UI/State hooks
export { useToggle } from './useToggle';
export { usePrevious } from './usePrevious';
export { useLocalStorage } from './useLocalStorage';

// DOM/Browser hooks
export { useMediaQuery, useDeviceType, breakpoints } from './useMediaQuery';
export { useOnClickOutside } from './useOnClickOutside';
export { useClipboard } from './useClipboard';

// Accessibility hooks
export { useReducedMotion, useAnimationConfig, useA11yAnimation } from './useReducedMotion';

// Focus/Navigation hooks
export { useFocusTrap } from './useFocusTrap';

// Network/Status hooks
export { useNetworkStatus } from './useNetworkStatus';

// Existing app-specific hooks
export { useDebounce } from './useDebounce';
export { usePrefetch } from './usePrefetch';
export { useHaptics } from './useHaptics';
export { useSound } from './useSound';
export { useIdleTimer } from './useIdleTimer';
export { useWakeLock } from './useWakeLock';
