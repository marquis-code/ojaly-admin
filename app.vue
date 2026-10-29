<script setup lang="ts">
useHead({ titleTemplate: (title) => title ? `${title} · Ojaly Ops` : 'Ojaly Control Room' });
</script>

<template>
  <div><NuxtLoadingIndicator color="#FF5A1F" :height="2" /><NuxtLayout><NuxtPage /></NuxtLayout><AdminToast v-if="false" /></div>
</template>
