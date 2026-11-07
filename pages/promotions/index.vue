<script setup lang="ts">
import { Check, Megaphone, Percent, RefreshCw } from 'lucide-vue-next';
import { adminApi } from '~/api/adminApi';
import { useAdminAuthStore } from '~/stores/auth';
useSeoMeta({ title: 'Promotions' });
const toast = useAdminToast();
const auth = useAdminAuthStore();
const loading = ref(false);
const saving = ref(false);
const form = reactive({ enabled: false, percentOff: 10, maxDiscount: '' });
async function load() {
  loading.value = true;
  try { const result = await adminApi.newCustomerPromotion(); Object.assign(form, { enabled: Boolean(result.enabled), percentOff: Number(result.percentOff || 0), maxDiscount: result.maxDiscountKobo ? String(result.maxDiscountKobo / 100) : '' }); }
  catch (error) { toast.error((error as Error).message); }
  finally { loading.value = false; }
}
async function save() {
  saving.value = true;
  try {
    await adminApi.updateNewCustomerPromotion({ enabled: form.enabled, percentOff: Number(form.percentOff) || 0, maxDiscountKobo: Math.round(Number(form.maxDiscount || 0) * 100) });
    toast.success('New customer promotion saved.'); await load();
  } catch (error) { toast.error((error as Error).message); }
  finally { saving.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <PageHeading title="Promotions" subtitle="Acquisition offers that bring new customers onto Ojaly." eyebrow="Growth">
      <template #actions><AdminButton variant="outline" :loading="loading" @click="load"><RefreshCw class="h-3.5 w-3.5" /> Refresh</AdminButton></template>
    </PageHeading>
    <div class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="card p-5">
        <div class="flex items-start justify-between gap-3"><div class="flex items-start gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-acid/10 text-acid"><Megaphone class="h-5 w-5" /></div><div><h2 class="font-display text-xl font-bold">New customer offer</h2><p class="mt-1 text-xs text-muted">A first-booking discount applied automatically to customers with no previous booking or order.</p></div></div><AdminBadge :variant="form.enabled ? 'success' : 'neutral'">{{ form.enabled ? 'Active' : 'Off' }}</AdminBadge></div>
        <div v-if="!auth.isSuperAdmin" class="mt-4 rounded-lg bg-warning/10 p-3 text-[10px] text-warning">Support access is read-only.</div>
        <div class="mt-5 space-y-4">
          <label class="flex items-center gap-2 text-sm font-semibold"><input v-model="form.enabled" type="checkbox" class="rounded" :disabled="!auth.isSuperAdmin"> Enable new customer promotion</label>
          <AdminInput v-model.number="form.percentOff" label="Discount percentage" type="number" min="0" max="100" hint="Example: 10 gives a new customer 10% off their first service booking." :disabled="!auth.isSuperAdmin" />
          <AdminInput v-model="form.maxDiscount" label="Maximum discount (optional, ₦)" inputmode="decimal" hint="Leave blank for no cap." :disabled="!auth.isSuperAdmin" />
          <div class="rounded-lg border border-line bg-raised/50 p-3 text-[11px]"><p class="font-semibold">Example</p><p class="mt-1 text-muted">A ₦20,000 first booking with {{ form.percentOff || 0 }}% off becomes {{ formatNaira(2000000 - Math.min(2000000 * (Number(form.percentOff) || 0) / 100, Number(form.maxDiscount || 0) * 100 || Infinity)) }}.</p></div>
          <AdminButton v-if="auth.isSuperAdmin" :loading="saving" @click="save"><Check class="h-3.5 w-3.5" /> Save promotion</AdminButton>
        </div>
      </div>
      <div class="card p-5"><div class="flex items-center gap-2"><Percent class="h-4 w-4 text-acid" /><h2 class="font-display text-lg font-bold">How eligibility works</h2></div><div class="mt-4 space-y-3 text-[11px] leading-relaxed text-muted"><p><strong class="text-ink">New customer:</strong> no previous non-cancelled booking and no previous order with the same phone number or email.</p><p><strong class="text-ink">Applied to:</strong> the service subtotal before Ojaly's customer service charge. Add-ons are included.</p><p><strong class="text-ink">One use:</strong> once the booking exists, the same phone or email is no longer eligible.</p><p><strong class="text-ink">Existing bookings:</strong> the discount is stored on the booking and never changes retroactively.</p><p><strong class="text-ink">Custom quotes:</strong> the same first-booking rule applies when a quote becomes a booking.</p></div></div>
    </div>
  </div>
</template>
