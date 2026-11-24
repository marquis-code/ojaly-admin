<script setup lang="ts">
import { Building2, Percent, RefreshCw } from 'lucide-vue-next';
import { adminApi } from '~/api/adminApi';
import type { AdminBusiness } from '~/types';
import { formatNaira } from '~/utils/format';
useSeoMeta({ title: 'Service charges' });
const toast = useAdminToast();
const items = ref<AdminBusiness[]>([]);
const loading = ref(false);
const saving = ref(false);
const search = ref('');
const open = ref(false);
const selected = ref<AdminBusiness | null>(null);
const form = reactive({ enabled: false, type: 'percent' as 'percent' | 'fixed', percent: 0, fixed: '' });
async function load() {
  loading.value = true;
  try { const result = await adminApi.businesses({ page: 1, limit: 100, search: search.value.trim() || undefined }); items.value = result.items; }
  catch (error) { toast.error((error as Error).message); }
  finally { loading.value = false; }
}
function configure(business: AdminBusiness) {
  selected.value = business;
  form.enabled = Boolean(business.serviceChargeEnabled);
  form.type = business.serviceChargeType || 'percent';
  form.percent = Number(business.serviceChargePercent || 0);
  form.fixed = business.serviceChargeFixedKobo ? String(business.serviceChargeFixedKobo / 100) : '';
  open.value = true;
}
async function save() {
  if (!selected.value) return;
  saving.value = true;
  try {
    await adminApi.updateServiceCharge(selected.value.id, { enabled: form.enabled, type: form.type, percent: Number(form.percent) || 0, fixedKobo: Math.round(Number(form.fixed.replace(/[^0-9.]/g, '')) * 100) || 0 });
    toast.success('Service charge updated.');
    open.value = false; await load();
  } catch (error) { toast.error((error as Error).message); }
  finally { saving.value = false; }
}
function summary(business: AdminBusiness) {
  if (!business.serviceChargeEnabled) return 'Not enabled';
  return business.serviceChargeType === 'fixed' ? `${formatNaira(business.serviceChargeFixedKobo || 0)} / booking` : `${business.serviceChargePercent || 0}%`;
}
watch(search, () => { const t = setTimeout(load, 300); return () => clearTimeout(t); });
onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <PageHeading title="Service charges" subtitle="Choose which businesses add a customer-facing service charge at booking checkout." eyebrow="Revenue">
      <template #actions><AdminButton variant="outline" :loading="loading" @click="load"><RefreshCw class="h-3.5 w-3.5" /> Refresh</AdminButton></template>
    </PageHeading>
    <div class="grid gap-3 sm:grid-cols-3"><div class="card p-4"><p class="text-[9px] font-bold uppercase tracking-wider text-muted">Businesses</p><p class="mt-1 text-2xl font-bold">{{ items.length }}</p></div><div class="card p-4"><p class="text-[9px] font-bold uppercase tracking-wider text-muted">Charge enabled</p><p class="mt-1 text-2xl font-bold text-acid">{{ items.filter(b => b.serviceChargeEnabled).length }}</p></div><div class="card p-4"><p class="text-[9px] font-bold uppercase tracking-wider text-muted">Default</p><p class="mt-1 text-sm font-bold">Per business</p><p class="text-[10px] text-muted">Percentage or fixed amount</p></div></div>
    <div class="relative"><Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" /><input v-model="search" type="search" placeholder="Search business, slug or email…" class="input-base pl-9"></div>
    <AdminTable :loading="loading && !items.length">
      <template #head><tr><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Business</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Charge</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Status</th><th class="px-4 py-2.5"></th></tr></template>
      <template #body>
        <tr v-for="business in items" :key="business.id" class="border-b border-line last:border-0 hover:bg-raised/30">
          <td class="px-4 py-3"><p class="text-xs font-bold">{{ business.name }}</p><p class="text-[10px] text-muted">/s/{{ business.slug }} · {{ business.category }}</p></td>
          <td class="px-4 py-3"><p class="text-[11px] font-bold">{{ summary(business) }}</p><p class="text-[9px] text-muted">{{ business.serviceChargeEnabled ? (business.serviceChargeType === 'fixed' ? 'Fixed per booking' : 'Added to service subtotal') : 'Customers pay the service price only' }}</p></td>
          <td class="px-4 py-3"><AdminBadge :variant="business.serviceChargeEnabled ? 'success' : 'neutral'">{{ business.serviceChargeEnabled ? 'Enabled' : 'Disabled' }}</AdminBadge></td>
          <td class="px-4 py-3 text-right"><AdminButton size="sm" variant="outline" @click="configure(business)"><Percent class="h-3.5 w-3.5" /> Configure</AdminButton></td>
        </tr>
        <tr v-if="!items.length && !loading"><td colspan="4"><AdminEmpty title="No businesses found" message="Try a different search."><template #icon><Building2 class="h-6 w-6" /></template></AdminEmpty></td></tr>
      </template>
    </AdminTable>

    <AdminModal v-model:open="open" title="Customer service charge" description="Collected from the customer on top of the service subtotal. Existing bookings keep the charge that applied when they were booked.">
      <div v-if="selected" class="space-y-4">
        <p class="rounded-lg bg-raised p-3 text-xs font-bold">{{ selected.name }}</p>
        <label class="flex items-center gap-2 text-xs font-semibold"><input v-model="form.enabled" type="checkbox" class="rounded"> Enable service charge for this business</label>
        <AdminSelect v-model="form.type" label="Charge type" :options="[{ value: 'percent', label: 'Percentage of service subtotal' }, { value: 'fixed', label: 'Fixed amount per booking' }]" :disabled="!form.enabled" />
        <AdminInput v-if="form.type === 'percent'" v-model.number="form.percent" label="Percentage" type="number" min="0" max="100" hint="Example: 5 adds 5% to the service price." :disabled="!form.enabled" />
        <AdminInput v-else v-model="form.fixed" label="Fixed amount (₦)" inputmode="decimal" hint="Example: 500 adds ₦500 per booking." :disabled="!form.enabled" />
        <div class="rounded-lg border border-line bg-raised/50 p-3 text-[11px]"><p class="font-semibold">Customer preview</p><p class="mt-1 text-muted">{{ !form.enabled ? 'Disabled — customers pay the service price only.' : form.type === 'percent' ? `${form.percent || 0}% added to the service subtotal.` : `${formatNaira((Number(form.fixed.replace(/[^0-9.]/g, '')) || 0) * 100)} added per booking.` }}</p><p class="mt-1 text-muted">A ₦20,000 service becomes {{ formatNaira(2000000 + (form.type === 'percent' ? Math.round(2000000 * (Number(form.percent) || 0) / 100) : Math.round((Number(form.fixed.replace(/[^0-9.]/g, '')) || 0) * 100))) }}.</p></div>
      </div>
      <template #footer><div class="flex justify-end gap-2"><AdminButton variant="ghost" @click="open = false">Cancel</AdminButton><AdminButton :loading="saving" @click="save">Save service charge</AdminButton></div></template>
    </AdminModal>
  </div>
</template>
