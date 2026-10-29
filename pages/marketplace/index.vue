<script setup lang="ts">
import { RefreshCw, ShieldCheck, ShieldX } from 'lucide-vue-next';
import { formatNaira } from '~/utils/format';
useSeoMeta({ title: 'Marketplace' });
const toast = useAdminToast();
const { dashboard, businesses, loading, campus, load, verify } = useAdminMarketplace();
async function toggle(id: string, current: boolean) {
  try { await verify(id, !current); toast.success(current ? 'Business unverified.' : 'Business verified.'); }
  catch (error) { toast.error((error as Error).message); }
}
watch(campus, load);
onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <PageHeading title="Marketplace" subtitle="GMV, commission and verified supply across Lagos — campus and non-campus." eyebrow="Demand">
      <template #actions><AdminButton variant="outline" :loading="loading" @click="load"><RefreshCw class="h-3.5 w-3.5" /> Refresh</AdminButton></template>
    </PageHeading>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStat label="Marketplace GMV" :value="formatNaira(dashboard?.totals.gmvKobo || 0)" tone="acid" :hint="`${dashboard?.totals.bookings || 0} bookings`" />
      <AdminStat label="Commission" :value="formatNaira(dashboard?.totals.commissionKobo || 0)" :hint="`${dashboard?.totals.verified || 0} verified businesses`" />
      <AdminStat label="Verified supply" :value="String(dashboard?.totals.verified || 0)" :hint="`${dashboard?.totals.businesses || 0} campus businesses`" />
      <AdminStat label="Repeat customers" :value="String(dashboard?.campuses.reduce((s, c) => s + c.repeatCustomers, 0) || 0)" :hint="'unique marketplace customers'" />
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <div v-for="entry in dashboard?.campuses || []" :key="entry.code" class="rounded-2xl border border-line bg-surface p-4">
        <div class="flex items-center justify-between"><p class="text-xs font-bold">{{ entry.shortName }}</p><AdminBadge variant="neutral">{{ entry.city }}</AdminBadge></div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-center"><div class="rounded-lg bg-raised/60 p-2"><p class="font-display text-lg font-bold">{{ entry.bookings }}</p><p class="text-[8px] uppercase text-muted">Bookings</p></div><div class="rounded-lg bg-raised/60 p-2"><p class="font-display text-lg font-bold">{{ formatNaira(entry.gmvKobo) }}</p><p class="text-[8px] uppercase text-muted">GMV</p></div><div class="rounded-lg bg-raised/60 p-2"><p class="font-display text-lg font-bold text-acid">{{ formatNaira(entry.commissionKobo) }}</p><p class="text-[8px] uppercase text-muted">Fee</p></div></div>
        <p class="mt-2 text-[10px] text-muted">{{ entry.verified }}/{{ entry.businesses }} verified · {{ entry.activated }} activated</p>
      </div>
    </div>
    <div class="rounded-2xl border border-line bg-surface">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4"><p class="text-xs font-bold">Marketplace businesses</p><AdminSelect v-model="campus" :options="[{ value: '', label: 'All campuses' }, { value: 'UNILAG', label: 'UNILAG' }, { value: 'CMUL', label: 'CMUL' }]" class="!w-40" /></div>
      <div class="divide-y divide-line"><div v-for="business in businesses" :key="business.id" class="flex flex-wrap items-center gap-3 px-4 py-3"><div class="min-w-0 flex-1"><p class="text-xs font-bold">{{ business.name }}</p><p class="text-[10px] text-muted">/s/{{ business.slug }} · {{ business.campusCode }} · {{ business.firstSaleAt ? 'activated' : 'no sale yet' }}</p></div><AdminBadge :variant="business.verified ? 'success' : 'warning'">{{ business.verified ? 'Verified' : 'Pending' }}</AdminBadge><AdminButton size="sm" :variant="business.verified ? 'outline' : 'primary'" @click="toggle(business.id, business.verified)"><ShieldX v-if="business.verified" class="h-3 w-3" /><ShieldCheck v-else class="h-3 w-3" /> {{ business.verified ? 'Unverify' : 'Verify' }}</AdminButton></div><p v-if="!businesses.length" class="p-4 text-[10px] text-muted">No campus businesses yet. Businesses need a campus code at signup.</p></div>
    </div>
  </div>
</template>
