// Zod validation schemas for all data models
import { z } from 'zod'

// Base schemas
export const FontSizeSchema = z.enum(['small', 'medium', 'large', 'extra-large'])
export const ThemeSchema = z.enum(['light', 'dark', 'system'])
export const SyncStatusSchema = z.enum(['synced', 'pending', 'conflict'])
export const TestamentSchema = z.enum(['old', 'new'])

// User-related schemas
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().nullable(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const UserPreferencesSchema = z.object({
  theme: ThemeSchema,
  fontSize: FontSizeSchema,
  defaultVersion: z.string().min(1),
  autoSync: z.boolean(),
  notificationsEnabled: z.boolean(),
  verseOfTheDayEnabled: z.boolean(),
  readingPlan: z.string().optional()
})

// Bible content schemas
export const BibleVersionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  abbreviation: z.string().min(1).max(10),
  language: z.string().min(2).max(5),
  storagePath: z.string().min(1),
  isDownloaded: z.boolean(),
  downloadSize: z.number().min(0),
  createdAt: z.date().optional()
})

export const BookSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  abbreviation: z.string().min(1).max(10),
  testament: TestamentSchema,
  order: z.number().min(1).max(66),
  chapters: z.number().min(1)
})

export const VerseSchema = z.object({
  id: z.string().min(1),
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1),
  text: z.string().min(1),
  version: z.string().min(1)
})

export const ChapterSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().min(1),
  verses: z.array(VerseSchema),
  version: z.string().min(1)
})

// User content schemas
export const BookmarkSchema = z.object({
  id: z.string().min(1),
  userId: z.string().uuid(),
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1),
  createdAt: z.date(),
  syncStatus: SyncStatusSchema
})

export const NoteSchema = z.object({
  id: z.string().min(1),
  userId: z.string().uuid(),
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1),
  content: z.string().min(1).max(10000),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncStatus: SyncStatusSchema
})

export const HighlightSchema = z.object({
  id: z.string().min(1),
  userId: z.string().uuid(),
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  startOffset: z.number().min(0).optional(),
  endOffset: z.number().min(0).optional(),
  createdAt: z.date(),
  syncStatus: SyncStatusSchema
})

// Special features schemas
export const VerseOfTheDaySchema = z.object({
  id: z.string().min(1),
  date: z.date(),
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1),
  text: z.string().min(1),
  version: z.string().min(1),
  createdAt: z.date().optional()
})

export const ReadingPositionSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1).optional(),
  version: z.string().min(1),
  timestamp: z.date().optional()
})

// Extended schemas
export const BookmarkWithReferenceSchema = BookmarkSchema.extend({
  reference: z.string().min(1),
  displayText: z.string().optional()
})

export const NoteWithReferenceSchema = NoteSchema.extend({
  reference: z.string().min(1),
  wordCount: z.number().min(0),
  isRecent: z.boolean()
})

export const HighlightWithReferenceSchema = HighlightSchema.extend({
  reference: z.string().min(1),
  colorName: z.string().min(1)
})

export const BibleVersionWithStatusSchema = BibleVersionSchema.extend({
  downloadProgress: z.number().min(0).max(100).optional(),
  lastUsed: z.date().optional()
})

// Search schemas
export const SearchResultSchema = z.object({
  verse: VerseSchema,
  relevanceScore: z.number().min(0).max(1),
  highlightedText: z.string().min(1),
  context: z.object({
    previousVerse: VerseSchema.optional(),
    nextVerse: VerseSchema.optional()
  }).optional()
})

export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  versions: z.array(z.string().min(1)),
  books: z.array(z.string().min(1)).optional(),
  testament: TestamentSchema.optional(),
  exactMatch: z.boolean().optional()
})

// API schemas
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.nullable(),
    error: z.instanceof(Error).nullable(),
    success: z.boolean()
  })

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  ApiResponseSchema(z.array(dataSchema)).extend({
    pagination: z.object({
      page: z.number().min(1),
      limit: z.number().min(1),
      total: z.number().min(0),
      hasMore: z.boolean()
    })
  })

// Validation schemas
export const ValidationErrorSchema = z.object({
  field: z.string().min(1),
  message: z.string().min(1),
  code: z.string().min(1)
})

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(ValidationErrorSchema)
})

// Sync operation schema
export const SyncOperationSchema = z.object({
  id: z.string().min(1),
  operation: z.enum(['create', 'update', 'delete']),
  entityType: z.enum(['bookmark', 'note', 'highlight']),
  entityId: z.string().min(1),
  data: z.any(),
  timestamp: z.date(),
  retryCount: z.number().min(0),
  maxRetries: z.number().min(1)
})

// Input validation schemas (for forms and API inputs)
export const CreateBookmarkInputSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1)
})

export const CreateNoteInputSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1),
  content: z.string().min(1).max(10000)
})

export const UpdateNoteInputSchema = z.object({
  content: z.string().min(1).max(10000)
})

export const CreateHighlightInputSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  startOffset: z.number().min(0).optional(),
  endOffset: z.number().min(0).optional()
})

export const UpdateUserPreferencesInputSchema = UserPreferencesSchema.partial()

// Type inference from schemas
export type UserProfileInput = z.infer<typeof UserProfileSchema>
export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>
export type BibleVersionInput = z.infer<typeof BibleVersionSchema>
export type BookInput = z.infer<typeof BookSchema>
export type VerseInput = z.infer<typeof VerseSchema>
export type ChapterInput = z.infer<typeof ChapterSchema>
export type BookmarkInput = z.infer<typeof BookmarkSchema>
export type NoteInput = z.infer<typeof NoteSchema>
export type HighlightInput = z.infer<typeof HighlightSchema>
export type VerseOfTheDayInput = z.infer<typeof VerseOfTheDaySchema>
export type ReadingPositionInput = z.infer<typeof ReadingPositionSchema>
export type SearchResultInput = z.infer<typeof SearchResultSchema>
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>
export type SyncOperationInput = z.infer<typeof SyncOperationSchema>

// Form input types
export type CreateBookmarkInput = z.infer<typeof CreateBookmarkInputSchema>
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>
export type UpdateNoteInput = z.infer<typeof UpdateNoteInputSchema>
export type CreateHighlightInput = z.infer<typeof CreateHighlightInputSchema>
export type UpdateUserPreferencesInput = z.infer<typeof UpdateUserPreferencesInputSchema>
