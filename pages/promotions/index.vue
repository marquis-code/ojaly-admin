<script setup lang="ts">
import { Check, Megaphone, Percent, RefreshCw, Sparkles } from 'lucide-vue-next';
import { moneyNumber } from '~/utils/money';
import { adminApi } from '~/api/adminApi';
import { useAdminAuthStore } from '~/stores/auth';
useSeoMeta({ title: 'Promotions' });
const toast = useAdminToast();
const auth = useAdminAuthStore();
const loading = ref(false);
const saving = ref(false);
const form = reactive({ enabled: false, percentOff: 10, maxDiscount: '', startsAt: '', endsAt: '' });
const campaign = reactive({ enabled: false, percentOff: 10, maxDiscount: '', label: '10% off everything', bannerText: 'Ojaly is giving every customer 10% off every order and booking.', badgeText: '10% OFF', startsAt: '', endsAt: '' });
async function load() {
  loading.value = true;
  try { const [result, platform] = await Promise.all([adminApi.newCustomerPromotion(), adminApi.platformCampaign()]); Object.assign(form, { enabled: Boolean(result.enabled), percentOff: Number(result.percentOff || 0), maxDiscount: result.maxDiscountKobo ? String(result.maxDiscountKobo / 100) : '', startsAt: result.startsAt ? String(result.startsAt).slice(0, 10) : '', endsAt: result.endsAt ? String(result.endsAt).slice(0, 10) : '' }); Object.assign(campaign, { enabled: Boolean(platform.enabled), percentOff: Number(platform.percentOff || 0), maxDiscount: platform.maxDiscountKobo ? String(platform.maxDiscountKobo / 100) : '', label: platform.label || '10% off everything', bannerText: platform.bannerText || '', badgeText: platform.badgeText || '10% OFF', startsAt: platform.startsAt ? String(platform.startsAt).slice(0, 10) : '', endsAt: platform.endsAt ? String(platform.endsAt).slice(0, 10) : '' }); }
  catch (error) { toast.error((error as Error).message); }
  finally { loading.value = false; }
}
async function saveCampaign() {
  saving.value = true;
  try {
    await adminApi.updatePlatformCampaign({ enabled: campaign.enabled, percentOff: Number(campaign.percentOff) || 0, maxDiscountKobo: Math.round(moneyNumber(campaign.maxDiscount) * 100), label: campaign.label, bannerText: campaign.bannerText, badgeText: campaign.badgeText, startsAt: campaign.startsAt || null, endsAt: campaign.endsAt || null });
    toast.success('Ojaly-wide campaign saved.'); await load();
  } catch (error) { toast.error((error as Error).message); }
  finally { saving.value = false; }
}
async function save() {
  saving.value = true;
  try {
    await adminApi.updateNewCustomerPromotion({ enabled: form.enabled, percentOff: Number(form.percentOff) || 0, maxDiscountKobo: Math.round(moneyNumber(form.maxDiscount) * 100), startsAt: form.startsAt || null, endsAt: form.endsAt || null });
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
    <div class="card p-5">
      <div class="flex flex-wrap items-start justify-between gap-3"><div class="flex items-start gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-acid/10 text-acid"><Sparkles class="h-5 w-5" /></div><div><h2 class="font-display text-xl font-bold">Ojaly-wide offer</h2><p class="mt-1 text-xs text-muted">A platform-wide discount shown on the landing page, every storefront, and every product and service.</p></div></div><AdminBadge :variant="campaign.enabled ? 'success' : 'neutral'">{{ campaign.enabled ? 'Running' : 'Off' }}</AdminBadge></div>
      <div v-if="!auth.isSuperAdmin" class="mt-4 rounded-lg bg-warning/10 p-3 text-[10px] text-warning">Support access is read-only.</div>
      <div class="mt-5 grid gap-3 md:grid-cols-2"><label class="flex items-center gap-2 text-sm font-semibold"><input v-model="campaign.enabled" type="checkbox" class="rounded" :disabled="!auth.isSuperAdmin"> Run campaign across all businesses</label><AdminInput v-model.number="campaign.percentOff" label="Discount percentage" type="number" min="0" max="100" :disabled="!auth.isSuperAdmin" /><AdminInput v-model="campaign.maxDiscount" label="Maximum discount (optional, ₦)" inputmode="decimal" hint="Leave blank for no cap." :disabled="!auth.isSuperAdmin" /><AdminInput v-model="campaign.badgeText" label="Short badge" placeholder="10% OFF" :disabled="!auth.isSuperAdmin" /></div>
      <div class="mt-3 grid gap-3 md:grid-cols-2"><AdminDatePicker v-model="campaign.startsAt" label="Campaign starts" /><AdminDatePicker v-model="campaign.endsAt" label="Campaign ends" /></div>
      <div class="mt-3 grid gap-3 md:grid-cols-2"><AdminInput v-model="campaign.label" label="Offer label" placeholder="10% off everything" :disabled="!auth.isSuperAdmin" /><AdminInput v-model="campaign.bannerText" label="Moving banner text" placeholder="Ojaly is giving every customer 10% off..." :disabled="!auth.isSuperAdmin" /></div>
      <div class="mt-3 rounded-lg border border-line bg-raised/50 p-3 text-[11px]"><p class="font-semibold">Preview</p><p class="mt-1 font-bold text-acid">{{ campaign.badgeText || '10% OFF' }}</p><p class="mt-1 text-muted">{{ campaign.bannerText }}</p></div>
      <AdminButton v-if="auth.isSuperAdmin" class="mt-4" :loading="saving" @click="saveCampaign"><Check class="h-3.5 w-3.5" /> Save platform campaign</AdminButton>
    </div>
    <div class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="card p-5">
        <div class="flex items-start justify-between gap-3"><div class="flex items-start gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-acid/10 text-acid"><Megaphone class="h-5 w-5" /></div><div><h2 class="font-display text-xl font-bold">New customer offer</h2><p class="mt-1 text-xs text-muted">A first-booking discount applied automatically to customers with no previous booking or order.</p></div></div><AdminBadge :variant="form.enabled ? 'success' : 'neutral'">{{ form.enabled ? 'Active' : 'Off' }}</AdminBadge></div>
        <div v-if="!auth.isSuperAdmin" class="mt-4 rounded-lg bg-warning/10 p-3 text-[10px] text-warning">Support access is read-only.</div>
        <div class="mt-5 space-y-4">
          <label class="flex items-center gap-2 text-sm font-semibold"><input v-model="form.enabled" type="checkbox" class="rounded" :disabled="!auth.isSuperAdmin"> Enable new customer promotion</label>
          <AdminInput v-model.number="form.percentOff" label="Discount percentage" type="number" min="0" max="100" hint="Example: 10 gives a new customer 10% off their first service booking." :disabled="!auth.isSuperAdmin" />
          <AdminInput v-model="form.maxDiscount" label="Maximum discount (optional, ₦)" inputmode="decimal" hint="Leave blank for no cap." :disabled="!auth.isSuperAdmin" />
          <div class="grid gap-3 sm:grid-cols-2"><AdminDatePicker v-model="form.startsAt" label="Starts" :disabled="!auth.isSuperAdmin" /><AdminDatePicker v-model="form.endsAt" label="Ends" :disabled="!auth.isSuperAdmin" /></div>
          <div class="rounded-lg border border-line bg-raised/50 p-3 text-[11px]"><p class="font-semibold">Example</p><p class="mt-1 text-muted">A ₦20,000 first booking with {{ form.percentOff || 0 }}% off becomes {{ formatNaira(2000000 - Math.min(2000000 * (Number(form.percentOff) || 0) / 100, moneyNumber(form.maxDiscount) * 100 || Infinity)) }}.</p></div>
          <AdminButton v-if="auth.isSuperAdmin" :loading="saving" @click="save"><Check class="h-3.5 w-3.5" /> Save promotion</AdminButton>
        </div>
      </div>
      <div class="card p-5"><div class="flex items-center gap-2"><Percent class="h-4 w-4 text-acid" /><h2 class="font-display text-lg font-bold">How eligibility works</h2></div><div class="mt-4 space-y-3 text-[11px] leading-relaxed text-muted"><p><strong class="text-ink">New customer:</strong> no previous non-cancelled booking and no previous order with the same phone number or email.</p><p><strong class="text-ink">Applied to:</strong> the service subtotal before Ojaly's customer service charge. Add-ons are included.</p><p><strong class="text-ink">One use:</strong> once the booking exists, the same phone or email is no longer eligible.</p><p><strong class="text-ink">Existing bookings:</strong> the discount is stored on the booking and never changes retroactively.</p><p><strong class="text-ink">Custom quotes:</strong> the same first-booking rule applies when a quote becomes a booking.</p></div></div>
    </div>
  </div>
</template>
