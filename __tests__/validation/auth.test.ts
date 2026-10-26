/**
 * Property-Based Tests for Authentication Validation
 * 
 * This file tests authentication validation schemas using property-based testing
 * with fast-check to ensure robustness against edge cases and random inputs.
 * 
 * Requirements: 2.4, 2.5
 * Task: 3.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from '@/lib/validation/schemas';

// ============================================================================
// Custom Arbitraries for Authentication Testing
// ============================================================================

/**
 * Generate valid RFC 5322 email addresses
 * Uses a simple but reliable pattern
 */
const validEmailArbitrary = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 2, maxLength: 10 }),
    fc.constantFrom('com', 'org', 'net', 'edu', 'io', 'ng')
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Generate valid passwords meeting all requirements:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains digit
 */
const validPasswordArbitrary = fc
  .tuple(
    fc.integer({ min: 1, max: 5 }),
    fc.integer({ min: 1, max: 5 }),
    fc.integer({ min: 1, max: 5 }),
    fc.integer({ min: 0, max: 10 })
  )
  .map(([numUpper, numLower, numDigit, numExtra]) => {
    const upper = fc.sample(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), numUpper).join('');
    const lower = fc.sample(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), numLower).join('');
    const digit = fc.sample(fc.constantFrom(...'0123456789'.split('')), numDigit).join('');
    const extra = fc.sample(fc.constantFrom(...'!@#$%^&*()-_=+[]{}|;:,.<>?'.split('')), numExtra).join('');
    
    // Combine and shuffle
    const chars = (upper + lower + digit + extra).split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    
    let password = chars.join('');
    // Ensure it's at least 8 characters
    if (password.length < 8) {
      const needed = 8 - password.length;
      password = password + 'Aa1' + ('0'.repeat(Math.max(0, needed - 3)));
    }
    return password;
  });

/**
 * Generate invalid passwords that violate at least one requirement
 */
const invalidPasswordArbitrary = fc.oneof(
  // Too short (less than 8 characters)
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), { minLength: 1, maxLength: 7 }),
  
  // No uppercase
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 8, maxLength: 20 }),
  
  // No lowercase
  fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), { minLength: 8, maxLength: 20 }),
  
  // No digits
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 8, maxLength: 20 }),
  
  // Empty
  fc.constant('')
);

/**
 * Generate valid full names (2-100 characters)
 */
const validFullNameArbitrary = fc
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('')), { minLength: 2, maxLength: 50 })
  .filter((name) => {
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100 && /[a-zA-Z]{2}/.test(trimmed);
  })
  .map((name) => name.trim());

// ============================================================================
// Property-Based Tests for Register Schema
// ============================================================================

