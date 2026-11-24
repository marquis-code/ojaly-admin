<script setup lang="ts">
import { AlertCircle, ArrowUpRight, BadgeDollarSign, Banknote, CheckCircle2, Download, ExternalLink, RefreshCw, Search, ShieldCheck, Users, X, XCircle } from 'lucide-vue-next';
import { useAdminAuthStore } from '~/stores/auth';
import type { AdminAffiliatePayout } from '~/types';
import { formatDate, formatNaira } from '~/utils/format';

definePageMeta({ layout: 'default' });
useSeoMeta({ title: 'Payouts & withdrawals' });

const auth = useAdminAuthStore();
const toast = useAdminToast();
const { stats, payouts, loading, saving, load, updatePayout } = useAdminAffiliates();
const { exporting, download } = useAdminExport();

const status = ref('requested');
const page = ref(1);
const searchQuery = ref('');
const selected = ref<AdminAffiliatePayout | null>(null);
const action = ref<'paid' | 'rejected'>('paid');
const reference = ref('');
const note = ref('');
const modalOpen = ref(false);

async function reload() {
  try {
    await load({ status: status.value, page: page.value, limit: 30 });
  } catch (error) {
    toast.error((error as Error).message);
  }
}

function openAction(payout: AdminAffiliatePayout, next: 'paid' | 'rejected') {
  selected.value = payout;
  action.value = next;
  reference.value = '';
  note.value = '';
  modalOpen.value = true;
}

async function confirmAction() {
  if (!selected.value) return;
  if (action.value === 'rejected' && !note.value.trim()) {
    toast.error('Please provide a reason for rejecting this payout request.');
    return;
  }
  try {
    await updatePayout(selected.value.id, {
      status: action.value,
      reference: reference.value || undefined,
      note: note.value || undefined,
    });
    toast.success(action.value === 'paid' ? 'Payout marked as paid and recorded.' : 'Payout rejected and balance restored to vendor.');
    modalOpen.value = false;
    await reload();
  } catch (error) {
    toast.error((error as Error).message);
  }
}

async function exportRows() {
  try {
    await download('affiliate-payouts');
    toast.success('Payout requests CSV downloaded.');
  } catch (error) {
    toast.error((error as Error).message);
  }
}

const filteredItems = computed(() => {
  const items = payouts.value?.items || [];
  if (!searchQuery.value.trim()) return items;
  const q = searchQuery.value.toLowerCase();
  return items.filter((item) =>
    (item.business?.name || '').toLowerCase().includes(q) ||
    (item.business?.slug || '').toLowerCase().includes(q) ||
    (item.bankName || '').toLowerCase().includes(q) ||
    (item.accountName || '').toLowerCase().includes(q) ||
    (item.accountNumber || '').includes(q) ||
    (item.reference || '').toLowerCase().includes(q)
  );
});

watch(status, () => {
  page.value = 1;
  void reload();
});

onMounted(reload);
</script>

