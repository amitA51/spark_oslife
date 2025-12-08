/**
 * Style Utilities using Design Tokens
 * Reusable CSS class generators for consistent styling
 */

import { SPACING, BORDER_RADIUS, SHADOW, FONT_SIZE, FONT_WEIGHT } from './designTokens';

/**
 * Common component styles using design tokens
 */
export const commonStyles = {
  // Card styles
  card: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    boxShadow: SHADOW.md,
  },

  cardCompact: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    boxShadow: SHADOW.sm,
  },

  // Input styles
  input: {
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderRadius: BORDER_RADIUS.lg,
    fontSize: FONT_SIZE.base,
  },

  inputLarge: {
    padding: `${SPACING.lg} ${SPACING.xl}`,
    borderRadius: BORDER_RADIUS.xl,
    fontSize: FONT_SIZE.lg,
  },

  // Button styles
  button: {
    padding: `${SPACING.md} ${SPACING.xl}`,
    borderRadius: BORDER_RADIUS.lg,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },

  buttonLarge: {
    padding: `${SPACING.lg} ${SPACING['2xl']}`,
    borderRadius: BORDER_RADIUS.xl,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },

  // Section spacing
  section: {
    marginBottom: SPACING['3xl'],
  },

  sectionCompact: {
    marginBottom: SPACING.xl,
  },

  // Typography
  heading: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.lg,
  },

  subheading: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.md,
  },
};

/**
 * Helper to create inline styles from design tokens
 * @example getSpacing({ p: 'xl', mb: 'lg' }) => { padding: '24px', marginBottom: '16px' }
 */
type SpacingKey = keyof typeof SPACING;
type SpacingProps = {
  p?: SpacingKey;
  px?: SpacingKey;
  py?: SpacingKey;
  pt?: SpacingKey;
  pr?: SpacingKey;
  pb?: SpacingKey;
  pl?: SpacingKey;
  m?: SpacingKey;
  mx?: SpacingKey;
  my?: SpacingKey;
  mt?: SpacingKey;
  mr?: SpacingKey;
  mb?: SpacingKey;
  ml?: SpacingKey;
};

export const getSpacing = (props: SpacingProps): React.CSSProperties => {
  const styles: React.CSSProperties = {};

  if (props.p) styles.padding = SPACING[props.p];
  if (props.px) {
    styles.paddingLeft = SPACING[props.px];
    styles.paddingRight = SPACING[props.px];
  }
  if (props.py) {
    styles.paddingTop = SPACING[props.py];
    styles.paddingBottom = SPACING[props.py];
  }
  if (props.pt) styles.paddingTop = SPACING[props.pt];
  if (props.pr) styles.paddingRight = SPACING[props.pr];
  if (props.pb) styles.paddingBottom = SPACING[props.pb];
  if (props.pl) styles.paddingLeft = SPACING[props.pl];

  if (props.m) styles.margin = SPACING[props.m];
  if (props.mx) {
    styles.marginLeft = SPACING[props.mx];
    styles.marginRight = SPACING[props.mx];
  }
  if (props.my) {
    styles.marginTop = SPACING[props.my];
    styles.marginBottom = SPACING[props.my];
  }
  if (props.mt) styles.marginTop = SPACING[props.mt];
  if (props.mr) styles.marginRight = SPACING[props.mr];
  if (props.mb) styles.marginBottom = SPACING[props.mb];
  if (props.ml) styles.marginLeft = SPACING[props.ml];

  return styles;
};

/**
 * Responsive spacing helper
 * @example responsiveSpacing('sm', 'lg', 'xl') => sm on mobile, lg on tablet, xl on desktop
 */
export const responsiveSpacing = (
  mobile: SpacingKey,
  tablet?: SpacingKey,
  desktop?: SpacingKey
) => ({
  default: SPACING[mobile],
  '@media (min-width: 768px)': tablet ? SPACING[tablet] : undefined,
  '@media (min-width: 1024px)': desktop ? SPACING[desktop] : undefined,
});

/**
 * Generate focus ring styles (for accessibility)
 */
export const focusRing = {
  outline: 'none',
  boxShadow: `0 0 0 3px var(--dynamic-accent-start), 0 0 0 4px var(--dynamic-accent-end)`,
};

/**
 * Generate hover lift animation
 */
export const hoverLift = {
  transition: '300ms ease-out',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: SHADOW.lg,
  },
};
