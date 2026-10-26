/**
 * Accessibility Utilities
 * 
 * Color contrast checking and validation utilities for WCAG 2.1 Level AA compliance
 * Requirements: 15.3 - Maintain color contrast ratios of at least 4.5:1 for normal text and 3:1 for large text
 */

export {
  getContrastRatio,
  meetsWCAGAA,
  checkAllColorCombinations,
  colorPalette,
} from './contrast-checker';

export {
  validateColorOnDarkBackground,
  validateColorOnDarkCard,
  validateTextOnBackground,
  validateCategoryColor,
  validateBadgeColor,
  sanitizeHexColor,
  isBackgroundDarkEnough,
  isBackgroundLightEnough,
  accessibleAccentColors,
  findClosestAccessibleColor,
  type ColorValidationResult,
} from './validate-color';
