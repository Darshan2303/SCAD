
import { GoogleGenAI, Type } from "@google/genai";
import type { Company, AIAnalysisResult } from '../types';

/**
 * Creates a detailed summary of the company's data for the AI prompt.
 */
function createDetailedDataSummary(company: Company): string {
    const { data } = company;
    const summary: string[] = [];

    summary.push('## Overall Network Health');
    summary.push(`- Resilience Score: ${data.resilienceScore}/100`);
    summary.push(`- OTIF: ${data.networkMetrics.otif.value.toFixed(1)}% (Target: ${data.networkMetrics.otif.target}%)`);
    summary.push(`- Cost per Order: ${data.networkMetrics.costPerOrder.value.toFixed(2)} (Target: ${data.networkMetrics.costPerOrder.target})`);
    
    summary.push('\n## Suppliers');
    data.suppliers.forEach(s => {
        summary.push(`- ${s.name}: Capacity=${s.supplyCapacity}/day, Avg. Delay=${s.averageDelayHours}hrs, Resilience=${s.resilienceScore}`);
    });

    summary.push('\n## Warehouses');
    data.warehouses.forEach(w => {
        summary.push(`- ${w.name}: Inventory=${w.inventoryLevel}, Resilience=${w.resilienceScore}, OTIF=${w.metrics.otif.value}%, Dispatched (24h)=${w.dispatchedLast24h}`);
        summary.push(`  - Workforce: ${w.workforce.active} active, ${w.workforce.onTrack}% on track`);
        summary.push(`  - Efficiency: ${w.efficiency.picksPerHour} picks/hr, ${w.efficiency.errorRate}% error rate`);
    });

    summary.push('\n## Customers');
    const totalDemand = data.customers.reduce((sum, customer) => sum + customer.demand, 0);
    summary.push(`- Total Customers: ${data.customers.length}`);
    summary.push(`- Total Daily Demand: ${totalDemand}`);
    
    summary.push('\n## Connections');
    data.connections.forEach(c => {
        const from = data.suppliers.find(s => s.id === c.from)?.name || data.warehouses.find(w => w.id === c.from)?.name;
        // FIX: Renamed the parameter in the find function from 'c' to 'customer' to avoid a variable shadowing conflict with the 'c' from the outer forEach loop, which caused a compilation error.
        const to = data.warehouses.find(w => w.id === c.to)?.name || data.customers.find(customer => customer.id === c.to)?.name;
        summary.push(`- ${from} -> ${to}: Transit Time=${c.transitTime}hrs, Capacity=${c.capacity}, Utilization=${((c.utilization || 0) * 100).toFixed(0)}%`);
    });

    return summary.join('\n');
}


/**
 * Calls the Gemini API to get a strategic analysis of the supply chain.
 */
export async function getStrategicAIAnalysis(company: Company, apiKey: string): Promise<AIAnalysisResult> {
    const ai = new GoogleGenAI({ apiKey });
    const dataSummary = createDetailedDataSummary(company);
    
    const systemInstruction = `You are a world-class supply chain consultant. Your task is to analyze the provided data for a supply chain network. 
    Identify the top 3 most critical risks and provide the top 3 most actionable recommendations for improvement. 
    Your analysis should be insightful, strategic, and directly based on the data provided.
    Structure your response *only* in JSON format according to the provided schema. Do not include any markdown formatting like \`\`\`json.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            risks: {
                type: Type.ARRAY,
                description: "A list of the top 3 most critical risks identified in the supply chain.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A short, descriptive title for the risk." },
                        description: { type: Type.STRING, description: "A 1-2 sentence explanation of the risk and its potential impact." },
                        severity: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "The severity level of the risk." }
                    },
                    required: ["title", "description", "severity"]
                }
            },
            recommendations: {
                type: Type.ARRAY,
                description: "A list of the top 3 most actionable recommendations for improvement.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A short, descriptive title for the recommendation." },
                        description: { type: Type.STRING, description: "A 1-2 sentence explanation of the recommendation and its expected benefit." },
                        impact: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "The potential impact of implementing this recommendation." }
                    },
                    required: ["title", "description", "impact"]
                }
            }
        },
        required: ["risks", "recommendations"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze the following supply chain data:\n\n${dataSummary}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("AI returned an empty response.");
        }
        
        const result = JSON.parse(jsonText);

        // Basic validation of the parsed structure
        if (!result.risks || !result.recommendations || !Array.isArray(result.risks) || !Array.isArray(result.recommendations)) {
            throw new Error("AI response did not match the expected format.");
        }

        return result as AIAnalysisResult;

    } catch (error: any) {
        console.error("Error during strategic AI analysis:", error);
        if (error.message.includes('API key not valid')) {
            throw new Error("Invalid API Key. Please check the key in the settings and try again.");
        }
        throw new Error("Failed to get a valid analysis from the AI model.");
    }
}