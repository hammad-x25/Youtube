const API_ROOT = import.meta.env.VITE_API_URL || "/api/v1";

const getErrorMessage = (payload, fallback) =>
  payload?.message || payload?.errors?.[0]?.message || fallback;

export async function apiRequest(path, options = {}, retry = true) {
  const { body, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);
  const isFormData = body instanceof FormData;

  if (body && !isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    ...rest,
    headers: requestHeaders,
    credentials: "include",
    body: body && !isFormData && typeof body !== "string" ? JSON.stringify(body) : body,
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && retry && !path.includes("refreshaccesstoken")) {
    const refreshed = await apiRequest("/users/refreshaccesstoken", { method: "POST" }, false).catch(() => null);
    if (refreshed) return apiRequest(path, options, false);
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, `Request failed (${response.status})`));
  }

  return payload?.data ?? payload;
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: "POST", body }),
  patch: (path, body) => apiRequest(path, { method: "PATCH", body }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};
