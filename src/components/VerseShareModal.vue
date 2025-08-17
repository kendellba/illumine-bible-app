<template>
  <div v-if="isOpen" class="share-modal-overlay" @click.self="$emit('close')">
    <div class="share-modal">
      <div class="modal-header">
        <h3 class="modal-title">Share Verse</h3>
        <button @click="$emit('close')" class="close-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="modal-content">
        <!-- Verse Display -->
        <div class="verse-preview">
          <div class="verse-text">"{{ verseText }}"</div>
          <div class="verse-attribution">— {{ verseReference }} ({{ bibleVersionId }})</div>
        </div>

        <!-- Share Options Tabs -->
        <div class="share-tabs">
          <button
            @click="activeTab = 'text'"
            class="tab-btn"
            :class="{ active: activeTab === 'text' }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
            </svg>
            Text
          </button>
          <button
            @click="activeTab = 'image'"
            class="tab-btn"
            :class="{ active: activeTab === 'image' }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Image
          </button>
        </div>

        <!-- Text Share Options -->
        <div v-if="activeTab === 'text'" class="share-content">
          <div class="options-section">
            <h4 class="options-title">Text Options</h4>
            <div class="option-group">
              <label class="option-item">
                <input
                  v-model="textOptions.includeReference"
                  type="checkbox"
                  class="option-checkbox"
                />
                <span>Include reference</span>
              </label>
              <label class="option-item">
                <input
                  v-model="textOptions.includeVersion"
                  type="checkbox"
                  class="option-checkbox"
                />
                <span>Include Bible version</span>
              </label>
            </div>
          </div>

          <div class="preview-section">
            <h4 class="preview-title">Preview</h4>
            <div class="text-preview">
              {{ generateTextPreview() }}
            </div>
          </div>

          <div class="action-buttons">
            <button @click="shareAsText" :disabled="isSharing" class="share-btn primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
              <span v-if="isSharing">Sharing...</span>
              <span v-else>Share Text</span>
            </button>
            <button @click="copyToClipboard" class="share-btn secondary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Copy
            </button>
          </div>
        </div>

        <!-- Image Share Options -->
        <div v-if="activeTab === 'image'" class="share-content">
          <div class="options-section">
            <h4 class="options-title">Image Options</h4>

            <!-- Template Selection -->
            <div class="option-group">
              <label class="option-label">Template</label>
              <div class="template-grid">
                <button
                  v-for="template in templates"
                  :key="template.id"
                  @click="imageOptions.template = template.id"
                  class="template-btn"
                  :class="{ active: imageOptions.template === template.id }"
                >
                  <div class="template-preview" :style="template.style">
                    <div class="template-text">Aa</div>
                  </div>
                  <span class="template-name">{{ template.name }}</span>
                </button>
              </div>
            </div>

            <!-- Color Options -->
            <div class="option-group">
              <label class="option-label">Colors</label>
              <div class="color-options">
                <div class="color-row">
                  <label class="color-label">Background</label>
                  <div class="color-picker-container">
                    <input
                      v-model="imageOptions.backgroundColor"
                      type="color"
                      class="color-picker"
                    />
                    <span class="color-value">{{ imageOptions.backgroundColor }}</span>
                  </div>
                </div>
                <div class="color-row">
                  <label class="color-label">Text</label>
                  <div class="color-picker-container">
                    <input
                      v-model="imageOptions.textColor"
                      type="color"
                      class="color-picker"
                    />
                    <span class="color-value">{{ imageOptions.textColor }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Font Options -->
            <div class="option-group">
              <label class="option-label">Font</label>
              <select v-model="imageOptions.fontFamily" class="font-select">
                <option value="Inter, sans-serif">Inter (Sans Serif)</option>
                <option value="Georgia, serif">Georgia (Serif)</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Helvetica Neue', sans-serif">Helvetica</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
              </select>
            </div>

            <!-- Include Options -->
            <div class="option-group">
              <label class="option-item">
                <input
                  v-model="imageOptions.includeReference"
                  type="checkbox"
                  class="option-checkbox"
                />
                <span>Include reference</span>
              </label>
              <label class="option-item">
                <input
                  v-model="imageOptions.includeVersion"
                  type="checkbox"
                  class="option-checkbox"
                />
                <span>Include Bible version</span>
              </label>
            </div>
          </div>

          <!-- Image Preview -->
          <div class="preview-section">
            <h4 class="preview-title">Preview</h4>
            <div class="image-preview" :style="getPreviewStyle()">
              <div class="preview-verse">"{{ verseText }}"</div>
              <div v-if="imageOptions.includeReference" class="preview-reference">
                — {{ verseReference }}{{ imageOptions.includeVersion ? ` (${bibleVersionId})` : '' }}
              </div>
              <div class="preview-branding">Illumine Bible App</div>
            </div>
          </div>

          <div class="action-buttons">
            <button @click="shareAsImage" :disabled="isSharing" class="share-btn primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
              <span v-if="isSharing">Creating...</span>
              <span v-else>Share Image</span>
            </button>
            <button @click="downloadImage" class="share-btn secondary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { verseSharingService } from '@/services/verseSharingService'
import { useToast } from '@/composables/useToast'

interface Props {
  isOpen: boolean
  verseId: string
  verseText: string
  verseReference: string
  bibleVersionId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'shared', type: 'text' | 'image'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { showToast } = useToast()

// State
const activeTab = ref<'text' | 'image'>('text')
const isSharing = ref(false)

const textOptions = ref({
  includeReference: true,
  includeVersion: true
})

const imageOptions = ref({
  template: 'elegant' as const,
  backgroundColor: '#2563eb',
  textColor: '#ffffff',
  fontFamily: 'Inter, sans-serif',
  fontSize: 24,
  includeReference: true,
  includeVersion: true
})

// Template definitions
const templates = [
  {
    id: 'minimal',
    name: 'Minimal',
    style: {
      backgroundColor: '#ffffff',
      color: '#000000',
      border: '1px solid #e5e7eb'
    }
  },
  {
    id: 'elegant',
    name: 'Elegant',
    style: {
      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      color: '#ffffff'
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    style: {
      backgroundColor: '#111827',
      color: '#f9fafb'
    }
  },
  {
    id: 'classic',
    name: 'Classic',
    style: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '2px solid #d1d5db'
    }
  }
]

// Computed
const getPreviewStyle = computed(() => {
  return () => ({
    backgroundColor: imageOptions.value.backgroundColor,
    color: imageOptions.value.textColor,
    fontFamily: imageOptions.value.fontFamily
  })
})

// Methods
function generateTextPreview(): string {
  let text = `"${props.verseText}"`

  if (textOptions.value.includeReference) {
    text += `\n\n— ${props.verseReference}`
  }

  if (textOptions.value.includeVersion) {
    text += ` (${props.bibleVersionId})`
  }

  return text
}

async function shareAsText() {
  isSharing.value = true

  try {
    const result = await verseSharingService.shareAsText(
      props.verseId,
      props.verseText,
      props.verseReference,
      props.bibleVersionId,
      textOptions.value
    )

    if (result.success) {
      showToast('Verse shared successfully!', 'success')
      emit('shared', 'text')
      emit('close')
    } else {
      showToast(result.error || 'Failed to share verse', 'error')
    }
  } catch (error) {
    showToast('Failed to share verse', 'error')
  } finally {
    isSharing.value = false
  }
}

async function shareAsImage() {
  isSharing.value = true

  try {
    const result = await verseSharingService.shareAsImage(
      props.verseId,
      props.verseText,
      props.verseReference,
      props.bibleVersionId,
      imageOptions.value
    )

    if (result.success) {
      showToast('Verse image shared successfully!', 'success')
      emit('shared', 'image')
      emit('close')
    } else {
      showToast(result.error || 'Failed to create verse image', 'error')
    }
  } catch (error) {
    showToast('Failed to create verse image', 'error')
  } finally {
    isSharing.value = false
  }
}

async function copyToClipboard() {
  try {
    const text = generateTextPreview()
    await navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!', 'success')
  } catch (error) {
    showToast('Failed to copy to clipboard', 'error')
  }
}

async function downloadImage() {
  isSharing.value = true

  try {
    const result = await verseSharingService.shareAsImage(
      props.verseId,
      props.verseText,
      props.verseReference,
      props.bibleVersionId,
      imageOptions.value
    )

    if (result.success && result.blob) {
      // The service will handle the download
      showToast('Image downloaded!', 'success')
    } else {
      showToast(result.error || 'Failed to download image', 'error')
    }
  } catch (error) {
    showToast('Failed to download image', 'error')
  } finally {
    isSharing.value = false
  }
}
</script>

<style scoped>
.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.share-modal {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
  margin-bottom: 1rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.modal-content {
  padding: 0 1.5rem 1.5rem;
}

.verse-preview {
  text-align: center;
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.verse-text {
  font-size: 1.125rem;
  line-height: 1.6;
  color: #111827;
  font-style: italic;
  margin-bottom: 1rem;
}

.verse-attribution {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.share-tabs {
  display: flex;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  padding: 0.25rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background-color: white;
  color: #2563eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.share-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.options-title,
.preview-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem 0;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.option-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #2563eb;
}

.option-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
}

.template-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: none;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn.active {
  border-color: #2563eb;
}

.template-preview {
  width: 60px;
  height: 40px;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.template-name {
  font-size: 0.75rem;
  color: #6b7280;
}

.color-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.color-label {
  font-size: 0.875rem;
  color: #374151;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-picker {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.color-value {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.font-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.text-preview {
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  white-space: pre-line;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
}

.image-preview {
  aspect-ratio: 1;
  padding: 2rem;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 1rem;
  position: relative;
  overflow: hidden;
}

.preview-verse {
  font-size: 1.125rem;
  line-height: 1.5;
  font-style: italic;
}

.preview-reference {
  font-size: 0.875rem;
  opacity: 0.9;
}

.preview-branding {
  position: absolute;
  bottom: 1rem;
  font-size: 0.75rem;
  opacity: 0.6;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.share-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.share-btn.primary {
  background-color: #2563eb;
  color: white;
}

.share-btn.primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.share-btn.secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.share-btn.secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

@media (max-width: 640px) {
  .share-modal {
    margin: 0.5rem;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem 1rem 0;
  }

  .modal-content {
    padding: 0 1rem 1rem;
  }

  .template-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-buttons {
    flex-direction: column;
  }

  .color-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
}
</style>
