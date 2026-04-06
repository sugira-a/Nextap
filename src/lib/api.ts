type ApiErrorPayload = {
  error?: string;
  message?: string;
  missing?: string[];
};

const BACKEND_ROUTE_PREFIX = import.meta.env.VITE_BACKEND_ROUTE_PREFIX || "/_/backend";

function isLocalDevelopmentHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function buildRequestCandidates(path: string): string[] {
  const candidates = [path];
  const isApiPath = path.startsWith("/api") || path.startsWith("/health");

  if (!isApiPath || typeof window === "undefined") {
    return candidates;
  }

  const { protocol, hostname, port } = window.location;
  const sameOriginBackend = `${protocol}//${hostname}${port ? `:${port}` : ""}${BACKEND_ROUTE_PREFIX}${path}`;

  const unique = new Set<string>([path]);

  unique.add(sameOriginBackend);

  if (isLocalDevelopmentHost(hostname)) {
    unique.add(`http://localhost:5000${path}`);
    unique.add(`http://127.0.0.1:5000${path}`);
  }

  return Array.from(unique);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const defaultHeaders: HeadersInit = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  const requestCandidates = buildRequestCandidates(path);
  let lastError: Error | null = null;

  for (let index = 0; index < requestCandidates.length; index += 1) {
    const target = requestCandidates[index];

    try {
      const response = await fetch(target, {
        ...init,
        headers: {
          ...defaultHeaders,
          ...(init.headers || {}),
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? ((await response.json()) as T & ApiErrorPayload)
        : (await response.text());

      if (!response.ok) {
        const errorMessage =
          typeof payload === "string"
            ? payload
            : payload.error || payload.message || "Request failed";

        // If same-origin endpoint returns Not Found, try backend origin fallback.
        if (response.status === 404 && index < requestCandidates.length - 1) {
          lastError = new Error(errorMessage || "Not Found");
          continue;
        }

        throw new Error(errorMessage);
      }

      return payload as T;
    } catch (error) {
      if (index < requestCandidates.length - 1) {
        lastError = error instanceof Error ? error : new Error("Request failed");
        continue;
      }

      throw (error instanceof Error ? error : new Error("Request failed"));
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Request failed");
}

export function isNotFoundApiError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("method not allowed") ||
    message.includes("failed to fetch")
  );
}

export async function apiRequestWithFallback<T>(requests: Array<() => Promise<T>>): Promise<T> {
  let fallbackError: unknown = null;

  for (const request of requests) {
    try {
      return await request();
    } catch (error) {
      if (isNotFoundApiError(error)) {
        fallbackError = error;
        continue;
      }
      throw error;
    }
  }

  if (fallbackError instanceof Error) {
    throw fallbackError;
  }

  throw new Error("Not Found");
}

export function storeAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function clearAuthTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}