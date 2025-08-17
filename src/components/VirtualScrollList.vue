<script setup lang="ts" generic="T">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

interface Props {
  items: T[]
  itemHeight: number
  containerHeight?: number
  overscan?: number
  getItemKey: (item: T, index: number) => string | number
}

interface Emits {
  (e: 'scroll', scrollTop: number): void
  (e: 'visible-range-change', startIndex: number, endIndex: number): void
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 400,
  overscan: 5
})

const emit = defineEmits<Emits>()

// Template refs
const containerRef = ref<HTMLElement>()
const scrollerRef = ref<HTMLElement>()

// Reactive state
const scrollTop = ref(0)
const containerSize = ref(props.containerHeight)

// Computed properties
const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleCount = computed(() => Math.ceil(containerSize.value / props.itemHeight))

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight)
  return Math.max(0, index - props.overscan)
})

const endIndex = computed(() => {
  const index = startIndex.value + visibleCount.value + props.overscan * 2
  return Math.min(props.items.length - 1, index)
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1).map((item, index) => ({
    item,
    index: startIndex.value + index,
    key: props.getItemKey(item, startIndex.value + index)
  }))
})

const offsetY = computed(() => startIndex.value * props.itemHeight)

// Methods
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  emit('scroll', scrollTop.value)
  emit('visible-range-change', startIndex.value, endIndex.value)
}

function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
  if (!scrollerRef.value) return

  const targetScrollTop = index * props.itemHeight
  scrollerRef.value.scrollTo({
    top: targetScrollTop,
    behavior
  })
}

function scrollToItem(item: T, behavior: ScrollBehavior = 'smooth') {
  const index = props.items.findIndex((i, idx) => props.getItemKey(i, idx) === props.getItemKey(item, 0))
  if (index !== -1) {
    scrollToIndex(index, behavior)
  }
}

function updateContainerSize() {
  if (containerRef.value) {
    containerSize.value = containerRef.value.clientHeight
  }
}

// Resize observer for responsive container sizing
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  updateContainerSize()

  // Set up resize observer
  if (containerRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerSize()
    })
    resizeObserver.observe(containerRef.value)
  }

  // Fallback resize listener
  window.addEventListener('resize', updateContainerSize)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener('resize', updateContainerSize)
})

// Watch for items changes and reset scroll if needed
watch(() => props.items.length, (newLength, oldLength) => {
  if (newLength !== oldLength && scrollTop.value > 0) {
    // Reset scroll to top when items change significantly
    if (scrollerRef.value) {
      scrollerRef.value.scrollTop = 0
      scrollTop.value = 0
    }
  }
})

// Expose methods for parent components
defineExpose({
  scrollToIndex,
  scrollToItem,
  getVisibleRange: () => ({ start: startIndex.value, end: endIndex.value })
})
</script>

<template>
  <div
    ref="containerRef"
    class="virtual-scroll-container relative overflow-hidden"
    :style="{ height: `${containerHeight}px` }"
  >
    <div
      ref="scrollerRef"
      class="virtual-scroll-scroller absolute inset-0 overflow-auto"
      @scroll="handleScroll"
    >
      <!-- Total height spacer -->
      <div
        class="virtual-scroll-spacer"
        :style="{ height: `${totalHeight}px` }"
      >
        <!-- Visible items container -->
        <div
          class="virtual-scroll-items"
          :style="{ transform: `translateY(${offsetY}px)` }"
        >
          <div
            v-for="{ item, index, key } in visibleItems"
            :key="key"
            class="virtual-scroll-item"
            :style="{ height: `${itemHeight}px` }"
            :data-index="index"
          >
            <slot
              :item="item"
              :index="index"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading indicator for empty state -->
    <div
      v-if="items.length === 0"
      class="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400"
    >
      <slot name="empty">
        <div class="text-center">
          <div class="animate-pulse">
            <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2"></div>
            <div class="text-sm">Loading...</div>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.virtual-scroll-container {
  contain: layout style paint;
}

.virtual-scroll-scroller {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.400') transparent;
}

.virtual-scroll-scroller::-webkit-scrollbar {
  width: 8px;
}

.virtual-scroll-scroller::-webkit-scrollbar-track {
  background: transparent;
}

.virtual-scroll-scroller::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.400');
  border-radius: 4px;
}

.virtual-scroll-scroller::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.500');
}

.virtual-scroll-items {
  will-change: transform;
}

.virtual-scroll-item {
  contain: layout style paint;
}

/* Smooth scrolling for better UX */
@media (prefers-reduced-motion: no-preference) {
  .virtual-scroll-scroller {
    scroll-behavior: smooth;
  }
}

/* Disable smooth scrolling for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .virtual-scroll-scroller {
    scroll-behavior: auto;
  }
}
</style>
