

import React from 'react';
import type { DetailedForecast } from './ForecastView'; // Import the new type

// FIX: Hoisted FORECAST_DAYS constant to prevent a ReferenceError.
const FORECAST_DAYS = 60;

interface ExplanationPanelProps {
  forecastData: DetailedForecast[];
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ forecastData }) => {
    const analysis = React.useMemo(() => {
        const insights: { name: string; trend: string; stockoutDay?: number }[] = [];

        forecastData.forEach(warehouseForecast => {
            warehouseForecast.itemForecasts.forEach(itemForecast => {
                if (!itemForecast.data || itemForecast.data.length === 0) {
                    insights.push({
                        name: `${warehouseForecast.warehouseName} - ${itemForecast.itemName}`,
                        trend: 'stable',
                        stockoutDay: undefined,
                    });
                    return;
                }
                const initialInventory = itemForecast.data[0].inventory;
                const finalInventory = itemForecast.data[itemForecast.data.length - 1].inventory;
                const trend = finalInventory > initialInventory ? 'increasing' : finalInventory < initialInventory ? 'decreasing' : 'stable';
                
                const stockout = itemForecast.data.find(d => d.inventory === 0);

                insights.push({
                    name: `${warehouseForecast.warehouseName} - ${itemForecast.itemName}`,
                    trend,
                    stockoutDay: stockout ? stockout.day : undefined,
                });
            });
        });

        const stockoutRisks = insights.filter(i => i.stockoutDay !== undefined);
        const decreasingTrends = insights.filter(i => i.trend === 'decreasing' && i.stockoutDay === undefined);
        const stableOrIncreasing = insights.filter(i => i.trend !== 'decreasing');

        return { stockoutRisks, decreasingTrends, stableOrIncreasing };

    }, [forecastData]);

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Automated Analysis</h3>
            <div className="space-y-4 text-sm">
                {analysis.stockoutRisks.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-rose-600 flex items-center gap-2"> 
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            Critical Stockout Risk
                        </h4>
                        <ul className="list-disc list-inside text-slate-600 mt-1 pl-2">
                            {analysis.stockoutRisks.map(risk => (
                                <li key={risk.name}>
                                    <strong>{risk.name}:</strong> Projected to stock out in approximately <strong>{risk.stockoutDay} days</strong>.
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                 {analysis.decreasingTrends.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-amber-600 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.001-1.742 3.001H4.42c-1.522 0-2.492-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            Decreasing Inventory
                        </h4>
                         <ul className="list-disc list-inside text-slate-600 mt-1 pl-2">
                            {analysis.decreasingTrends.map(item => (
                                <li key={item.name}>
                                    <strong>{item.name}:</strong> Levels are trending downwards but no stockout is predicted within {FORECAST_DAYS} days.
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {analysis.stableOrIncreasing.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-emerald-600 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Healthy Inventory Levels
                        </h4>
                         <ul className="list-disc list-inside text-slate-600 mt-1 pl-2">
                           {analysis.stableOrIncreasing.map(item => (
                                <li key={item.name}>
                                    <strong>{item.name}:</strong> Inventory trend is currently <strong>{item.trend}</strong>.
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplanationPanel;