import { ref, computed } from 'vue'

export interface TextSelection {
  text: string
  startOffset: number
  endOffset: number
  range: Range | null
}

export interface SelectionPosition {
  x: number
  y: number
  width: number
  height: number
}

export function useTextSelection() {
  // State
  const currentSelection = ref<TextSelection | null>(null)
  const selectionPosition = ref<SelectionPosition | null>(null)
  const isSelecting = ref(false)

  // Computed
  const hasSelection = computed(() => currentSelection.value !== null)
  const selectedText = computed(() => currentSelection.value?.text || '')

  // Methods
  function getTextSelection(): TextSelection | null {
    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) {
      return null
    }

    const range = selection.getRangeAt(0)
    const text = selection.toString().trim()

    if (!text) {
      return null
    }

    return {
      text,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      range: range.cloneRange()
    }
  }

  function getSelectionPosition(range: Range): SelectionPosition {
    const rect = range.getBoundingClientRect()

    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    }
  }

  function handleTextSelection(event: Event) {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = getTextSelection()

      if (selection && selection.text.length > 0) {
        currentSelection.value = selection
        selectionPosition.value = getSelectionPosition(selection.range!)
        isSelecting.value = true
      } else {
        clearSelection()
      }
    }, 10)
  }

  function clearSelection() {
    currentSelection.value = null
    selectionPosition.value = null
    isSelecting.value = false

    // Clear browser selection
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }
  }

  function selectText(element: HTMLElement, startOffset: number, endOffset: number) {
    const range = document.createRange()
    const textNode = getTextNode(element)

    if (!textNode) return false

    try {
      range.setStart(textNode, startOffset)
      range.setEnd(textNode, endOffset)

      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)

        currentSelection.value = {
          text: range.toString(),
          startOffset,
          endOffset,
          range: range.cloneRange()
        }

        selectionPosition.value = getSelectionPosition(range)
        return true
      }
    } catch (error) {
      console.error('Failed to select text:', error)
    }

    return false
  }

  function getTextNode(element: HTMLElement): Text | null {
    // Find the first text node in the element
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    )

    return walker.nextNode() as Text | null
  }

  function highlightRange(range: Range, className: string): HTMLElement {
    const span = document.createElement('span')
    span.className = className

    try {
      range.surroundContents(span)
      return span
    } catch (error) {
      // If surroundContents fails, extract and wrap the content
      const contents = range.extractContents()
      span.appendChild(contents)
      range.insertNode(span)
      return span
    }
  }

  function removeHighlight(highlightElement: HTMLElement) {
    const parent = highlightElement.parentNode
    if (parent) {
      // Move all child nodes to parent and remove the highlight element
      while (highlightElement.firstChild) {
        parent.insertBefore(highlightElement.firstChild, highlightElement)
      }
      parent.removeChild(highlightElement)

      // Normalize the parent to merge adjacent text nodes
      parent.normalize()
    }
  }

  function isWithinElement(element: HTMLElement): boolean {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return false

    const range = selection.getRangeAt(0)
    return element.contains(range.commonAncestorContainer)
  }

  return {
    // State
    currentSelection,
    selectionPosition,
    isSelecting,

    // Computed
    hasSelection,
    selectedText,

    // Methods
    getTextSelection,
    getSelectionPosition,
    handleTextSelection,
    clearSelection,
    selectText,
    highlightRange,
    removeHighlight,
    isWithinElement
  }
}
