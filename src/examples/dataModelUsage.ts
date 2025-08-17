// Example usage of data models, validation, and utilities
import {
  ValidationUtils,
  DataTransformers,
  MockDataGenerator,
  type UserProfile,
  type CreateBookmarkInput,
  type CreateNoteInput,
  type Bookmark,
  type Note
} from '@/utils'

// Example 1: Validating user input for creating a bookmark
export function createBookmarkExample() {
  const userInput = {
    book: 'John',
    chapter: 3,
    verse: 16
  }

  // Validate the input
  const validation = ValidationUtils.validateCreateBookmark(userInput)

  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors)
    return null
  }

  // Parse the validated input
  const parsedInput = ValidationUtils.parseCreateBookmark(userInput)

  if (!parsedInput) {
    console.error('Failed to parse bookmark input')
    return null
  }

  console.log('Valid bookmark input:', parsedInput)
  return parsedInput
}

// Example 2: Creating and validating a note
export function createNoteExample() {
  const noteInput: CreateNoteInput = {
    book: 'Romans',
    chapter: 8,
    verse: 28,
    content: 'This verse reminds me that God works all things together for good for those who love Him.'
  }

  // Validate the note input
  const validation = ValidationUtils.validateCreateNote(noteInput)

  if (validation.isValid) {
    console.log('Note input is valid!')

    // Generate a full note object (simulating what would happen after saving to database)
    const fullNote = MockDataGenerator.generateNote('user-123', {
      book: noteInput.book,
      chapter: noteInput.chapter,
      verse: noteInput.verse,
      content: noteInput.content
    })

    return fullNote
  } else {
    console.error('Note validation failed:', validation.errors)
    return null
  }
}

// Example 3: Transforming data between formats
export function dataTransformationExample() {
  // Generate mock bookmark
  const bookmark = MockDataGenerator.generateBookmark('user-123')

  // Transform to database format
  const dbFormat = DataTransformers.transformBookmarkToDb(bookmark)
  console.log('Database format:', dbFormat)

  // Transform back to application format (simulating database retrieval)
  const appFormat = DataTransformers.transformBookmark({
    ...dbFormat,
    id: parseInt(bookmark.id),
    created_at: bookmark.createdAt.toISOString()
  })
  console.log('Application format:', appFormat)

  // Add reference information
  const withReference = DataTransformers.transformBookmarkWithReference(
    appFormat,
    'For God so loved the world...'
  )
  console.log('With reference:', withReference)

  return withReference
}

// Example 4: Working with verse references
export function verseReferenceExample() {
  const book = 'John'
  const chapter = 3
  const verse = 16

  // Generate reference string
  const reference = DataTransformers.generateVerseReference(book, chapter, verse)
  console.log('Generated reference:', reference) // "John 3:16"

  // Parse reference string back to components
  const parsed = DataTransformers.parseVerseReference(reference)
  console.log('Parsed reference:', parsed) // { book: 'John', chapter: 3, verse: 16 }

  // Validate the reference format
  const isValid = ValidationUtils.isValidVerseReference(reference)
  console.log('Is valid reference:', isValid) // true

  return { reference, parsed, isValid }
}

// Example 5: Generating mock data for development
export function mockDataExample() {
  const userId = 'user-123'

  // Generate a complete user dataset
  const userDataset = MockDataGenerator.generateUserDataset(userId)
  console.log('User dataset:', {
    profile: userDataset.profile,
    bookmarksCount: userDataset.bookmarks.length,
    notesCount: userDataset.notes.length,
    highlightsCount: userDataset.highlights.length
  })

  // Generate Bible content
  const bibleDataset = MockDataGenerator.generateBibleDataset()
  console.log('Bible dataset:', {
    versionsCount: bibleDataset.versions.length,
    booksCount: bibleDataset.books.length,
    sampleChapterVerses: bibleDataset.sampleChapter.verses.length
  })

  return { userDataset, bibleDataset }
}

// Example 6: Error handling and validation
export function validationErrorExample() {
  const invalidBookmark = {
    book: '', // Invalid: empty string
    chapter: 0, // Invalid: must be > 0
    verse: -1 // Invalid: must be > 0
  }

  const validation = ValidationUtils.validateCreateBookmark(invalidBookmark)

  if (!validation.isValid) {
    // Format errors for user display
    const userFriendlyErrors = ValidationUtils.formatErrorsForUser(validation.errors)
    console.log('User-friendly errors:', userFriendlyErrors)

    // Create a validation error
    const error = ValidationUtils.createValidationError(validation)
    console.log('Validation error:', error.message)

    return { errors: userFriendlyErrors, error }
  }

  return null
}

// Example 7: Text validation and sanitization
export function textValidationExample() {
  const userInput = '<script>alert("xss")</script>This is a note about John 3:16'

  // Sanitize and validate the text
  const validation = ValidationUtils.sanitizeAndValidateText(userInput, 1000)

  if (validation.isValid) {
    // Sanitize the input for safe display
    const sanitized = DataTransformers.sanitizeUserInput(userInput)
    console.log('Sanitized text:', sanitized)

    // Truncate if needed
    const truncated = DataTransformers.truncateText(sanitized, 50)
    console.log('Truncated text:', truncated)

    return { sanitized, truncated }
  } else {
    console.error('Text validation failed:', validation.errors)
    return null
  }
}

// Example usage function that demonstrates the complete workflow
export function completeWorkflowExample() {
  console.log('=== Data Models Usage Examples ===\n')

  console.log('1. Creating a bookmark:')
  const bookmark = createBookmarkExample()
  console.log(bookmark, '\n')

  console.log('2. Creating a note:')
  const note = createNoteExample()
  console.log(note, '\n')

  console.log('3. Data transformation:')
  const transformed = dataTransformationExample()
  console.log(transformed, '\n')

  console.log('4. Verse references:')
  const references = verseReferenceExample()
  console.log(references, '\n')

  console.log('5. Mock data generation:')
  const mockData = mockDataExample()
  console.log('Generated mock data successfully\n')

  console.log('6. Validation errors:')
  const errors = validationErrorExample()
  console.log(errors, '\n')

  console.log('7. Text validation:')
  const textValidation = textValidationExample()
  console.log(textValidation, '\n')

  console.log('=== Examples completed ===')
}
