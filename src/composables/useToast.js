import { ref } from 'vue'

const toastText = ref('')
let timer = null

export function useToast() {
  function show(message) {
    toastText.value = message
    clearTimeout(timer)
    timer = setTimeout(() => (toastText.value = ''), 2200)
  }
  return { toastText, show }
}
