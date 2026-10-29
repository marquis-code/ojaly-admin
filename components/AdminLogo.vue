<script setup lang="ts">
withDefaults(defineProps<{ light?: boolean }>(), { light: false });
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <img :src="light ? '/brand/ojaly-logo-light.svg' : '/brand/ojaly-logo.svg'" alt="Ojaly" class="h-8 w-auto">
    <span class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]" :class="light ? 'bg-white/10 text-brand-300' : 'bg-brand-500/10 text-brand-600'">ops</span>
  </span>
</template>
