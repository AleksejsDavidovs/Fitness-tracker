export const API_URL = "/api";

export async function apiRequest(endpoint, options = {}) {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        options
    );

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}