describe('registerSchema - Property-Based Tests', () => {
  it('should accept any valid RFC 5322 email', () => {
    fc.assert(
      fc.property(validEmailArbitrary, validPasswordArbitrary, validFullNameArbitrary, (email, password, full_name) => {
        const result = registerSchema.safeParse({ email, password, full_name });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe(email);
          expect(result.data.password).toBe(password);
          expect(result.data.full_name).toBe(full_name);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should accept any password with 8+ chars, uppercase, lowercase, and digit', () => {
    fc.assert(
      fc.property(validEmailArbitrary, validPasswordArbitrary, validFullNameArbitrary, (email, password, full_name) => {
        const result = registerSchema.safeParse({ email, password, full_name });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject any password without required elements', () => {
    fc.assert(
      fc.property(validEmailArbitrary, invalidPasswordArbitrary, validFullNameArbitrary, (email, password, full_name) => {
        const result = registerSchema.safeParse({ email, password, full_name });
        
        // Should either fail or be a special case that actually meets requirements
        if (result.success) {
          // If it passed, verify it actually meets requirements
          const pw = result.data.password;
          expect(pw.length).toBeGreaterThanOrEqual(8);
          expect(/[A-Z]/.test(pw)).toBe(true);
          expect(/[a-z]/.test(pw)).toBe(true);
          expect(/[0-9]/.test(pw)).toBe(true);
        } else {
          // If it failed, that's expected
          expect(result.success).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should reject full_name less than 2 characters', () => {
    // Test actually invalid names (less than 2 characters)
    const shortNames = ['', 'a'];
    shortNames.forEach(full_name => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'ValidPass123',
        full_name
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.path[0] === 'full_name')).toBe(true);
      }
    });
  });

  it('should reject full_name more than 100 characters', () => {
    fc.assert(
      fc.property(validEmailArbitrary, validPasswordArbitrary, (email, password) => {
        // Generate a name that's definitely over 100 characters
        const full_name = 'A'.repeat(101);
        const result = registerSchema.safeParse({ email, password, full_name });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.some(e => e.path[0] === 'full_name')).toBe(true);
        }
      }),
      { numRuns: 25 }
    );
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user @example.com',
      'user@.com',
      '',
      'user@domain',
    ];

    invalidEmails.forEach((email) => {
      fc.assert(
        fc.property(validPasswordArbitrary, validFullNameArbitrary, (password, full_name) => {
          const result = registerSchema.safeParse({ email, password, full_name });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.errors.some(e => e.path[0] === 'email')).toBe(true);
          }
        }),
        { numRuns: 5 }
      );
    });
  });
});

// ============================================================================
// Example-Based Tests for Register Schema
// ============================================================================

describe('registerSchema - Example-Based Tests', () => {
  it('should accept valid registration data', () => {
    const validData = {
      email: 'john.doe@example.com',
      password: 'SecurePass123',
      full_name: 'John Doe',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('should reject password without uppercase', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'password123',
      full_name: 'User Name',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('uppercase');
    }
  });

  it('should reject password without lowercase', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'PASSWORD123',
      full_name: 'User Name',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('lowercase');
    }
  });

  it('should reject password without digit', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'PasswordOnly',
      full_name: 'User Name',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('number');
    }
  });

  it('should reject password shorter than 8 characters', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'Pass1',
      full_name: 'User Name',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('8 characters');
    }
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user @example.com',
    ];

    invalidEmails.forEach((email) => {
      const result = registerSchema.safeParse({
        email,
        password: 'ValidPass123',
        full_name: 'User Name',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path[0]).toBe('email');
      }
    });
  });

  it('should reject empty full_name', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'ValidPass123',
      full_name: '',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path[0]).toBe('full_name');
    }
  });

  it('should accept special characters in password', () => {
    const validData = {
      email: 'user@example.com',
      password: 'P@ssw0rd!#$%',
      full_name: 'User Name',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept names with spaces and hyphens', () => {
    const validData = {
      email: 'user@example.com',
      password: 'ValidPass123',
      full_name: "Mary-Jane O'Connor",
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Property-Based Tests for Login Schema
// ============================================================================

describe('loginSchema - Property-Based Tests', () => {
  it('should accept any valid email and non-empty password', () => {
    fc.assert(
      fc.property(validEmailArbitrary, fc.string({ minLength: 1 }), (email, password) => {
        const result = loginSchema.safeParse({ email, password });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe(email);
          expect(result.data.password).toBe(password);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should reject empty password', () => {
    fc.assert(
      fc.property(validEmailArbitrary, (email) => {
        const result = loginSchema.safeParse({ email, password: '' });
        expect(result.success).toBe(false);
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Example-Based Tests for Login Schema
// ============================================================================

describe('loginSchema - Example-Based Tests', () => {
  it('should accept valid login credentials', () => {
    const validData = {
      email: 'user@example.com',
      password: 'anypassword',
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty email', () => {
    const invalidData = {
      email: '',
      password: 'password',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const invalidData = {
      email: 'user@example.com',
      password: '',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'password',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Property-Based Tests for Password Reset Request Schema
// ============================================================================

describe('passwordResetRequestSchema - Property-Based Tests', () => {
  it('should accept any valid email', () => {
    fc.assert(
      fc.property(validEmailArbitrary, (email) => {
        const result = passwordResetRequestSchema.safeParse({ email });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe(email);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = ['notanemail', '@example.com', 'user@', ''];

    invalidEmails.forEach((email) => {
      const result = passwordResetRequestSchema.safeParse({ email });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Example-Based Tests for Password Reset Request Schema
// ============================================================================

describe('passwordResetRequestSchema - Example-Based Tests', () => {
  it('should accept valid email', () => {
    const validData = { email: 'user@example.com' };
    const result = passwordResetRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty email', () => {
    const invalidData = { email: '' };
    const result = passwordResetRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Property-Based Tests for Password Reset Schema
// ============================================================================

describe('passwordResetSchema - Property-Based Tests', () => {
  it('should accept matching valid passwords', () => {
    fc.assert(
      fc.property(validPasswordArbitrary, (password) => {
        const result = passwordResetSchema.safeParse({
          password,
          confirmPassword: password,
        });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject non-matching passwords', () => {
    fc.assert(
      fc.property(
        validPasswordArbitrary,
        validPasswordArbitrary,
        (password1, password2) => {
          // Skip if passwords accidentally match
          fc.pre(password1 !== password2);

          const result = passwordResetSchema.safeParse({
            password: password1,
            confirmPassword: password2,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.errors.some(e => e.message.includes('match'))).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid passwords even if they match', () => {
    fc.assert(
      fc.property(invalidPasswordArbitrary, (password) => {
        const result = passwordResetSchema.safeParse({
          password,
          confirmPassword: password,
        });
        
        // Should either fail or be a special case that actually meets requirements
        if (result.success) {
          const pw = result.data.password;
          expect(pw.length).toBeGreaterThanOrEqual(8);
          expect(/[A-Z]/.test(pw)).toBe(true);
          expect(/[a-z]/.test(pw)).toBe(true);
          expect(/[0-9]/.test(pw)).toBe(true);
        } else {
          expect(result.success).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Example-Based Tests for Password Reset Schema
// ============================================================================

describe('passwordResetSchema - Example-Based Tests', () => {
  it('should accept matching valid passwords', () => {
    const validData = {
      password: 'NewPass123',
      confirmPassword: 'NewPass123',
    };

    const result = passwordResetSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject non-matching passwords', () => {
    const invalidData = {
      password: 'NewPass123',
      confirmPassword: 'DifferentPass123',
    };

    const result = passwordResetSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('match');
    }
  });

  it('should reject weak password even if both match', () => {
    const invalidData = {
      password: 'weak',
      confirmPassword: 'weak',
    };

    const result = passwordResetSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject empty confirmPassword', () => {
    const invalidData = {
      password: 'ValidPass123',
      confirmPassword: '',
    };

    const result = passwordResetSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
