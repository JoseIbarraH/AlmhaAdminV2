<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Node, mergeAttributes, Extension } from '@tiptap/core'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

const { locale } = useI18n({ useScope: 'global' })

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Escribe el contenido aquí...'
  },
  blogId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

// Custom Video Extension
const Video = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { width: '100%', height: 'auto', class: 'rounded-xl shadow-md' })]
  },
})

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: { chain: any }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: { chain: any }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    } as any;
  },
})

// Media Deletion Logic
const pendingDeletions = ref<Set<string>>(new Set())
const previousUrls = ref<string[]>([])

const extractMediaUrls = (html: string): string[] => {
  const urls: string[] = []
  const imgRegex = /<img[^>]+src="([^">]+)"/g
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1]) urls.push(match[1])
  }
  const videoRegex = /<video[^>]+src="([^">]+)"/g
  while ((match = videoRegex.exec(html)) !== null) {
    if (match[1]) urls.push(match[1])
  }
  return urls
}

const handleMediaDeletion = (currentHtml: string) => {
  if (!props.blogId) return

  const currentUrls = extractMediaUrls(currentHtml)
  const removedUrls = previousUrls.value.filter(url => !currentUrls.includes(url))
  removedUrls.forEach(url => pendingDeletions.value.add(url))

  const restoredUrls = currentUrls.filter(url => pendingDeletions.value.has(url))
  restoredUrls.forEach(url => pendingDeletions.value.delete(url))

  previousUrls.value = currentUrls
}

const commitDeletions = async () => {
  if (!props.blogId || pendingDeletions.value.size === 0) return

  const urlsToDelete = Array.from(pendingDeletions.value)
  for (const url of urlsToDelete) {
    try {
      await useApi(`/blogs/${props.blogId}/media`, {
        method: 'DELETE',
        params: { url }
      })
    } catch (error) {
      console.error('Error committing deletion from S3:', error)
    }
  }
  pendingDeletions.value.clear()
}

defineExpose({ commitDeletions })

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
    }),
    Image.configure({
      inline: true,
      HTMLAttributes: {
        class: 'max-w-full rounded-xl shadow-md my-4',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Video,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TextStyle,
    Color,
    FontSize
  ],
  onCreate: ({ editor }) => {
    previousUrls.value = extractMediaUrls(editor.getHTML())
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    handleMediaDeletion(html)
  },
})

watch(() => props.modelValue, (value) => {
  if (editor.value && editor.value.getHTML() !== value) {
    editor.value.commands.setContent(value, { emitUpdate: false })
    previousUrls.value = extractMediaUrls(value)
  }
})

const isColorPopoverOpen = ref(false)
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  isUploading.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await useApi<{ success: boolean, url: string }>(`/blogs/${props.blogId}/media`, {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      if (file.type.startsWith('image/')) {
        editor.value?.chain().focus().setImage({ src: response.url }).run()
      } else if (file.type.startsWith('video/')) {
        editor.value?.chain().focus().insertContent({
          type: 'video',
          attrs: { src: response.url }
        }).run()
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
  } finally {
    isUploading.value = false
    ;(event.target as HTMLInputElement).value = ''
  }
}

const addImageByUrl = () => {
  const url = window.prompt(locale.value === 'es' ? 'Introduce la URL de la imagen:' : 'Enter image URL:')
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run()
  }
}

const addVideoByUrl = () => {
  const url = window.prompt(locale.value === 'es' ? 'Introduce la URL del video:' : 'Enter video URL:')
  if (url) {
    editor.value?.chain().focus().insertContent({
      type: 'video',
      attrs: { src: url }
    }).run()
  }
}

const fontSizes = [
  { label: '8px', value: '8px' },
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '30px', value: '30px' },
  { label: '36px', value: '36px' },
  { label: '48px', value: '48px' },
  { label: '60px', value: '60px' },
  { label: '72px', value: '72px' },
]

const colors = [
  '#000000', '#475569', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#a07c28'
]

const customHex = ref('#000000')

const applyCustomColor = () => {
  if (customHex.value && /^#[0-9A-F]{6}$/i.test(customHex.value)) {
    editor.value?.chain().focus().setColor(customHex.value).run()
  }
}

const tableItems = computed(() => [
  [
    { label: 'Insert Table', icon: 'i-heroicons-table-cells', onSelect: () => editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: 'Add Row After', icon: 'i-heroicons-plus-circle', onSelect: () => editor.value?.chain().focus().addRowAfter().run() },
    { label: 'Add Col After', icon: 'i-heroicons-plus-circle', onSelect: () => editor.value?.chain().focus().addColumnAfter().run() },
    { label: 'Delete Table', icon: 'i-heroicons-trash', onSelect: () => editor.value?.chain().focus().deleteTable().run() }
  ]
])

