<script setup lang="ts">
import { useId, useSlots } from 'vue';
import { formatMoneyInput } from '~/utils/money';
const props = withDefaults(defineProps<{ modelValue?: string | number | null; label?: string; type?: string; placeholder?: string; hint?: string; error?: string; disabled?: boolean; min?: string | number; max?: string | number; money?: boolean }>(), { type: 'text', money: false });
const emit = defineEmits<{ 'update:modelValue': [string] }>();
const id = useId();
const slots = useSlots();
const isMoney = computed(() => props.money || Boolean(props.label?.includes('₦')));
const display = computed(() => isMoney.value ? formatMoneyInput(props.modelValue) : (props.modelValue ?? ''));
function input(event: Event) { const value = (event.target as HTMLInputElement).value; emit('update:modelValue', isMoney.value ? formatMoneyInput(value) : value); }
</script>

<template>
  <div><label v-if="label" :for="id" class="label-base">{{ label }}</label><div class="relative"><input :id="id" :value="display" :type="isMoney ? 'text' : type" :inputmode="isMoney ? 'decimal' : undefined" :placeholder="placeholder" :disabled="disabled" :min="min" :max="max" class="input-base" :class="[error ? 'border-danger' : '', slots.suffix ? '!pr-11' : '']" @input="input"><slot name="suffix" /></div><p v-if="error" class="mt-1 text-[10px] text-danger">{{ error }}</p><p v-else-if="hint" class="mt-1 text-[10px] text-muted">{{ hint }}</p></div>
</template>
