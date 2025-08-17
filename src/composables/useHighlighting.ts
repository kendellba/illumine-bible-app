import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Highlight, Verse } from '@/types'

export interface HighlightColor {
  name: string
  hex: string
  className: string
}

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  { name: 'Yellow', hex: '#FFFF00', className: 'highlight-yellow' },
  { name: 'Green', hex: '#00FF00', className: 'highlight-green' },
  { name: 'Blue', hex: '#0080FF', className: 'highlight-blue' },
  { name: 'Red', hex: '#FF0000', className: 'highlight-red' },
  { name: 'Orange', hex: '#FFA500', className: 'highlight-orange' },
  { name: 'Purple', hex: '#800080', className: 'highlight-purple' },
  { name: 'Pink', hex: '#FFC0CB', className: 'highlight-pink' }
]

export function useHighlighting() {
  const userStore = useUserStore()

  // State
  const isHighlighting = ref(false)
  const highlightElements = ref<Map<string, HTMLElement>>(new Map())

  // Computed
  const availableColors = computed(() => HIGHLIGHT_COLORS)

  // Methods
  function getColorByHex(hex: string): HighlightColor | undefined {
    return HIGHLIGHT_COLORS.find(color => color.hex.toLowerCase() === hex.toLowerCase())
  }

  function getColorClassName(hex: string): string {
    const color = getColorByHex(hex)
    return color?.className || 'highlight-custom'
  }

  async function addHighlight(
    verse: Verse,
    colorHex: string,
    startOffset?: number,
    endOffset?: number
  ): Promise<Highlight> {
    try {
      isHighlighting.value = true

      const highlight = await userStore.addHighlight(
        verse.book,
        verse.chapter,
        verse.verse,
        colorHex,
        startOffset,
        endOffset
      )

      return highlight
    } finally {
      isHighlighting.value = false
    }
  }

  async function removeHighlight(highlightId: string): Promise<void> {
    try {
      isHighlighting.value = true

      // Remove highlight element from DOM if it exists
      const element = highlightElements.value.get(highlightId)
      if (element) {
        removeHighlightElement(element)
        highlightElements.value.delete(highlightId)
      }

      await userStore.removeHighlight(highlightId)
    } finally {
      isHighlighting.value = false
    }
  }

  function applyHighlightToElement(
    element: HTMLElement,
    highlight: Highlight
  ): HTMLElement | null {
    const textContent = element.textContent || ''

    // If no specific offsets, highlight the entire verse
    if (highlight.startOffset === undefined || highlight.endOffset === undefined) {
      element.classList.add(getColorClassName(highlight.colorHex))
      element.style.backgroundColor = highlight.colorHex + '40' // Add transparency
      element.style.borderLeft = `4px solid ${highlight.colorHex}`

      highlightElements.value.set(highlight.id, element)
      return element
    }

    // Apply highlight to specific text range
    const startOffset = Math.max(0, highlight.startOffset)
    const endOffset = Math.min(textContent.length, highlight.endOffset)

    if (startOffset >= endOffset) return null

    try {
      const range = document.createRange()
      const textNode = getFirstTextNode(element)

      if (!textNode) return null

      range.setStart(textNode, startOffset)
      range.setEnd(textNode, endOffset)

      const highlightSpan = document.createElement('span')
      highlightSpan.className = `verse-highlight ${getColorClassName(highlight.colorHex)}`
      highlightSpan.style.backgroundColor = highlight.colorHex + '40'
      highlightSpan.style.borderBottom = `2px solid ${highlight.colorHex}`
      highlightSpan.dataset.highlightId = highlight.id
      highlightSpan.title = `Highlighted with ${getColorByHex(highlight.colorHex)?.name || 'custom color'}`

      range.surroundContents(highlightSpan)

      highlightElements.value.set(highlight.id, highlightSpan)
      return highlightSpan
    } catch (error) {
      console.error('Failed to apply highlight:', error)
      return null
    }
  }

  function removeHighlightElement(element: HTMLElement): void {
    const parent = element.parentNode
    if (parent) {
      // Move all child nodes to parent and remove the highlight element
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element)
      }
      parent.removeChild(element)

      // Normalize the parent to merge adjacent text nodes
      parent.normalize()
    }
  }

  function getFirstTextNode(element: HTMLElement): Text | null {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    )

    return walker.nextNode() as Text | null
  }

  function clearAllHighlights(): void {
    highlightElements.value.forEach((element, highlightId) => {
      removeHighlightElement(element)
    })
    highlightElements.value.clear()
  }

  function getHighlightsForVerse(book: string, chapter: number, verse: number): Highlight[] {
    return userStore.getHighlightsForVerse(book, chapter, verse)
  }

  function hasHighlights(book: string, chapter: number, verse: number): boolean {
    return getHighlightsForVerse(book, chapter, verse).length > 0
  }

  return {
    // State
    isHighlighting,
    highlightElements,

    // Computed
    availableColors,

    // Methods
    getColorByHex,
    getColorClassName,
    addHighlight,
    removeHighlight,
    applyHighlightToElement,
    removeHighlightElement,
    clearAllHighlights,
    getHighlightsForVerse,
    hasHighlights
  }
}
