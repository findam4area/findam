import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import React from "react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js headers for server components
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
  }),
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock @/lib/supabase/server for API route tests
// Create a chainable mock that supports all Supabase query patterns
function createSupabaseMock() {
  const createChainableMock = (): any => {
    const mock: any = {};
    
    // Define promise resolution first
    const resolveAsPromise = () => Promise.resolve({ data: [], error: null });
    
    // Chainable methods that return the mock itself
    const chainableMethods = [
      'from', 'select', 'insert', 'update', 'delete', 'upsert',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'is', 'in', 'contains', 'containedBy',
      'rangeGt', 'rangeGte', 'rangeLt', 'rangeLte', 'rangeAdjacent',
      'overlaps', 'textSearch', 'match', 'not', 'or', 'filter',
      'order', 'limit', 'range'
    ];

    // Terminal methods that return promises
    const terminalMethods = {
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      csv: () => Promise.resolve({ data: null, error: null }),
      geojson: () => Promise.resolve({ data: null, error: null }),
      explain: () => Promise.resolve({ data: null, error: null }),
    };

    // Add chainable methods
    chainableMethods.forEach(method => {
      mock[method] = vi.fn().mockReturnValue(mock);
    });

    // Add terminal methods
    Object.entries(terminalMethods).forEach(([method, implementation]) => {
      mock[method] = vi.fn(implementation);
    });

    // Add then() to make the mock thenable (promise-like)
    mock.then = vi.fn((resolve) => resolveAsPromise().then(resolve));

    return mock;
  };

  const baseMock = createChainableMock();
  
  baseMock.auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
  
  baseMock.storage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: null }),
      createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
    }),
  };

  return baseMock;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(createSupabaseMock()),
}));

// Use real Supabase credentials from .env.local for integration tests
// If not set, fall back to test values for unit tests
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL =
    "https://whcwffuchlyjqhdpdwwi.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aGl4dWpnanN6ZXJqYmJ2Y3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTM2ODMsImV4cCI6MjA4NTcyOTY4M30.m5SBtetDYsRg9S5EeLOk8or5Ce_VIMcuN8zK0e7ojp8";
}

// Mock navigator.onLine
Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: true,
});

// Mock service worker
Object.defineProperty(navigator, "serviceWorker", {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
    }),
    ready: Promise.resolve({
      sync: {
        register: vi.fn().mockResolvedValue(undefined),
      },
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
});

// Mock IntersectionObserver for Framer Motion viewport animations
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = "";
  thresholds = [];
  takeRecords = vi.fn().mockReturnValue([]);
}

global.IntersectionObserver = IntersectionObserverMock as any;

// Mock Framer Motion to avoid JSDOM warnings about unknown props
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, prop) => {
        // Return a component that passes through all props except motion-specific ones
        const Component = ({ children, ...props }: any) => {
          // Filter out Framer Motion specific props
          const {
            initial,
            animate,
            exit,
            variants,
            transition,
            whileHover,
            whileTap,
            whileFocus,
            whileDrag,
            whileInView,
            drag,
            dragConstraints,
            dragElastic,
            dragMomentum,
            layout,
            layoutId,
            onAnimationStart,
            onAnimationComplete,
            ...restProps
          } = props;

          // Return a native element with non-motion props
          return React.createElement(prop as string, restProps, children);
        };
        return Component;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  useMotionValue: (initial: any) => ({
    get: () => initial,
    set: vi.fn(),
    onChange: vi.fn(),
  }),
  useTransform: (value: any) => value,
  useSpring: (value: any) => value,
  useScroll: () => ({
    scrollY: { get: () => 0, onChange: vi.fn() },
    scrollX: { get: () => 0, onChange: vi.fn() },
    scrollYProgress: { get: () => 0, onChange: vi.fn() },
    scrollXProgress: { get: () => 0, onChange: vi.fn() },
  }),
  useInView: () => true,
  useReducedMotion: () => false,
  useDragControls: () => ({
    start: vi.fn(),
  }),
}));


// Mock CategoryPreviewPopover to prevent JSDOM/floating-ui errors
vi.mock("@/components/features/category-preview-popover", () => ({
  CategoryPreviewPopover: ({ children }: any) => children,
}));


// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { src, alt, ...props });
  },
}));


// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));
