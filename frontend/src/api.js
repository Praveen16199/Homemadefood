const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem("ss_admin_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(errorPayload.message || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
