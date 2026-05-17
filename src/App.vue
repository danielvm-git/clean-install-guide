<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { marked } from 'marked'
import { guideMarkdown, sections } from './guide'
import { useChecklistStore } from './stores/checklist'
import PasswordGate from './components/PasswordGate.vue'

const store = useChecklistStore()

// ─── Checklist metadata built at parse time ───────────────────────────────────
const CHECK_SVG = `<svg class="cb-mark" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2l2.5 2.5L9.5 3.5"/></svg>`

interface CheckItem { id: string; sectionId: string }
const checkItems: CheckItem[] = []
const sectionItemMap: Record<string, string[]> = {}

let currentSectionId = ''
let taskItemIndex = 0

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function registerItem(id: string) {
  if (!sectionItemMap[currentSectionId]) sectionItemMap[currentSectionId] = []
  sectionItemMap[currentSectionId].push(id)
  checkItems.push({ id, sectionId: currentSectionId })
}

// ─── Custom marked renderer ───────────────────────────────────────────────────
const renderer = new marked.Renderer()

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const langClass = lang ? ` class="language-${lang}"` : ''
  return `<pre><button class="copy-btn" aria-label="Copiar código">copy</button><code${langClass}>${escaped}</code></pre>\n`
} as never

renderer.heading = function ({ text, depth }: { text: string; depth: number }) {
  const slug = slugify(text)

  if (depth === 2) {
    const match = text.match(/^Parte\s+(\d+)/i)
    if (match) {
      currentSectionId = `parte-${match[1]}`
    } else {
      currentSectionId = slug.startsWith('ordem') ? 'ordem-de-execucao' : slug
    }
    taskItemIndex = 0
    return `<h2 id="${currentSectionId}">${text}</h2>`
  }

  if (depth === 3) {
    const checkId = `h-${slug}`
    registerItem(checkId)
    return `<h3 id="${slug}"><span class="h-check" data-check-id="${checkId}"><span class="cb lg" data-cb="${checkId}">${CHECK_SVG}</span><span class="h-text">${text}</span></span></h3>`
  }

  return `<h${depth} id="${slug}">${text}</h${depth}>`
} as never

renderer.listitem = function (item: { text: string; task: boolean; checked: boolean; loose: boolean }) {
  if (item.task) {
    const checkId = `li-${currentSectionId}-${taskItemIndex++}`
    registerItem(checkId)
    const label = marked.parseInline(item.text) as string
    const doneClass = item.checked ? ' is-done' : ''
    const cbClass = item.checked ? ' checked' : ''
    return `<li class="cl-item${doneClass}" data-check-id="${checkId}"><span class="cb${cbClass}" data-cb="${checkId}">${CHECK_SVG}</span><span class="cl-label">${label}</span></li>\n`
  }
  return `<li>${item.text}</li>\n`
} as never

marked.setOptions({ renderer })
const htmlContent = marked(guideMarkdown) as string

// ─── Progress computeds ───────────────────────────────────────────────────────
const totalItems = checkItems.length

const doneItems = computed(() =>
  checkItems.filter(i => store.checked[i.id]).length
)

const pct = computed(() =>
  totalItems ? Math.round(doneItems.value / totalItems * 100) : 0
)

const allComplete = computed(() =>
  totalItems > 0 && doneItems.value === totalItems
)

const sectionProgress = computed(() => {
  const result: Record<string, { done: number; total: number }> = {}
  for (const section of sections) {
    const ids = sectionItemMap[section.id] || []
    result[section.id] = {
      done: ids.filter(id => store.checked[id]).length,
      total: ids.length,
    }
  }
  return result
})

// ─── Sidebar state ────────────────────────────────────────────────────────────
const activeSection = ref('')
const sidebarOpen = ref(false)

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
const closeSidebar = () => { sidebarOpen.value = false }

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSection.value = id
  }
  closeSidebar()
}