<template>
  <div class="space-y-5">
    <PageHeading
      title="Payouts & withdrawals"
      subtitle="Review pending vendor withdrawal requests, verify destination bank accounts, mark bank transfers as paid, or reject requests with audit logging."
      eyebrow="Revenue & settlements"
    >
      <template #actions>
        <AdminButton variant="outline" :loading="loading" @click="reload">
          <RefreshCw class="h-3.5 w-3.5" /> Refresh
        </AdminButton>
        <AdminButton variant="outline" :loading="exporting === 'affiliate-payouts'" @click="exportRows">
          <Download class="h-3.5 w-3.5" /> Export payouts CSV
        </AdminButton>
        <NuxtLink to="/affiliates" class="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-bold hover:bg-raised">
          <Users class="h-3.5 w-3.5 text-muted" /> Affiliates overview
        </NuxtLink>
      </template>
    </PageHeading>

    <!-- Key Metrics Cards -->
    <div v-if="stats" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStat
        label="Pending requests"
        :value="stats.metrics.pendingPayouts"
        :tone="stats.metrics.pendingPayouts > 0 ? 'danger' : 'acid'"
        :hint="stats.metrics.pendingPayouts > 0 ? 'Action required: awaiting review' : 'All requests processed'"
      />
      <AdminStat
        label="Withdrawable available"
        :value="formatNaira(stats.metrics.availableKobo, true)"
        tone="acid"
        :hint="`${formatNaira(stats.metrics.pendingKobo, true)} still on hold`"
      />
      <AdminStat
        label="Total paid out"
        :value="formatNaira(stats.metrics.paidKobo, true)"
        :hint="`${stats.metrics.affiliates} registered vendor affiliates`"
      />
      <AdminStat
        label="Total commissions earned"
        :value="formatNaira(stats.metrics.totalEarnedKobo, true)"
        :hint="`${stats.metrics.conversions} paid conversions recorded`"
      />
    </div>

    <!-- Payout Request Queue & Search -->
    <div class="card">
      <div class="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-sm font-bold">Withdrawal & payout requests</h2>
          <p class="text-[11px] text-muted">When a vendor requests a payout, it reserves their balance. Paying marks it complete; rejecting restores the balance.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative w-48 sm:w-64">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search business, bank, account…"
              class="w-full rounded-xl border border-line bg-surface py-2 pl-8 pr-3 text-xs focus:border-acid focus:outline-none"
            />
          </div>
          <AdminSelect
            v-model="status"
            :options="[
              { value: 'requested', label: 'Requested (Pending)' },
              { value: 'paid', label: 'Paid / Transferred' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'all', label: 'All statuses' },
            ]"
            aria-label="Filter by payout status"
            class="!w-44"
            size="sm"
          />
        </div>
      </div>

      <AdminTable :loading="loading && !payouts">
        <template #head>
          <tr>
            <th class="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-muted">Business</th>
            <th class="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-muted">Destination Bank Account</th>
            <th class="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wider text-muted">Amount</th>
            <th class="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-muted">Status</th>
            <th class="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-muted">Requested</th>
            <th class="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wider text-muted">Action</th>
          </tr>
        </template>
        <template #body>
          <tr v-for="item in filteredItems" :key="item.id" class="border-b border-line last:border-0 hover:bg-raised/30 transition">
            <td class="px-4 py-3.5">
              <div class="flex items-center gap-2">
                <div>
                  <p class="text-xs font-bold text-ink">{{ item.business?.name || item.businessId }}</p>
                  <NuxtLink v-if="item.business?.slug" :to="`/businesses/${item.businessId}`" class="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-acid hover:underline">
                    /s/{{ item.business.slug }} <ExternalLink class="h-2.5 w-2.5" />
                  </NuxtLink>
                </div>
              </div>
            </td>
            <td class="px-4 py-3.5">
              <p class="text-[11px] font-bold text-ink">{{ item.bankName }}</p>
              <p class="mt-0.5 text-[10px] text-muted">{{ item.accountName }}</p>
              <p class="font-mono text-[10px] font-semibold text-muted">{{ item.accountNumber }}</p>
            </td>
            <td class="px-4 py-3.5 text-right">
              <span class="font-display text-sm font-bold text-ink">{{ formatNaira(item.amountKobo) }}</span>
            </td>
            <td class="px-4 py-3.5">
              <AdminBadge :variant="item.status === 'paid' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'">
                {{ item.status === 'requested' ? 'Pending Review' : item.status }}
              </AdminBadge>
            </td>
            <td class="px-4 py-3.5 text-[10px] text-muted">
              {{ formatDate(item.createdAt, true) }}
            </td>
            <td class="px-4 py-3.5 text-right">
              <div v-if="auth.isSuperAdmin && item.status === 'requested'" class="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  class="rounded-lg border border-success/40 bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success hover:bg-success hover:text-white transition"
                  @click="openAction(item, 'paid')"
                >
                  Mark Paid
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-danger/40 bg-danger/5 px-2.5 py-1 text-[10px] font-bold text-danger hover:bg-danger hover:text-white transition"
                  @click="openAction(item, 'rejected')"
                >
                  Reject
                </button>
              </div>
              <div v-else-if="item.status === 'paid'" class="text-[10px] text-muted">
                <span v-if="item.reference" class="font-mono font-semibold">{{ item.reference }}</span>
                <span v-else class="text-success font-semibold">Completed</span>
              </div>
              <div v-else-if="item.status === 'rejected'" class="text-[10px] text-danger">
                <span>{{ item.note || 'Rejected & restored' }}</span>
              </div>
              <div v-else class="text-[10px] text-muted">—</div>
            </td>
          </tr>
          <tr v-if="!filteredItems.length && !loading">
            <td colspan="6">
              <AdminEmpty
                title="No withdrawal requests found"
                :message="searchQuery ? 'No requests match your search criteria.' : (status === 'requested' ? 'No pending withdrawal requests. You are all caught up!' : 'No payouts in this status view.')"
              >
                <template #icon><Banknote class="h-6 w-6 text-muted" /></template>
              </AdminEmpty>
            </td>
          </tr>
        </template>
      </AdminTable>

      <div class="flex flex-wrap items-center justify-between border-t border-line px-4 py-3 text-[10px] text-muted">
        <span>{{ payouts?.meta.total || 0 }} total requests</span>
        <div class="flex items-center gap-2">
          <AdminButton size="sm" variant="outline" :disabled="page <= 1" @click="page--; reload()">
            Previous
          </AdminButton>
          <span>Page {{ payouts?.meta.page || 1 }} / {{ payouts?.meta.pages || 1 }}</span>
          <AdminButton size="sm" variant="outline" :disabled="page >= (payouts?.meta.pages || 1)" @click="page++; reload()">
            Next
          </AdminButton>
        </div>
      </div>
    </div>

    <!-- Processing Modal -->
    <AdminModal
      v-model:open="modalOpen"
      :title="action === 'paid' ? 'Mark withdrawal as paid' : 'Reject withdrawal request'"
      :description="selected ? `${selected.business?.name || selected.businessId} · ${formatNaira(selected.amountKobo)}` : ''"
    >
      <div v-if="selected" class="space-y-3 rounded-2xl bg-raised/60 p-4 text-xs">
        <div class="flex items-center justify-between border-b border-line/60 pb-2">
          <span class="text-muted">Business:</span>
          <strong class="font-bold text-ink">{{ selected.business?.name || selected.businessId }}</strong>
        </div>
        <div class="flex items-center justify-between border-b border-line/60 pb-2">
          <span class="text-muted">Payout Amount:</span>
          <span class="font-display font-bold text-base text-ink">{{ formatNaira(selected.amountKobo) }}</span>
        </div>
        <div class="flex items-center justify-between border-b border-line/60 pb-2">
          <span class="text-muted">Destination Bank:</span>
          <strong class="font-bold text-ink">{{ selected.bankName }}</strong>
        </div>
        <div class="flex items-center justify-between border-b border-line/60 pb-2">
          <span class="text-muted">Account Name:</span>
          <span class="font-medium text-ink">{{ selected.accountName }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-muted">Account Number:</span>
          <span class="font-mono font-bold text-ink">{{ selected.accountNumber }}</span>
        </div>
      </div>

      <div class="mt-4 space-y-3">
        <AdminInput
          v-if="action === 'paid'"
          v-model="reference"
          label="Bank transfer reference / transaction ID"
          placeholder="e.g. GTB-TRF-20261124-9481 or Paystack Ref"
        />
        <AdminInput
          v-model="note"
          :label="action === 'paid' ? 'Internal note (optional)' : 'Rejection reason (required)'"
          :placeholder="action === 'paid' ? 'e.g. Paid via corporate bank transfer' : 'e.g. Account name mismatch, duplicate request'"
        />
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <AdminButton variant="ghost" @click="modalOpen = false">Cancel</AdminButton>
        <AdminButton
          :variant="action === 'paid' ? 'primary' : 'danger'"
          :loading="saving"
          @click="confirmAction"
        >
          {{ action === 'paid' ? 'Confirm transfer & mark paid' : 'Reject & restore balance' }}
        </AdminButton>
      </div>
    </AdminModal>
  </div>
</template>
