import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'ci.checked'
const UNLOCKED_KEY = 'ci.unlocked'

export const useChecklistStore = defineStore('checklist', () => {
  const checked = ref<Record<string, boolean>>(
    JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  )

  const unlocked = ref(localStorage.getItem(UNLOCKED_KEY) === '1')

  const doneCount = computed(() => Object.values(checked.value).filter(Boolean).length)

  function toggle(id: string) {
    checked.value[id] = !checked.value[id]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked.value))
  }

  function unlock() {
    unlocked.value = true
    localStorage.setItem(UNLOCKED_KEY, '1')
  }

  return { checked, unlocked, doneCount, toggle, unlock }
})
