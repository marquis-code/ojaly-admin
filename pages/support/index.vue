<script setup lang="ts">
import { Check, MessageCircle, RefreshCw, Send, X } from 'lucide-vue-next';
import { adminApi } from '~/api/adminApi';
import { formatDate } from '~/utils/format';
useSeoMeta({ title: 'Support inbox' });
const toast = useAdminToast();
const conversations = ref<Record<string, any>[]>([]);
const selectedId = ref('');
const thread = ref<Record<string, any> | null>(null);
const draft = ref('');
const loading = ref(false);
const sending = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;
async function load() {
  try { conversations.value = await adminApi.supportConversations(); if (!selectedId.value && conversations.value[0]) await open(conversations.value[0].id); }
  catch (error) { toast.error((error as Error).message); }
}
async function open(id: string) {
  selectedId.value = id; loading.value = true;
  try { thread.value = await adminApi.supportThread(id); }
  catch (error) { toast.error((error as Error).message); }
  finally { loading.value = false; }
}
async function send() {
  if (!thread.value || !draft.value.trim()) return;
  sending.value = true;
  try { await adminApi.supportReply(thread.value.conversation.id, draft.value.trim()); draft.value = ''; thread.value = await adminApi.supportThread(thread.value.conversation.id); await load(); }
  catch (error) { toast.error((error as Error).message); }
  finally { sending.value = false; }
}
async function close() {
  if (!thread.value) return;
  try { await adminApi.closeSupport(thread.value.conversation.id); toast.success('Conversation closed.'); await load(); }
  catch (error) { toast.error((error as Error).message); }
}
function when(value: string) { return new Date(value).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }); }
onMounted(async () => { await load(); timer = setInterval(() => { if (!selectedId.value) return; void load(); }, 10000); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div class="space-y-5">
    <PageHeading title="Support inbox" subtitle="Real conversations from the Ojaly website. Reply as yourself." eyebrow="Customer care">
      <template #actions><AdminButton variant="outline" :loading="loading" @click="load"><RefreshCw class="h-3.5 w-3.5" /> Refresh</AdminButton></template>
    </PageHeading>
    <div class="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <div class="card overflow-hidden">
        <div class="flex items-center justify-between border-b border-line p-4"><p class="text-xs font-bold">Conversations</p><span class="text-[10px] text-muted">{{ conversations.length }}</span></div>
        <div v-if="conversations.length" class="divide-y divide-line">
          <button v-for="item in conversations" :key="item.id" type="button" class="w-full p-4 text-left transition hover:bg-raised/50" :class="selectedId === item.id ? 'bg-raised/60' : ''" @click="open(item.id)">
            <div class="flex items-start justify-between gap-2"><div class="min-w-0"><p class="truncate text-xs font-bold">{{ item.name }}</p><p class="mt-0.5 truncate text-[10px] text-muted">{{ item.email }}</p></div><span v-if="item.unreadAdmin" class="flex h-5 min-w-5 items-center justify-center rounded-full bg-acid px-1 text-[9px] font-bold text-white">{{ item.unreadAdmin }}</span></div>
            <p class="mt-2 line-clamp-1 text-[10px] text-muted">{{ item.lastSender === 'admin' ? 'You: ' : '' }}{{ item.lastMessage || 'No messages yet' }}</p>
            <div class="mt-1 flex justify-between text-[9px] text-muted"><span>{{ formatDate(item.createdAt, true) }}</span><AdminBadge :variant="item.status === 'open' ? 'success' : 'neutral'">{{ item.status }}</AdminBadge></div>
          </button>
        </div>
        <div v-else class="p-8 text-center"><MessageCircle class="mx-auto h-7 w-7 text-muted" /><p class="mt-3 text-sm font-bold">No conversations yet</p><p class="mt-1 text-xs text-muted">Support chats started on the landing page appear here.</p></div>
      </div>
      <div v-if="thread" class="card flex min-h-[560px] flex-col overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4"><div><p class="text-sm font-bold">{{ thread.conversation.name }}</p><p class="mt-0.5 text-[10px] text-muted">{{ thread.conversation.email }} · {{ thread.conversation.phone }}</p></div><div class="flex gap-2"><a :href="`mailto:${thread.conversation.email}`" class="rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-bold">Email</a><button type="button" class="rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-bold text-danger" @click="close"><X class="h-3 w-3" /> Close</button></div></div>
        <div class="flex-1 space-y-3 overflow-y-auto bg-canvas/30 p-4"><div v-for="message in thread.messages" :key="message.id" class="max-w-[85%]"><div class="rounded-2xl px-3 py-2 text-xs leading-relaxed" :class="message.sender === 'admin' ? 'ml-auto bg-acid text-white' : 'bg-surface text-ink shadow-sm'">{{ message.body }}</div><p class="mt-1 text-[9px] text-muted" :class="message.sender === 'admin' ? 'text-right' : ''">{{ message.sender === 'admin' ? (message.senderName || 'You') : thread.conversation.name }} · {{ when(message.createdAt) }}</p></div><p v-if="!thread.messages.length" class="py-12 text-center text-xs text-muted">No messages yet.</p></div>
        <div class="border-t border-line p-3"><div class="flex gap-2"><input v-model="draft" type="text" placeholder="Reply to the customer…" class="min-h-[44px] min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-xs" @keyup.enter="send"><button type="button" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-acid text-white disabled:opacity-50" :disabled="sending || !draft.trim()" aria-label="Send reply" @click="send"><Send class="h-4 w-4" /></button></div><p class="mt-2 text-[9px] text-muted">Your reply appears in the customer’s chat immediately.</p></div>
      </div>
      <div v-else class="card flex min-h-[560px] items-center justify-center text-center"><div><MessageCircle class="mx-auto h-8 w-8 text-muted" /><p class="mt-3 font-display text-lg font-bold">Select a conversation</p><p class="mt-1 text-xs text-muted">Replies are delivered to the customer chat widget.</p></div></div>
    </div>
  </div>
</template>
