<script setup lang="ts">
import { ArrowLeft, Bell, LifeBuoy, Maximize2, MessageCircle, Minus, RefreshCw, Send, X } from 'lucide-vue-next';
import { adminApi } from '~/api/adminApi';
import { useAdminAuthStore } from '~/stores/auth';
import { formatDate } from '~/utils/format';
definePageMeta({ layout: false });
useSeoMeta({ title: 'Support inbox', robots: 'noindex' });
const auth = useAdminAuthStore();
const toast = useAdminToast();
const conversations = ref<Record<string, any>[]>([]);
const selectedId = ref('');
const thread = ref<Record<string, any> | null>(null);
const draft = ref('');
const loading = ref(false);
const sending = ref(false);
const minimized = ref(false);
const previousUnread = ref(0);
const notificationsEnabled = ref(typeof Notification !== 'undefined' && Notification.permission === 'granted');
let timer: ReturnType<typeof setInterval> | null = null;
const unreadTotal = computed(() => conversations.value.reduce((sum, item) => sum + Number(item.unreadAdmin || 0), 0));
const openCount = computed(() => conversations.value.filter((item) => item.status === 'open').length);
const latestConversation = computed(() => conversations.value[0] || null);
async function load() {
  try {
    conversations.value = await adminApi.supportConversations();
    const unread = conversations.value.reduce((sum, item) => sum + Number(item.unreadAdmin || 0), 0);
    if (previousUnread.value > 0 && unread > previousUnread.value && notificationsEnabled.value && typeof Notification !== 'undefined') {
      const latest = conversations.value.find((item) => Number(item.unreadAdmin) > 0);
      new Notification('New Ojaly support message', { body: latest ? `${latest.name}: ${latest.lastMessage || 'New message'}` : 'A customer is waiting for a reply.', tag: 'ojaly-support' });
    }
    previousUnread.value = unread;
    if (typeof document !== 'undefined') document.title = unread ? `(${unread}) Support inbox · Ojaly Ops` : 'Support inbox · Ojaly Ops';
    if (!selectedId.value && conversations.value[0]) await open(conversations.value[0].id);
  } catch (error) { toast.error((error as Error).message); }
}
async function enableNotifications() {
  if (typeof Notification === 'undefined') { toast.error('This browser does not support notifications.'); return; }
  const permission = await Notification.requestPermission();
  notificationsEnabled.value = permission === 'granted';
  if (!notificationsEnabled.value) toast.info('Notifications were not enabled.');
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
async function closeConversation() {
  if (!thread.value) return;
  try { await adminApi.closeSupport(thread.value.conversation.id); toast.success('Conversation closed.'); await load(); }
  catch (error) { toast.error((error as Error).message); }
}
function when(value: string) { return new Date(value).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }); }
function minimize() { minimized.value = true; }
function restore() { minimized.value = false; }
async function refreshAll() { await load(); if (selectedId.value) { try { thread.value = await adminApi.supportThread(selectedId.value); } catch { /* keep current */ } } }
onMounted(async () => { await load(); timer = setInterval(() => { void refreshAll(); }, 10000); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-canvas">
    <header class="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-5">
      <AdminLogo />
      <span class="hidden rounded-full bg-acid/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-acid sm:inline">Support console</span>
      <div class="min-w-0 flex-1"><p class="truncate text-sm font-bold">Support inbox</p><p class="text-[10px] text-muted">{{ openCount }} open · {{ unreadTotal }} unread</p></div>
      <button v-if="!notificationsEnabled" type="button" class="flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[10px] font-bold text-muted hover:bg-raised" @click="enableNotifications"><Bell class="h-3.5 w-3.5" /> <span class="hidden sm:inline">Alerts</span></button><AdminButton variant="outline" size="sm" :loading="loading" @click="load"><RefreshCw class="h-3.5 w-3.5" /> <span class="hidden sm:inline">Refresh</span></AdminButton>
      <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:bg-raised" aria-label="Minimize support inbox" @click="minimize"><Minus class="h-4 w-4" /></button>
      <NuxtLink to="/" class="flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[10px] font-bold text-muted hover:bg-raised"><ArrowLeft class="h-3.5 w-3.5" /> <span class="hidden sm:inline">Admin</span></NuxtLink>
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">{{ auth.user?.name?.slice(0, 2).toUpperCase() }}</div>
    </header>

    <main v-if="!minimized" class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[360px_1fr]">
      <section class="flex min-h-0 flex-col border-r border-line bg-surface">
        <div class="flex h-12 shrink-0 items-center justify-between border-b border-line px-4"><p class="text-xs font-bold">Conversations</p><span class="text-[10px] text-muted">{{ conversations.length }}</span></div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <button v-for="item in conversations" :key="item.id" type="button" class="w-full border-b border-line p-4 text-left transition hover:bg-raised/50" :class="selectedId === item.id ? 'bg-raised/70' : ''" @click="open(item.id)">
            <div class="flex items-start justify-between gap-2"><div class="min-w-0"><p class="truncate text-xs font-bold">{{ item.name }}</p><p class="mt-0.5 truncate text-[10px] text-muted">{{ item.email }} · {{ item.phone }}</p></div><span v-if="item.unreadAdmin" class="flex h-5 min-w-5 items-center justify-center rounded-full bg-acid px-1 text-[9px] font-bold text-white">{{ item.unreadAdmin }}</span></div>
            <p class="mt-2 line-clamp-1 text-[10px] text-muted">{{ item.lastSender === 'admin' ? 'You: ' : '' }}{{ item.lastMessage || 'No messages yet' }}</p>
            <div class="mt-1 flex items-center justify-between text-[9px] text-muted"><span>{{ formatDate(item.createdAt, true) }}</span><span class="rounded-full px-1.5 py-0.5 font-bold" :class="item.status === 'open' ? 'bg-success/10 text-success' : 'bg-raised'">{{ item.status }}</span></div>
          </button>
          <div v-if="!conversations.length" class="flex h-full flex-col items-center justify-center p-8 text-center"><LifeBuoy class="h-8 w-8 text-muted" /><p class="mt-3 text-sm font-bold">No conversations yet</p><p class="mt-1 max-w-[220px] text-[11px] leading-relaxed text-muted">Chats started from the landing page will appear here.</p></div>
        </div>
      </section>

      <section class="flex min-h-0 flex-col bg-canvas">
        <template v-if="thread">
          <div class="flex h-16 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 sm:px-5">
            <div class="min-w-0"><p class="truncate text-sm font-bold">{{ thread.conversation.name }}</p><p class="mt-0.5 truncate text-[10px] text-muted">{{ thread.conversation.email }} · {{ thread.conversation.phone }}</p></div>
            <div class="flex gap-2"><a :href="`mailto:${thread.conversation.email}`" class="rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-bold">Email</a><button type="button" class="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-bold text-danger" @click="closeConversation"><X class="h-3 w-3" /> Close</button></div>
          </div>
          <div class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-8">
            <div class="mx-auto max-w-3xl space-y-3">
              <div v-for="message in thread.messages" :key="message.id" class="max-w-[85%]"><div class="rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed" :class="message.sender === 'admin' ? 'ml-auto bg-ink text-white' : 'border border-line bg-surface text-ink shadow-sm'">{{ message.body }}</div><p class="mt-1 text-[9px] text-muted" :class="message.sender === 'admin' ? 'text-right' : ''">{{ message.sender === 'admin' ? (message.senderName || 'You') : thread.conversation.name }} · {{ when(message.createdAt) }}</p></div>
              <p v-if="!thread.messages.length" class="py-16 text-center text-xs text-muted">No messages yet. Send the first reply.</p>
            </div>
          </div>
          <div class="shrink-0 border-t border-line bg-surface p-3 sm:p-4"><div class="mx-auto flex max-w-3xl gap-2"><input v-model="draft" type="text" placeholder="Reply to the customer…" class="min-h-[46px] min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 text-xs" @keyup.enter="send"><button type="button" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-acid text-white disabled:opacity-50" :disabled="sending || !draft.trim()" aria-label="Send reply" @click="send"><Send class="h-4 w-4" /></button></div><p class="mt-2 text-center text-[9px] text-muted">Replies appear in the customer’s website chat immediately.</p></div>
        </template>
        <div v-else class="flex flex-1 flex-col items-center justify-center p-8 text-center"><MessageCircle class="h-10 w-10 text-muted" /><p class="mt-4 font-display text-xl font-bold">Select a conversation</p><p class="mt-1 text-xs text-muted">Select a customer on the left to reply.</p></div>
      </section>
    </main>

    <button v-else type="button" class="fixed bottom-4 right-4 flex w-[min(360px,calc(100vw-32px))] items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-2xl" @click="restore">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-acid text-white"><LifeBuoy class="h-5 w-5" /></div>
      <div class="min-w-0 flex-1"><p class="text-xs font-bold">Support inbox</p><p class="mt-0.5 truncate text-[10px] text-muted">{{ unreadTotal ? `${unreadTotal} unread` : 'No unread messages' }}<span v-if="latestConversation"> · {{ latestConversation.name }}</span></p></div>
      <Maximize2 class="h-4 w-4 text-muted" />
    </button>
  </div>
</template>
