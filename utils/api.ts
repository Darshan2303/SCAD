
import type { Company } from '../types';

// This base URL points to the same host and port as the frontend.
// This is because the backend API is now running *inside* the Vite development server
// as a middleware, creating a true single-server, single-port experience.
const BASE_URL = '/api';

/**
 * Fetches the entire dataset of companies from the backend.
 * Returns an empty array on failure to prevent the app from crashing.
 */
export async function getCompanies(): Promise<Company[]> {
    try {
        const response = await fetch(`${BASE_URL}/companies`, {
            headers: {
                'ngrok-skip-browser-warning': 'true',
            },
        });
        if (!response.ok) {
            // Log a more informative warning instead of an error, since we have a fallback.
            console.warn(`[API Fallback] Could not fetch companies from the backend (status: ${response.status} ${response.statusText}). The application will proceed with local or mock data. This is expected if the backend server is not running.`);
            return [];
        }
        const data = await response.json();
        console.log("[API] Successfully fetched companies from backend.");
        return data;
    } catch (error) {
        // This catches network errors, server down, etc.
        console.warn(`[API Fallback] Network error while fetching companies. The application will proceed with local or mock data. This is expected if the backend server is not running. Details:`, error);
        return [];
    }
}