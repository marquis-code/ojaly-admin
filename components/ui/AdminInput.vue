<script setup lang="ts">
import { useId, useSlots } from 'vue';
withDefaults(defineProps<{ modelValue?: string | number | null; label?: string; type?: string; placeholder?: string; hint?: string; error?: string; disabled?: boolean; min?: string | number; max?: string | number }>(), { type: 'text' });
const emit = defineEmits<{ 'update:modelValue': [string] }>();
const id = useId();
const slots = useSlots();
</script>

<template>
  <div><label v-if="label" :for="id" class="label-base">{{ label }}</label><div class="relative"><input :id="id" :value="modelValue ?? ''" :type="type" :placeholder="placeholder" :disabled="disabled" :min="min" :max="max" class="input-base" :class="[error ? 'border-danger' : '', slots.suffix ? '!pr-11' : '']" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"><slot name="suffix" /></div><p v-if="error" class="mt-1 text-[10px] text-danger">{{ error }}</p><p v-else-if="hint" class="mt-1 text-[10px] text-muted">{{ hint }}</p></div>
</template>
