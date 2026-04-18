const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown> | null
  ) {
    const message = body?.detail as string || body?.message as string || `API error ${status}`;
    super(message);
    this.name = 'ApiError';
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let body: Record<string, unknown> | null = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const apiClient = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, data: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) => api<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Dados inválidos. Verifique os campos e tente novamente.';
      case 401:
        return 'Sua sessão expirou. Por favor, faça login novamente.';
      case 403:
        return 'Você não tem permissão para realizar esta ação.';
      case 404:
        return 'O recurso solicitado não foi encontrado.';
      case 422:
        const fields = error.body?.errors as Array<{ field: string; message: string }>;
        if (fields?.length) {
          return fields.map(f => f.message).join('. ');
        }
        return 'Verifique os dados informados.';
      case 429:
        return 'Muitas requisições. Aguarde um momento e tente novamente.';
      case 500:
        return 'Erro no servidor. Tente novamente mais tarde.';
      case 502:
        return 'Serviço indisponível temporariamente.';
      default:
        return 'Ocorreu um erro. Tente novamente.';
    }
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }

  return 'Ocorreu um erro inesperado.';
}
