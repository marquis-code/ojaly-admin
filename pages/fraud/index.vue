<script setup lang="ts">
import { AlertTriangle, Ban, RefreshCw, ShieldCheck } from 'lucide-vue-next';
import { adminApi } from '~/api/adminApi';
useSeoMeta({ title: 'Fraud & risk' });
const toast = useAdminToast();
const stats = ref<Record<string, any> | null>(null);
const events = ref<Record<string, any>[]>([]);
const loading = ref(false);
async function load() {
  loading.value = true;
  try { const [s, e] = await Promise.all([adminApi.fraudStats(), adminApi.fraudEvents(150)]); stats.value = s; events.value = e; }
  catch (error) { toast.error((error as Error).message); }
  finally { loading.value = false; }
}
function pct(value: number) { return `${Math.round(value)}`; }
onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <PageHeading title="Fraud & risk" subtitle="Velocity, duplicate bookings and payment-risk signals across the network." eyebrow="Trust">
      <template #actions><AdminButton variant="outline" :loading="loading" @click="load"><RefreshCw class="h-3.5 w-3.5" /> Refresh</AdminButton></template>
    </PageHeading>
    <div class="grid gap-3 sm:grid-cols-3"><div class="card p-4"><p class="text-[10px] uppercase tracking-wider text-muted">Signals · 7 days</p><p class="mt-1 font-display text-2xl font-bold">{{ stats?.total || 0 }}</p></div><div class="card p-4"><p class="text-[10px] uppercase tracking-wider text-muted">Needs review</p><p class="mt-1 font-display text-2xl font-bold text-warning">{{ stats?.review || 0 }}</p></div><div class="card p-4"><p class="text-[10px] uppercase tracking-wider text-muted">Blocked</p><p class="mt-1 font-display text-2xl font-bold text-danger">{{ stats?.blocked || 0 }}</p></div></div>
    <div class="card overflow-hidden"><div class="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4"><div><p class="text-xs font-bold">Recent risk events</p><p class="mt-0.5 text-[10px] text-muted">High-risk bookings are blocked before they reach a provider.</p></div><div class="flex items-center gap-1.5 text-[10px] text-muted"><ShieldCheck class="h-3.5 w-3.5 text-success" /> Automated checks</div></div>
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 5" :key="i" class="skeleton h-10 rounded-lg" /></div>
      <div v-else-if="events.length" class="divide-y divide-line"><div v-for="event in events" :key="event._id" class="flex flex-wrap items-center gap-3 px-4 py-3 text-[11px]"><div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="event.action === 'block' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'"><Ban v-if="event.action === 'block'" class="h-4 w-4" /><AlertTriangle v-else class="h-4 w-4" /></div><div class="min-w-0 flex-1"><p class="font-semibold">{{ event.reference }} <span class="ml-1 rounded bg-raised px-1.5 py-0.5 text-[9px] font-mono">{{ event.kind }}</span></p><p class="mt-0.5 truncate text-[10px] text-muted">{{ (event.flags || []).join(' · ') || 'Velocity signal' }}</p></div><div class="text-right"><p class="font-bold" :class="event.action === 'block' ? 'text-danger' : 'text-warning'">{{ event.score }} / 100</p><p class="text-[9px] uppercase tracking-wider text-muted">{{ event.action }}</p></div></div></div>
      <div v-else class="p-8 text-center"><ShieldCheck class="mx-auto h-8 w-8 text-success" /><p class="mt-3 text-sm font-bold">No risk signals yet</p><p class="mt-1 text-xs text-muted">Duplicate slots and unusual velocity will appear here.</p></div>
    </div>
    <div class="card p-5"><p class="text-xs font-bold">What is checked</p><div class="mt-3 grid gap-2 text-[11px] text-muted sm:grid-cols-2"><p>· Duplicate booking for the same service and time</p><p>· More than 6 bookings in one hour</p><p>· More than 20 bookings in 24 hours</p><p>· Disposable email domains</p><p>· High-value booking patterns</p><p>· Cross-business order velocity</p></div></div>
  </div>
</template>
