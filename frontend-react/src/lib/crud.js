import { requestJson } from '@/lib/api'

export async function fetchPaged(endpoint, { page = 1, pageSize = 25, q = '' } = {}) {
  return requestJson({
    method: 'GET',
    url: endpoint,
    params: {
      paged: '1',
      page,
      page_size: pageSize,
      q,
    },
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
