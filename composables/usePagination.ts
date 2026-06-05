export function usePagination() {
  const page = ref(1)
  const perPage = ref(20)

  function resetPage() {
    page.value = 1
  }

  function setPage(p: number) {
    page.value = p
  }

  return { page, perPage, resetPage, setPage }
}
