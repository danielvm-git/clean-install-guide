<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import { guideMarkdown, sections } from './guide'

// Configure marked to add IDs to headings
const renderer = new marked.Renderer()
renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
  const id = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  return `<h${depth} id="${id}">${text}</h${depth}>`
}

marked.setOptions({ renderer })

const htmlContent = marked(guideMarkdown) as string

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

let observer: IntersectionObserver

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      })
    },
    { rootMargin: '-10% 0px -80% 0px' }
  )

  sections.forEach(({ id }) => {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  })
})

onUnmounted(() => { observer?.disconnect() })
</script>

<template>
  <button class="menu-toggle" @click="toggleSidebar" :aria-label="sidebarOpen ? 'Fechar menu' : 'Abrir menu'">
    {{ sidebarOpen ? '✕' : '☰' }}
  </button>

  <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar" style="position:fixed;inset:0;z-index:9;background:rgba(0,0,0,0.5)" />

  <aside class="sidebar" :class="{ open: sidebarOpen }">
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <span>~</span>/clean-install-guide
      </div>
      <div class="sidebar-title">iMac · Vite · Dev Environment</div>
    </div>

    <nav class="sidebar-nav" aria-label="Seções do guia">
      <div v-for="section in sections" :key="section.id" class="nav-section">
        <a
          :href="`#${section.id}`"
          class="nav-link"
          :class="{ active: activeSection === section.id }"
          @click.prevent="scrollTo(section.id)"
        >
          <span class="num">{{ section.num }}</span>{{ section.label.replace(/^Parte \d+ — /, '') }}
        </a>
      </div>
    </nav>

    <div class="sidebar-footer">
      <a href="https://danielvm.net" target="_blank" rel="noopener">danielvm.net</a>
      &nbsp;·&nbsp; {{ new Date().getFullYear() }}
    </div>
  </aside>

  <main class="main">
    <article class="guide-content" v-html="htmlContent" />
  </main>
</template>
