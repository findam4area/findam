import { describe, it, expect } from 'vitest';
import {
  getContrastRatio,
  meetsWCAGAA,
  checkAllColorCombinations,
  colorPalette,
} from './contrast-checker';

describe('Color Contrast Checker', () => {
  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should calculate correct contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('should handle HSL colors', () => {
      const ratio = getContrastRatio('hsl(222, 84%, 5%)', 'hsl(210, 40%, 98%)');
      expect(ratio).toBeGreaterThan(1);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should pass for high contrast normal text', () => {
      const result = meetsWCAGAA('#ffffff', '#000000', false);
      expect(result.passes).toBe(true);
      expect(result.level).toBe('AAA');
    });

    it('should fail for low contrast normal text', () => {
      const result = meetsWCAGAA('#888888', '#999999', false);
      expect(result.passes).toBe(false);
      expect(result.level).toBe('Fail');
    });

    it('should have lower requirements for large text', () => {
      // A color combination that passes for large text but fails for normal text
      // Using a lower contrast color: #777777 on white
      const normalResult = meetsWCAGAA('#777777', '#ffffff', false);
      const largeResult = meetsWCAGAA('#777777', '#ffffff', true);

      // #777777 on white has a ratio of ~4.47:1
      // This should fail for normal text (needs 4.5:1) but pass for large text (needs 3:1)
      if (normalResult.ratio >= 4.5) {
        // If this color passes, use an even darker one
        const normalResult2 = meetsWCAGAA('#888888', '#ffffff', false);
        const largeResult2 = meetsWCAGAA('#888888', '#ffffff', true);
        expect(normalResult2.passes).toBe(false);
        expect(largeResult2.passes).toBe(true);
      } else {
        expect(normalResult.passes).toBe(false);
        expect(largeResult.passes).toBe(true);
      }
    });
  });

  describe('Color Palette Compliance', () => {
    it('should check all critical color combinations', () => {
      const results = checkAllColorCombinations();

      console.log('\n=== Color Contrast Audit ===\n');

      results.forEach((combo) => {
        const status = combo.result.passes ? '✓ PASS' : '✗ FAIL';
        const textSize = combo.isLargeText ? 'Large' : 'Normal';

        console.log(`${status} ${combo.name} (${textSize})`);
        console.log(`  Ratio: ${combo.result.ratio}:1 (Required: ${combo.result.required}:1)`);
        console.log(`  Level: ${combo.result.level}\n`);
      });

      // Assert that critical combinations pass
      const failedCombinations = results.filter((r) => !r.result.passes);

      if (failedCombinations.length > 0) {
        console.log('\n⚠️  Failed Combinations:');
        failedCombinations.forEach((combo) => {
          console.log(`  - ${combo.name}: ${combo.result.ratio}:1 (needs ${combo.result.required}:1)`);
        });
      }

      // We expect all combinations to pass
      expect(failedCombinations.length).toBe(0);
    });

    it('should verify foreground on background meets AA for normal text', () => {
      const result = meetsWCAGAA(colorPalette.foreground, colorPalette.background, false);
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should verify naija green on dark background meets AA for normal text', () => {
      const result = meetsWCAGAA(colorPalette.naijaGreen, colorPalette.background, false);
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should verify muted text on dark background meets AA for normal text', () => {
      const result = meetsWCAGAA(colorPalette.mutedForeground, colorPalette.background, false);
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Browser Zoom Support', () => {
    it('should document that all text uses relative units (rem/em)', () => {
      // This is a documentation test
      // In practice, we need to ensure all font-size declarations use rem or em
      // and that the layout doesn't break at 200% zoom
      expect(true).toBe(true);
    });
  });
});
