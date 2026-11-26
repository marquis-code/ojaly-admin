<script setup lang="ts">
import { Banknote, RefreshCw } from 'lucide-vue-next';
import { adminApi } from '~/api/adminApi';
import { formatNaira } from '~/utils/format';
useSeoMeta({ title: 'Vendor withdrawals' });
const toast = useAdminToast();
const items = ref<Record<string, any>[]>([]);
const loading = ref(false);
const busy = ref<string | null>(null);
const open = ref(false);
const selected = ref<Record<string, any> | null>(null);
const action = ref<'approved' | 'paid' | 'rejected'>('paid');
const note = ref('');
const reference = ref('');
async function load() { loading.value = true; try { items.value = await adminApi.withdrawals(); } catch (error) { toast.error((error as Error).message); } finally { loading.value = false; } }
function begin(item: Record<string, any>, next: 'approved' | 'paid' | 'rejected') { selected.value = item; action.value = next; note.value = item.adminNote || ''; reference.value = item.reference || ''; open.value = true; }
async function save() {
  if (!selected.value) return;
  busy.value = selected.value.id;
  try { await adminApi.updateWithdrawal(selected.value.id, { status: action.value, adminNote: note.value, reference: reference.value }); toast.success(`Withdrawal ${action.value}.`); open.value = false; await load(); }
  catch (error) { toast.error((error as Error).message); }
  finally { busy.value = null; }
}
onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <PageHeading title="Vendor withdrawals" subtitle="Review and settle cash-out requests from vendors." eyebrow="Revenue"><template #actions><AdminButton variant="outline" :loading="loading" @click="load"><RefreshCw class="h-3.5 w-3.5" /> Refresh</AdminButton></template></PageHeading>
    <div class="grid gap-3 sm:grid-cols-3"><div class="card p-4"><p class="text-[9px] font-bold uppercase tracking-wider text-muted">Requests</p><p class="mt-1 text-2xl font-bold">{{ items.length }}</p></div><div class="card p-4"><p class="text-[9px] font-bold uppercase tracking-wider text-muted">Awaiting action</p><p class="mt-1 text-2xl font-bold text-acid">{{ items.filter(i => ['pending', 'approved'].includes(i.status)).length }}</p></div><div class="card p-4"><p class="text-[9px] font-bold uppercase tracking-wider text-muted">Paid out</p><p class="mt-1 text-xl font-bold">{{ formatNaira(items.filter(i => i.status === 'paid').reduce((s, i) => s + i.amountKobo, 0)) }}</p></div></div>
    <AdminTable :loading="loading && !items.length">
      <template #head><tr><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Vendor</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Amount</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Bank</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Requested</th><th class="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted">Status</th><th class="px-4 py-2.5"></th></tr></template>
      <template #body>
        <tr v-for="item in items" :key="item.id" class="border-b border-line last:border-0 hover:bg-raised/30">
          <td class="px-4 py-3"><p class="text-xs font-bold">{{ item.business?.name || 'Vendor' }}</p><p class="text-[9px] text-muted">{{ item.note || 'No vendor note' }}</p></td>
          <td class="px-4 py-3 text-xs font-bold">{{ formatNaira(item.amountKobo) }}</td>
          <td class="px-4 py-3"><p class="text-[10px] font-semibold">{{ item.bankName }}</p><p class="text-[9px] text-muted">{{ item.accountName }} · {{ item.accountNumber }}</p></td>
          <td class="px-4 py-3 text-[10px] text-muted">{{ new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
          <td class="px-4 py-3"><AdminBadge :variant="item.status === 'paid' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'">{{ item.status }}</AdminBadge><p v-if="item.reference" class="mt-1 text-[9px] text-muted">{{ item.reference }}</p></td>
          <td class="px-4 py-3 text-right"><div class="flex justify-end gap-1"><AdminButton v-if="item.status === 'pending'" size="sm" variant="outline" :loading="busy === item.id" @click="begin(item, 'approved')">Approve</AdminButton><AdminButton v-if="['pending', 'approved'].includes(item.status)" size="sm" :loading="busy === item.id" @click="begin(item, 'paid')">Mark paid</AdminButton><AdminButton v-if="['pending', 'approved'].includes(item.status)" size="sm" variant="ghost" class="text-danger" @click="begin(item, 'rejected')">Reject</AdminButton></div></td>
        </tr>
        <tr v-if="!items.length && !loading"><td colspan="6"><AdminEmpty title="No withdrawal requests" message="Vendor cash-out requests will appear here."><template #icon><Banknote class="h-6 w-6" /></template></AdminEmpty></td></tr>
      </template>
    </AdminTable>
    <AdminModal v-model:open="open" :title="action === 'paid' ? 'Mark withdrawal paid' : action === 'approved' ? 'Approve withdrawal' : 'Reject withdrawal'" description="Update the vendor and keep an audit trail.">
      <div class="space-y-3"><p v-if="selected" class="rounded-lg bg-raised p-3 text-xs"><strong>{{ selected.business?.name }}</strong> · {{ formatNaira(selected.amountKobo) }}</p><AdminInput v-model="note" label="Admin note" placeholder="Transfer reference or reason" /><AdminInput v-if="action === 'paid'" v-model="reference" label="Bank transfer reference" placeholder="Transfer reference" /></div>
      <template #footer><div class="flex justify-end gap-2"><AdminButton variant="ghost" @click="open = false">Cancel</AdminButton><AdminButton :loading="!!busy" @click="save">Save</AdminButton></div></template>
    </AdminModal>
  </div>
</template>
