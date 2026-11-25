<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>

<template>
  <div
    class="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-3.5 transition select-none"
    :class="{ 'opacity-60 cursor-not-allowed': disabled, 'cursor-pointer hover:border-brand-500/40': !disabled }"
    @click="!disabled && emit('update:modelValue', !modelValue)"
  >
    <div class="flex-1 pr-2">
      <p v-if="label" class="text-xs font-bold text-ink">{{ label }}</p>
      <p v-if="description" class="mt-0.5 text-[11px] leading-relaxed text-muted">{{ description }}</p>
    </div>
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      :class="modelValue ? 'bg-brand-500' : 'bg-line dark:bg-raised'"
      @click.stop="!disabled && emit('update:modelValue', !modelValue)"
    >
      <span
        class="inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
        :class="modelValue ? 'translate-x-5' : 'translate-x-0.5'"
      />
    </button>
  </div>
</template>
