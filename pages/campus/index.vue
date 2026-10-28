<script setup lang="ts">
import { GraduationCap, RefreshCw } from 'lucide-vue-next';
import { formatDate, formatNaira } from '~/utils/format';
useSeoMeta({ title: 'Campus applications' });
const toast = useAdminToast();
const { items, loading, saving, filter, load, setStatus } = useAdminCampus();
const { create, saving: payoutSaving } = useAdminCampusPayouts();
const payoutOpen = ref(false);
const payoutApplication = ref<import('~/types').AdminCampusApplication | null>(null);
const payoutAmount = ref('');
const payoutNote = ref('');
function openPayout(application: import('~/types').AdminCampusApplication) {
  payoutApplication.value = application;
  payoutAmount.value = String(Math.round((application.owedKobo || 0) / 100));
  payoutNote.value = '';
  payoutOpen.value = true;
}
async function savePayout() {
  if (!payoutApplication.value) return;
  try {
    await create(payoutApplication.value.id, Math.round(Number(payoutAmount.value) * 100), payoutNote.value);
    toast.success('Payout recorded.');
    payoutOpen.value = false;
    await load();
  } catch (error) { toast.error((error as Error).message); }
}
async function update(id: string, status: 'approved' | 'rejected') {
  try { await setStatus(id, status); toast.success(`Application ${status}.`); }
  catch (error) { toast.error((error as Error).message); }
}
watch(filter, load);
onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <PageHeading title="Campus applications" subtitle="Ambassador pipeline for the Lagos pilot — UNILAG and CMUL." eyebrow="Growth">
      <template #actions><AdminButton variant="outline" :loading="loading" @click="load"><RefreshCw class="h-3.5 w-3.5" /> Refresh</AdminButton></template>
    </PageHeading>
    <div class="flex gap-2">
      <button v-for="f in [{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]" :key="f.value" type="button" class="rounded-lg border px-3 py-1.5 text-[10px] font-bold" :class="filter === f.value ? 'border-acid bg-acid/10 text-acid' : 'border-line text-muted'" @click="filter = f.value">{{ f.label }}</button>
    </div>
    <AdminTable :loading="loading && !items.length">
      <template #head><tr><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Applicant</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Campus</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Why</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Applied</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Status</th><th class="px-4 py-2.5"></th></tr></template>
      <template #body>
        <tr v-for="application in items" :key="application.id" class="border-b border-line last:border-0 hover:bg-raised/30">
          <td class="px-4 py-3"><p class="text-xs font-bold">{{ application.name }}</p><p class="text-[10px] text-muted">{{ application.phone }} · {{ application.email || 'no email' }}</p><p class="text-[9px] text-muted">{{ application.year || '—' }} · {{ application.socials || '—' }}</p></td>
          <td class="px-4 py-3"><AdminBadge variant="neutral">{{ application.campusCode }}</AdminBadge><p class="mt-1 text-[9px] text-muted">{{ application.campusName }}</p></td>
          <td class="max-w-xs px-4 py-3 text-[10px] text-muted">{{ application.why || '—' }}</td>
          <td class="px-4 py-3 text-[10px] text-muted">{{ formatDate(application.createdAt) }}</td>
          <td class="px-4 py-3"><p v-if="application.ambassadorCode" class="font-mono text-[10px] font-bold text-acid">{{ application.ambassadorCode }}</p><p v-else class="text-[9px] text-muted">No code yet</p><p class="mt-1 text-[9px] text-muted">{{ application.activated || 0 }} activated · {{ formatNaira(application.owedKobo || 0) }} owed</p><AdminBadge class="mt-1" :variant="application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'danger' : 'warning'">{{ application.status }}</AdminBadge></td>
          <td class="px-4 py-3 text-right"><div class="flex justify-end gap-1"><AdminButton v-if="application.status !== 'approved'" size="sm" :loading="saving" @click="update(application.id, 'approved')">Approve</AdminButton><AdminButton v-if="application.status !== 'rejected'" size="sm" variant="outline" :loading="saving" @click="update(application.id, 'rejected')">Reject</AdminButton><AdminButton v-if="application.status === 'approved' && application.ambassadorCode" size="sm" variant="outline" @click="openPayout(application)">Payout</AdminButton></div></td>
        </tr>
        <tr v-if="!items.length && !loading"><td colspan="6"><AdminEmpty title="No applications yet" message="Campus ambassador applications from the Lagos landing page will appear here."><template #icon><GraduationCap class="h-6 w-6" /></template></AdminEmpty></td></tr>
      </template>
    </AdminTable>

    <AdminModal v-model:open="payoutOpen" title="Record ambassador payout" :description="payoutApplication?.name || ''">
      <div class="space-y-3"><AdminInput v-model="payoutAmount" label="Amount (₦)" type="number" min="1" /><AdminInput v-model="payoutNote" label="Note" placeholder="UNILAG activation bonus" /><div class="rounded-lg bg-raised p-3 text-[10px] text-muted">Code: <strong>{{ payoutApplication?.ambassadorCode }}</strong> · Owed: <strong>{{ formatNaira(payoutApplication?.owedKobo || 0) }}</strong></div><div class="flex justify-end gap-2"><AdminButton variant="ghost" @click="payoutOpen = false">Cancel</AdminButton><AdminButton :loading="payoutSaving" @click="savePayout">Record payout</AdminButton></div></div>
    </AdminModal>
  </div>
</template>
