/**
 * Add Screen Components Index
 * Premium components for the Add screen experience
 */

// Core Components
import SmartSearchBar from './SmartSearchBar';
import QuickCreateFAB from './QuickCreateFAB';
import TemplateCarousel from './TemplateCarousel';
import PremiumEmptyState from './PremiumEmptyState';

// Skeleton Loaders
import AddScreenSkeleton, {
  SearchBarSkeleton,
  TemplateCarouselSkeleton,
  CategoryGridSkeleton,
  RecentItemsSkeleton,
  FormSkeleton,
} from './AddScreenSkeleton';

// Export all components
export {
  SmartSearchBar,
  QuickCreateFAB,
  TemplateCarousel,
  PremiumEmptyState,
  AddScreenSkeleton,
  SearchBarSkeleton,
  TemplateCarouselSkeleton,
  CategoryGridSkeleton,
  RecentItemsSkeleton,
  FormSkeleton,
};

// Default export for convenience
export default {
  SmartSearchBar,
  QuickCreateFAB,
  TemplateCarousel,
  PremiumEmptyState,
  AddScreenSkeleton,
};