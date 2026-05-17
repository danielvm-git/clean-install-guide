<script setup lang="ts">
import { ref } from 'vue'
import { useChecklistStore } from '../stores/checklist'

const store = useChecklistStore()
const password = ref('')
const showPassword = ref(false)
const error = ref(false)
const shaking = ref(false)

const PASS = import.meta.env.VITE_ACCESS_PHRASE || 'daniel'

function submit() {
  if (!password.value) return
  if (password.value === PASS) {
    store.unlock()
  } else {
    error.value = true
    shaking.value = true
    setTimeout(() => { shaking.value = false }, 500)
  }
}

function onInput() {
  error.value = false
}
</script>

<template>
  <div class="gate">
    <div class="gate-card" :class="{ shake: shaking }">
      <div class="lock-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2"/>
          <path d="M8 11V8a4 4 0 1 1 8 0v3"/>
        </svg>
      </div>
      <div class="gate-eyebrow">authentication required</div>
      <h6 class="gate-title">clean install</h6>
      <p class="gate-desc">This is a personal reference. Enter the access phrase to unlock the checklist on this device — you'll only be asked once.</p>

      <div class="form-row">
        <label for="pw">access phrase</label>
        <div class="input-wrap" :class="{ 'is-error': error }">
          <span class="input-prompt" :class="{ 'is-error': error }">{{ error ? '!' : '$' }}</span>
          <input
            id="pw"
            :type="showPassword ? 'text' : 'password'"
            placeholder="enter phrase"
            v-model="password"
            @input="onInput"
            @keydown.enter="submit"
            autofocus
          />
          <button class="reveal-btn" type="button" @click="showPassword = !showPassword">
            {{ showPassword ? 'hide' : 'show' }}
          </button>
        </div>
        <div v-if="error" class="err-msg">access denied · check phrase and try again</div>
      </div>

      <button class="submit-btn" type="button" @click="submit" :disabled="!password">
        unlock
        <svg class="arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/>
          <path d="M13 5l7 7-7 7"/>
        </svg>
      </button>

      <div class="gate-foot">
        <span class="blink"></span>session pinned to this device
      </div>
    </div>
  </div>
</template>

<style scoped>
.gate {
  position: fixed;
  inset: 0;
  background: var(--bg-0);
  display: grid;
  place-items: center;
  z-index: 100;
}

.gate::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 30%, oklch(0.82 0.16 148 / 0.06), transparent 60%);
  pointer-events: none;
}

.gate-card {
  position: relative;
  width: min(420px, 90vw);
  background: var(--bg-1);
  border: 1px solid var(--fg-4);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: 0 30px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02) inset;
}

.gate-card.shake {
  animation: shake 0.45s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-4px); }
  30% { transform: translateX(4px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
  90% { transform: translateX(2px); }
}

.lock-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-faint);
  border: 1px solid var(--accent-line);
  display: grid;
  place-items: center;
  color: var(--accent);
  margin-bottom: 16px;
}

.gate-eyebrow {
  color: var(--accent);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.gate-title {
  color: var(--fg-0);
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.005em;
}

.gate-desc {
  color: var(--fg-2);
  font-size: 12.5px;
  line-height: 1.6;
  margin: 0 0 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-row label {
  color: var(--fg-2);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-2);
  border: 1px solid var(--fg-4);
  border-radius: var(--radius);
  transition: border-color 120ms, background 120ms, box-shadow 120ms;
}

.input-wrap:focus-within {
  border-color: var(--accent-line);
  background: var(--bg-3);
  box-shadow: 0 0 0 3px var(--accent-faint);
}

.input-wrap.is-error {
  border-color: oklch(0.72 0.18 25 / 0.7);
  box-shadow: 0 0 0 3px oklch(0.72 0.18 25 / 0.12);
}

.input-prompt {
  padding: 0 0 0 12px;
  color: var(--accent);
  user-select: none;
  font-weight: 500;
  font-size: 13px;
}

.input-prompt.is-error {
  color: oklch(0.76 0.14 25);
}

.input-wrap input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  padding: 10px 12px;
  color: var(--fg-0);
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: 0.15em;
}

.input-wrap input::placeholder {
  color: var(--fg-3);
  letter-spacing: 0;
}

.reveal-btn {
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--fg-3);
  padding: 0 12px;
  height: 100%;
  font-family: var(--mono);
  font-size: 11px;
  transition: color 120ms;
}

.reveal-btn:hover { color: var(--fg-1); }

.err-msg {
  color: oklch(0.76 0.14 25);
  font-size: 11.5px;
}

.submit-btn {
  width: 100%;
  background: var(--accent);
  color: var(--bg-0);
  border: 0;
  border-radius: var(--radius);
  padding: 10px 16px;
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: filter 120ms, transform 80ms;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover { filter: brightness(1.08); }
.submit-btn:active { transform: translateY(1px); }
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.submit-btn:disabled:hover { filter: none; }

.submit-btn .arrow { transition: transform 160ms; }
.submit-btn:hover .arrow { transform: translateX(2px); }

.gate-foot {
  text-align: center;
  color: var(--fg-3);
  font-size: 11px;
  margin-top: 16px;
  letter-spacing: 0.02em;
}

.blink {
  display: inline-block;
  width: 7px;
  height: 12px;
  background: var(--accent);
  vertical-align: -2px;
  margin-right: 4px;
  animation: blink 1.1s steps(2, end) infinite;
}

@keyframes blink { 50% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .gate-card.shake { animation: none; }
  .blink { animation: none; }
}
</style>
