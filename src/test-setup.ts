import { vi } from 'vitest'

// Mock IndexedDB
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  readyState: 'done',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}

const mockIDBDatabase = {
  name: 'test-db',
  version: 1,
  objectStoreNames: [],
  transaction: vi.fn(() => mockIDBTransaction),
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}

const mockIDBTransaction = {
  objectStore: vi.fn(() => mockIDBObjectStore),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  db: mockIDBDatabase,
  error: null,
  mode: 'readonly',
  durability: 'default'
}

const mockIDBObjectStore = {
  add: vi.fn(() => mockIDBRequest),
  put: vi.fn(() => mockIDBRequest),
  get: vi.fn(() => mockIDBRequest),
  delete: vi.fn(() => mockIDBRequest),
  clear: vi.fn(() => mockIDBRequest),
  count: vi.fn(() => mockIDBRequest),
  getAll: vi.fn(() => mockIDBRequest),
  getAllKeys: vi.fn(() => mockIDBRequest),
  getKey: vi.fn(() => mockIDBRequest),
  openCursor: vi.fn(() => mockIDBRequest),
  openKeyCursor: vi.fn(() => mockIDBRequest),
  createIndex: vi.fn(),
  deleteIndex: vi.fn(),
  index: vi.fn(),
  name: 'test-store',
  keyPath: 'id',
  indexNames: [],
  transaction: mockIDBTransaction,
  autoIncrement: false
}

const mockIDBFactory = {
  open: vi.fn(() => {
    const request = { ...mockIDBRequest }
    setTimeout(() => {
      request.result = mockIDBDatabase
      if (request.onsuccess) request.onsuccess({ target: request } as any)
    }, 0)
    return request
  }),
  deleteDatabase: vi.fn(() => mockIDBRequest),
  databases: vi.fn(() => Promise.resolve([])),
  cmp: vi.fn()
}

// Mock global IndexedDB
Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIDBFactory,
  writable: true
})

Object.defineProperty(globalThis, 'IDBDatabase', {
  value: vi.fn(() => mockIDBDatabase),
  writable: true
})

Object.defineProperty(globalThis, 'IDBTransaction', {
  value: vi.fn(() => mockIDBTransaction),
  writable: true
})

Object.defineProperty(globalThis, 'IDBObjectStore', {
  value: vi.fn(() => mockIDBObjectStore),
  writable: true
})

Object.defineProperty(globalThis, 'IDBRequest', {
  value: vi.fn(() => mockIDBRequest),
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock sessionStorage
Object.defineProperty(globalThis, 'sessionStorage', {
  value: localStorageMock,
  writable: true
})

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: mockIntersectionObserver,
  writable: true
})

// Mock ResizeObserver
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: mockResizeObserver,
  writable: true
})

// Mock matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  value: vi.fn(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })),
  writable: true
})

// Mock navigator
Object.defineProperty(globalThis, 'navigator', {
  value: {
    ...globalThis.navigator,
    serviceWorker: {
      register: vi.fn(() => Promise.resolve({
        installing: null,
        waiting: null,
        active: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })),
      getRegistration: vi.fn(() => Promise.resolve(null)),
      getRegistrations: vi.fn(() => Promise.resolve([])),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    onLine: true
  },
  writable: true
})

// Mock fetch
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
  } as Response)
)

// Mock URL.createObjectURL
Object.defineProperty(globalThis.URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:mock-url'),
  writable: true
})

Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true
})

// Mock crypto
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
    randomUUID: vi.fn(() => '12345678-1234-1234-1234-123456789012')
  },
  writable: true
})

// Mock performance
Object.defineProperty(globalThis, 'performance', {
  value: {
    ...globalThis.performance,
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => [])
  },
  writable: true
})

// Mock requestAnimationFrame
globalThis.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16)
  return 1
})

globalThis.cancelAnimationFrame = vi.fn()

// Mock requestIdleCallback
globalThis.requestIdleCallback = vi.fn((cb) => {
  setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0)
  return 1
})

globalThis.cancelIdleCallback = vi.fn()

// Mock console methods to reduce noise in tests
const originalConsole = globalThis.console
globalThis.console = {
  ...originalConsole,
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockReturnValue(null)
  localStorageMock.setItem.mockImplementation(() => {})
  localStorageMock.removeItem.mockImplementation(() => {})
  localStorageMock.clear.mockImplementation(() => {})
})
