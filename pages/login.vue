<script setup lang="ts">
import { ArrowRight, BadgeCheck, LockKeyhole, ShieldCheck, TrendingUp } from 'lucide-vue-next';
definePageMeta({ layout: false });
useSeoMeta({ title: 'Platform sign in', robots: 'noindex' });
const auth = useAdminAuthStore();
const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);
async function submit() {
  error.value = '';
  if (!email.value || !password.value) { error.value = 'Enter your email and password.'; return; }
  submitting.value = true;
  try { await auth.login(email.value, password.value); await router.push('/'); }
  catch (err) { error.value = (err as Error).message; }
  finally { submitting.value = false; }
}
</script>

<template>
  <div class="light grid min-h-dvh overflow-x-hidden bg-[#FBF7EF] text-forest-900 lg:grid-cols-[0.95fr_1.05fr]">
    <div class="relative flex min-h-dvh min-w-0 flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
      <header class="flex items-center justify-between gap-3">
        <AdminLogo />
        <span class="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600"><span class="h-1.5 w-1.5 rounded-full bg-brand-500" /> Internal only</span>
      </header>

      <main class="my-auto w-full max-w-[420px] py-10">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Ojaly control room</p>
        <h1 class="mt-3 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-bold leading-[0.95] tracking-[-0.055em]">Run the network.<br><span class="text-brand-600">Protect the trust.</span></h1>
        <p class="mt-4 text-sm leading-relaxed text-muted">Sign in to manage providers, marketplace GMV, bookings, payouts and platform health. Every action you take is recorded in the audit log.</p>

        <form class="mt-7 rounded-2xl border border-line bg-white p-5 shadow-[0_18px_50px_-30px_rgba(6,35,26,0.35)] sm:p-6" @submit.prevent="submit">
          <div class="space-y-3.5">
            <AdminInput v-model="email" label="Work email" type="email" placeholder="you@ojaly.org" autocomplete="username" />
            <AdminInput v-model="password" label="Password" type="password" placeholder="Enter your password" autocomplete="current-password" />
          </div>
          <div v-if="error" class="mt-3 rounded-lg border border-danger/20 bg-danger/5 p-2.5 text-[11px] font-medium text-danger" role="alert">{{ error }}</div>
          <AdminButton type="submit" block :loading="submitting" class="mt-4">Enter control room <ArrowRight class="h-3.5 w-3.5" /></AdminButton>
          <p class="mt-3 text-center text-[10px] leading-relaxed text-muted">Ojaly staff only. Need access? Ask a super admin to invite you.</p>
        </form>

        <div class="mt-5 flex items-start gap-2 rounded-xl border border-line bg-white/60 p-3 text-[10px] leading-relaxed text-muted">
          <LockKeyhole class="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
          <span><strong class="text-ink">Support accounts are read-only.</strong> Super admins can change plans, trials, users and payouts. Sessions expire automatically.</span>
        </div>
      </main>

      <footer class="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[9px] text-muted">
        <p class="inline-flex items-center gap-1"><ShieldCheck class="h-3 w-3" /> Ojaly internal systems · not indexed</p>
        <p>Lagos · Nigeria</p>
      </footer>
    </div>

    <aside class="relative hidden min-h-dvh overflow-hidden bg-forest-900 lg:block">
      <img src="/images/auth/admin-login.webp" alt="A local service business at work" class="absolute inset-0 h-full w-full object-cover" style="object-position: center 34%">
      <div class="absolute inset-0 bg-gradient-to-b from-forest-900/30 via-forest-900/45 to-forest-900/95" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,90,31,0.22),transparent_45%)]" />
      <div class="relative flex h-full min-h-dvh flex-col justify-between p-10 text-white">
        <div class="flex justify-end"><span class="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">Restricted access</span></div>
        <div class="max-w-lg">
          <span class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/80"><BadgeCheck class="h-3 w-3 text-brand-300" /> Verified local economy</span>
          <blockquote class="mt-5 font-display text-[clamp(2rem,3.5vw,3.1rem)] font-bold leading-[1.02] tracking-[-0.045em]">“The marketplace is only as good as the records behind it.”</blockquote>
          <p class="mt-4 max-w-md text-xs leading-relaxed text-white/65">Every verified provider, booking, deposit, receipt and payout makes the network more useful — and more trustworthy.</p>
          <div class="mt-8 grid grid-cols-3 gap-2">
            <div class="rounded-xl border border-white/10 bg-white/5 p-3"><TrendingUp class="h-4 w-4 text-brand-300" /><p class="mt-2 font-display text-lg font-bold">GMV</p><p class="text-[9px] uppercase tracking-wider text-white/45">Tracked per campus</p></div>
            <div class="rounded-xl border border-white/10 bg-white/5 p-3"><BadgeCheck class="h-4 w-4 text-brand-300" /><p class="mt-2 font-display text-lg font-bold">Verified</p><p class="text-[9px] uppercase tracking-wider text-white/45">Supply you can trust</p></div>
            <div class="rounded-xl border border-white/10 bg-white/5 p-3"><ShieldCheck class="h-4 w-4 text-brand-300" /><p class="mt-2 font-display text-lg font-bold">Audited</p><p class="text-[9px] uppercase tracking-wider text-white/45">Every action logged</p></div>
          </div>
        </div>
        <p class="text-[9px] uppercase tracking-[0.16em] text-white/35">Ojaly Ops · control room · Lagos</p>
      </div>
    </aside>
  </div>
</template>