const fontSizesItems = computed(() => [
  fontSizes.map((size: { label: string, value: string }) => ({
    label: size.label,
    onSelect: () => (editor.value?.commands as any).setFontSize(size.value)
  }))
])

const mediaItems = computed(() => [
  [
    { label: 'Upload File', icon: 'i-heroicons-arrow-up-tray', onSelect: triggerFileUpload },
    { label: 'Insert Image URL', icon: 'i-heroicons-link', onSelect: addImageByUrl },
    { label: 'Insert Video URL', icon: 'i-heroicons-video-camera', onSelect: addVideoByUrl }
  ]
])
</script>

<template>
  <div class="rte-container">
    <div v-if="editor" class="rte-toolbar">
      <div class="toolbar-group">
        <button type="button" class="tool-btn" :class="{ 'is-active': editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()">
          <UIcon name="i-heroicons-bold" />
        </button>
        <button type="button" class="tool-btn" :class="{ 'is-active': editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()">
          <UIcon name="i-heroicons-italic" />
        </button>
        <button type="button" class="tool-btn" :class="{ 'is-active': editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()">
          <UIcon name="i-heroicons-underline" />
        </button>
        <button type="button" class="tool-btn" :class="{ 'is-active': editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()">
          <UIcon name="i-heroicons-strikethrough" />
        </button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="tool-btn" :class="{ 'is-active': editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">
          <UIcon name="i-heroicons-list-bullet" />
        </button>
        <button type="button" class="tool-btn" :class="{ 'is-active': editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">
          <UIcon name="i-heroicons-numbered-list" />
        </button>
      </div>

      <div class="toolbar-group">
        <UDropdownMenu :items="tableItems" :content="{ align: 'start' }">
          <button type="button" class="tool-btn" :class="{ 'is-active': editor.isActive('table') }">
            <UIcon name="i-heroicons-table-cells" />
          </button>
        </UDropdownMenu>
      </div>

      <div class="toolbar-group">
        <!-- Font Size -->
        <UDropdownMenu :items="fontSizesItems" :content="{ align: 'start' }">
          <button type="button" class="tool-btn size-btn" title="Tamaño de letra">
            <UIcon name="i-heroicons-chat-bubble-bottom-center-text" />
          </button>
        </UDropdownMenu>

        <!-- Color -->
        <UPopover v-model:open="isColorPopoverOpen" :dismissible="false" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
          <button type="button" class="tool-btn color-btn" :style="{ color: (editor.getAttributes('textStyle').color || '#64748b') }">
            <UIcon name="i-heroicons-swatch" />
          </button>

          <template #content>
            <div class="color-picker-content p-3" @click.stop>
              <div class="color-grid">
                <button 
                  v-for="color in colors" 
                  :key="color"
                  type="button"
                  class="color-option"
                  :style="{ backgroundColor: color }"
                  :title="color"
                  @click="editor.chain().focus().setColor(color).run()"
                />
              </div>
              
              <div class="custom-color-row mt-3 pt-3 border-t border-slate-200">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-slate-500 font-medium whitespace-nowrap">Selector:</span>
                  <input 
                    type="color" 
                    v-model="customHex" 
                    class="w-full h-8 rounded cursor-pointer border-none p-0 bg-transparent"
                    @input="applyCustomColor"
                    @click.stop
                  />
                </div>
                <div class="flex gap-2">
                  <UInput 
                    v-model="customHex" 
                    placeholder="#000000" 
                    size="xs"
                    class="flex-1"
                  />
                  <UButton 
                    label="Apply" 
                    size="xs" 
                    color="neutral" 
                    @click="applyCustomColor"
                  />
                </div>
              </div>

              <div class="mt-2 flex gap-1">
                <UButton 
                  label="Reset Color" 
                  variant="ghost" 
                  size="xs" 
                  class="flex-1"
                  icon="i-heroicons-x-mark"
                  @click="editor.chain().focus().unsetColor().run()"
                />
                <UButton 
                  label="Close" 
                  variant="ghost" 
                  size="xs" 
                  color="neutral"
                  @click="isColorPopoverOpen = false"
                />
              </div>
            </div>
          </template>
        </UPopover>
      </div>

      <div class="toolbar-group">
        <button type="button" class="tool-btn" :class="{ 'is-active': editor.isActive('link') }" @click="editor.chain().focus().toggleLink({ href: '' }).run()">
          <UIcon name="i-heroicons-link" />
        </button>
        
        <UTooltip :text="!blogId ? (locale === 'es' ? 'Guarda el blog primero para subir multimedia' : 'Save the blog first to upload media') : (locale === 'es' ? 'Multimedia' : 'Media')">
          <UDropdownMenu :items="mediaItems" :content="{ align: 'start' }" :disabled="!blogId || isUploading">
            <div class="tool-btn" :class="{ 'opacity-50 cursor-not-allowed': !blogId || isUploading, 'cursor-pointer': blogId && !isUploading }">
              <UIcon v-if="!isUploading" name="i-heroicons-photo" />
              <UIcon v-else name="i-heroicons-arrow-path" class="animate-spin" />
            </div>
          </UDropdownMenu>
        </UTooltip>
        
        <input 
          ref="fileInputRef"
          type="file" 
          class="hidden" 
          accept="image/*,video/*" 
          @change="handleFileUpload" 
        />
      </div>

      <div class="toolbar-group">
        <button type="button" class="tool-btn" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()">
          <UIcon name="i-heroicons-arrow-uturn-left" />
        </button>
        <button type="button" class="tool-btn" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()">
          <UIcon name="i-heroicons-arrow-uturn-right" />
        </button>
      </div>
    </div>

    <div class="editor-wrapper">
      <editor-content :editor="editor" class="prose prose-slate max-w-none min-h-[300px]" />
    </div>
  </div>