// ─── Checklist DOM interactivity ──────────────────────────────────────────────
function applyCheckedState() {
  for (const { id } of checkItems) {
    const isDone = !!store.checked[id]
    const cb = document.querySelector(`[data-cb="${id}"]`)
    const row = document.querySelector(`[data-check-id="${id}"]`)
    if (!cb || !row) continue
    cb.classList.toggle('checked', isDone)
    row.classList.toggle('is-done', isDone)
  }
}

function handleContentClick(e: MouseEvent) {
  const copyBtn = (e.target as Element).closest('.copy-btn')
  if (copyBtn) {
    const code = copyBtn.closest('pre')?.querySelector('code')
    if (code) {
      navigator.clipboard.writeText(code.textContent || '')
      copyBtn.textContent = '✓'
      copyBtn.classList.add('copied')
      setTimeout(() => {
        copyBtn.textContent = 'copy'
        copyBtn.classList.remove('copied')
      }, 1500)
    }
    return
  }

  const row = (e.target as Element).closest('[data-check-id]')
  if (!row) return
  const id = row.getAttribute('data-check-id')!
  store.toggle(id)
  const isDone = !!store.checked[id]
  row.querySelector('[data-cb]')?.classList.toggle('checked', isDone)
  row.classList.toggle('is-done', isDone)
}

// ─── Intersection observer ────────────────────────────────────────────────────
let observer: IntersectionObserver

function setupGuide() {
  applyCheckedState()

  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activeSection.value = entry.target.id
      })
    },
    { rootMargin: '-10% 0px -80% 0px' }
  )

  sections.forEach(({ id }) => {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  })
}

onMounted(async () => {
  if (store.unlocked) {
    await nextTick()
    setupGuide()
  }
})

watch(() => store.unlocked, async (unlocked) => {
  if (unlocked) {
    await nextTick()
    setupGuide()
  }
})

onUnmounted(() => { observer?.disconnect() })
</script>

<template>
  <PasswordGate v-if="!store.unlocked" />

  <template v-else>
    <button
      class="menu-toggle"
      @click="toggleSidebar"
      :aria-label="sidebarOpen ? 'Fechar menu' : 'Abrir menu'"
    >
      {{ sidebarOpen ? '✕' : '☰' }}
    </button>

    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="closeSidebar"
    />

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand">
        <span class="brand-dot"></span>
        <span class="brand-name">clean install</span>
      </div>

      <div class="sb-progress">
        <div class="sb-progress-row">
          <span class="sb-label">Progress</span>
          <span class="sb-count">
            {{ doneItems }}<span class="sb-of"> / {{ totalItems }}</span
            ><span v-if="allComplete" class="sb-done"> ✓ done</span
            ><span v-else class="sb-pct"> {{ pct }}%</span>
          </span>
        </div>
        <div class="sb-bar">
          <div class="sb-fill" :style="{ width: pct + '%' }"></div>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Seções do guia">
        <div v-for="section in sections" :key="section.id" class="nav-section">
          <a
            :href="`#${section.id}`"
            class="nav-link"
            :class="{ active: activeSection === section.id }"
            @click.prevent="scrollTo(section.id)"
          >
            <span class="nav-glyph">›</span>
            <span class="nav-label">{{ section.label.replace(/^Parte \d+ — /, '') }}</span>
            <span
              v-if="sectionProgress[section.id]?.total"
              class="nav-badge"
              :class="{
                'badge-done': sectionProgress[section.id].done === sectionProgress[section.id].total,
                'badge-zero': sectionProgress[section.id].done === 0,
              }"
            >
              <template v-if="sectionProgress[section.id].done === sectionProgress[section.id].total">✓</template>
              <template v-else>
                {{ sectionProgress[section.id].done }}<span class="badge-of">/{{ sectionProgress[section.id].total }}</span>
              </template>
            </span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <a href="https://danielvm.net" target="_blank" rel="noopener">danielvm.net</a>
        &nbsp;·&nbsp; {{ new Date().getFullYear() }}
      </div>
    </aside>

    <main class="main">
      <article
        class="guide-content"
        v-html="htmlContent"
        @click="handleContentClick"
      />
    </main>
  </template>
</template>
