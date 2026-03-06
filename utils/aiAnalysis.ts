
import { GoogleGenAI } from "@google/genai";
import type { Company } from '../types';

/**
 * Summarizes company data for the AI prompt.
 */
function summarizeCompanyData(company: Company): string {
    const { data } = company;
    const summaryParts: string[] = [];

    summaryParts.push(`- Company Name: ${company.name}`);
    summaryParts.push(`- Suppliers: ${data.suppliers.length}`);
    summaryParts.push(`- Warehouses: ${data.warehouses.length}`);
    summaryParts.push(`- Customers: ${data.customers.length}`);

    // FIX: Property 'demand' now exists on type 'Customer'.
    const totalDemand = data.customers.reduce((sum, c) => sum + c.demand, 0);
    summaryParts.push(`- Total Daily Demand: ${totalDemand.toLocaleString()} units`);

    // FIX: Property 'inventoryLevel' now exists on type 'Warehouse'.
    const totalInventory = data.warehouses.reduce((sum, w) => sum + w.inventoryLevel, 0);
    summaryParts.push(`- Total Inventory: ${totalInventory.toLocaleString()} units`);

    // FIX: Property 'averageDelayHours' now exists on type 'Supplier'.
    const highDelaySuppliers = data.suppliers.filter(s => s.averageDelayHours > 5);
    if (highDelaySuppliers.length > 0) {
        summaryParts.push(`- High-Delay Suppliers: ${highDelaySuppliers.map(s => `${s.name} (${s.averageDelayHours}hrs)`).join(', ')}`);
    }

    const lowInventoryWarehouses = data.warehouses.filter(w => {
        const demand = data.connections
            .filter(c => c.from === w.id)
             // FIX: Property 'demand' now exists on type 'Customer'.
            .reduce((sum, c) => sum + (data.customers.find(cust => cust.id === c.to)?.demand || 0), 0);
        if (demand === 0) return false;
        // FIX: Property 'inventoryLevel' now exists on type 'Warehouse'.
        const coverage = w.inventoryLevel / demand;
        return coverage < 7; // Less than 7 days of coverage
    });

    if (lowInventoryWarehouses.length > 0) {
        summaryParts.push(`- Low Inventory Warehouses (less than 7 days coverage): ${lowInventoryWarehouses.map(w => w.name).join(', ')}`);
    }

    return summaryParts.join('\n');
}

/**
 * Takes a company object and uses Gemini to generate a descriptive summary.
 */
export async function getAIAnalysisForCompany(company: Company, apiKey: string | null): Promise<string> {
    if (!apiKey) {
        console.warn("API key not provided. Skipping AI analysis.");
        return company.description || "A new supply chain network ready for configuration.";
    }
    const ai = new GoogleGenAI({ apiKey });

    const dataSummary = summarizeCompanyData(company);

    const systemInstruction = `You are a world-class supply chain analyst. Your task is to provide a concise, one-sentence analysis summary for a dashboard card based on the provided data. This summary should highlight the single most important strength, risk, or characteristic of the network. Be insightful and brief.
    
    Example Output: "A robust network, but exposed to risk due to a single high-delay supplier in its critical path."
    Example Output: "A well-balanced network with strong inventory coverage across all major distribution hubs."
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Here is the data summary:\n${dataSummary}`,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        const analysis = response.text?.trim();
        // Basic validation to ensure it's not empty or an error message
        if (analysis && analysis.length > 10) {
            return analysis;
        } else {
            // Fallback to original description if AI response is poor
            return company.description;
        }

    } catch (error) {
        console.error("Error getting AI analysis:", error);
        // Fallback to original description on error
        return "AI analysis failed. Please check your API key and network connection.";
    }
}