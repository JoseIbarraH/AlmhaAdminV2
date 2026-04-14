<script setup lang="ts">
import { ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = withDefaults(defineProps<{
  modelValue: boolean
  src: string | null
  aspectRatio?: number
  title?: string
  cancelText?: string
  saveText?: string
}>(), {
  title: 'Recortar Imagen',
  cancelText: 'Cancelar',
  saveText: 'Recortar y Guardar'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'cancel'): void
  (e: 'crop', payload: { file: File; previewUrl: string }): void
}>()

const cropperRef = ref<any>(null)

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const handleCrop = () => {
  if (cropperRef.value) {
    const { canvas } = cropperRef.value.getResult()
    if (canvas) {
      const previewUrl = canvas.toDataURL('image/jpeg', 0.9)
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const file = new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' })
          emit('crop', { file, previewUrl })
          emit('update:modelValue', false)
        }
      }, 'image/jpeg', 0.9)
    }
  } else {
    handleCancel()
  }
}
</script>

<template>
  <UModal :open="modelValue" @update:open="emit('update:modelValue', $event)" prevent-close :title="title" description="Ajustar imagen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="handleCancel" />
          </div>
        </template>
      
      <div class="cropper-container" style="height: 400px; background: #000; border-radius: 8px; overflow: hidden;">
        <Cropper
          ref="cropperRef"
          class="cropper"
          :src="src || ''"
          :stencil-props="{
            aspectRatio: aspectRatio
          }"
          style="height: 100%; width: 100%;"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="handleCancel">
            {{ cancelText }}
          </UButton>
          <UButton color="primary" @click="handleCrop">
            {{ saveText }}
          </UButton>
        </div>
      </template>
    </UCard>
    </template>
  </UModal>
</template>
