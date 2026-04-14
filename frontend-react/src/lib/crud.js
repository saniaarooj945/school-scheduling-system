import { requestJson } from '@/lib/api'

export async function fetchPaged(endpoint, { page = 1, pageSize = 25, q = '' } = {}) {
  const normalizedQuery = String(q ?? '').trim()
  const params = {
    paged: '1',
    page: Number(page) || 1,
    page_size: Number(pageSize) || 25,
  }
  if (normalizedQuery) {
    params.q = normalizedQuery
  }

  return requestJson({
    method: 'GET',
    url: endpoint,
    params,
  })
}

export async function fetchList(endpoint, params) {
  return requestJson({ method: 'GET', url: endpoint, params })
}

export async function createItem(endpoint, payload) {
  return requestJson({ method: 'POST', url: endpoint, data: payload })
}

export async function updateItem(endpoint, payload) {
  return requestJson({ method: 'PUT', url: endpoint, data: payload })
}

export async function deleteItem(endpoint, id) {
  return requestJson({ method: 'DELETE', url: endpoint, data: { id } })
}