</template>

<style scoped>
.rte-container {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  transition: border-color 0.3s, background 0.3s;
}

.rte-container:focus-within {
  border-color: #a07c28;
  box-shadow: 0 0 0 1px #a07c28;
}

.rte-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.3s, border-color 0.3s;
}

.toolbar-group {
  display: flex;
  gap: 4px;
  padding-right: 8px;
  border-right: 1px solid #e2e8f0;
  transition: border-color 0.3s;
}

.toolbar-group:last-child {
  border-right: none;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.2s;
  background: transparent;
  border: none;
}

.tool-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
}

.tool-btn.is-active {
  background: #a07c281a;
  color: #a07c28;
}

.tool-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.editor-wrapper {
  padding: 16px;
}

/* Tiptap styles */
:deep(.tiptap) {
  outline: none;
  min-height: 200px;
}

:deep(.tiptap ul) {
  list-style-type: disc !important;
  padding-left: 1.5rem !important;
  margin: 1rem 0 !important;
}

:deep(.tiptap ol) {
  list-style-type: decimal !important;
  padding-left: 1.5rem !important;
  margin: 1rem 0 !important;
}

:deep(.tiptap li) {
  margin-bottom: 0.5rem;
}

:deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
}

:deep(.tiptap img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
}

:deep(.tiptap video) {
    max-width: 100%;
    border-radius: 8px;
}

/* Tables Styling */
:deep(.tiptap table) {
  border-collapse: collapse !important;
  table-layout: auto !important;
  width: 100% !important;
  margin: 2rem 0 !important;
  border: 1px solid #cbd5e1 !important;
}

:deep(.tiptap td), :deep(.tiptap th) {
  min-width: 2em !important;
  min-height: 2em !important;
  border: 1px solid #cbd5e1 !important;
  padding: 12px !important;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

:deep(.tiptap th) {
  font-weight: bold;
  text-align: left;
  background-color: #f8fafc !important;
}

:deep(.tiptap .selectedCell:after) {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(160, 124, 40, 0.1);
  pointer-events: none;
}

:deep(.tiptap .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: #a07c2888;
  pointer-events: none;
}

:deep(.tiptap .tableWrapper) {
  overflow-x: auto;
  margin: 2rem 0;
}

.color-btn {
  transition: color 0.2s;
}

.size-btn {
  font-weight: bold;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.color-option {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.1s;
}

.color-option:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Force light theme colors on the editor content to match its white background */
.editor-wrapper :deep(.prose) {
  --tw-prose-body: #334155 !important;
  --tw-prose-headings: #0f172a !important;
  --tw-prose-lead: #475569 !important;
  --tw-prose-links: #0f172a !important;
  --tw-prose-bold: #0f172a !important;
  --tw-prose-counters: #64748b !important;
  --tw-prose-bullets: #cbd5e1 !important;
  --tw-prose-hr: #e2e8f0 !important;
  --tw-prose-quotes: #0f172a !important;
  --tw-prose-quote-borders: #e2e8f0 !important;
  --tw-prose-captions: #64748b !important;
  --tw-prose-code: #0f172a !important;
  --tw-prose-pre-code: #e2e8f0 !important;
  --tw-prose-pre-bg: #1e293b !important;
  --tw-prose-th-borders: #cbd5e1 !important;
  --tw-prose-td-borders: #e2e8f0 !important;
  color: var(--tw-prose-body) !important;
}

.editor-wrapper :deep(.prose h1),
.editor-wrapper :deep(.prose h2),
.editor-wrapper :deep(.prose h3),
.editor-wrapper :deep(.prose h4),
.editor-wrapper :deep(.prose h5),
.editor-wrapper :deep(.prose h6),
.editor-wrapper :deep(.prose strong) {
  color: var(--tw-prose-headings) !important;
}

.editor-wrapper :deep(.prose a) {
  color: var(--tw-prose-links) !important;
}
</style>
