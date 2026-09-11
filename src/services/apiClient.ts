export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    credentials: 'include', // actually we can omit it, but let's be safe. Wait, 'same-origin' is default.
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'Error en la petición';
    try {
      const errorData = await response.json();
      message = errorData.error || message;
    } catch (e) {}
    throw new ApiError(response.status, message);
  }

  return response.json();
}

export const api = {
  get: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body: any, options?: RequestInit) => request<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any, options?: RequestInit) => request<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: 'DELETE' }),
};
