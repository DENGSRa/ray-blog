export async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || '操作失败，请稍后重试。');
  }

  return response.status === 204 ? null : response.json();
}

export function toDate(value = '') {
  return value.replaceAll('/', '-');
}

export function toDateDisplay(value = '') {
  return value.replaceAll('-', '/');
}
