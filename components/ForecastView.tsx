
import React, { useMemo } from 'react';
import type { Company } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import ExplanationPanel from './ExplanationPanel';
import EarlyWarningSignals from './EarlyWarningSignals';
import SupplierCapacityForecast from './SupplierCapacityForecast';
// FIX: Imported the new utility function for item-level inventory forecasting.
import { calculateItemInventoryForecast } from '../utils/metricCalculations';

interface ForecastViewProps {
  company: Company;
}

const FORECAST_DAYS = 60;

// A more detailed forecast data structure
export interface DetailedForecast {
    warehouseId: string;
    warehouseName: string;
    itemForecasts: {
        itemName: string;
        data: { day: number; inventory: number }[];
    }[];
    // For recharts
    chartData: { day: number, [itemName: string]: number }[];
    itemNames: string[];
}

const ForecastView: React.FC<ForecastViewProps> = ({ company }) => {
  const forecastData: DetailedForecast[] = useMemo(() => {
    return company.data.warehouses.map(warehouse => {
        
        const itemForecasts = warehouse.storage.map(storageItem => {
            const itemName = storageItem.itemName;
            // Use the new centralized forecasting function
            const data = calculateItemInventoryForecast(company, warehouse, storageItem, FORECAST_DAYS);
            return { itemName, data };
        });

        const chartData: { day: number, [itemName: string]: number }[] = [];
        for (let i = 0; i <= FORECAST_DAYS; i++) {
            const dataPoint: { day: number, [itemName: string]: number } = { day: i };
            itemForecasts.forEach(forecast => {
                dataPoint[forecast.itemName] = forecast.data[i]?.inventory ?? 0;
            });
            chartData.push(dataPoint);
        }

        return {
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            itemForecasts,
            chartData,
            itemNames: itemForecasts.map(f => f.itemName),
        };
    });
  }, [company]);

  // Updated pastel color palette for lines
  const itemColors = ['#4ade80', '#fcd34d', '#93c5fd', '#a78bfa', '#fda4af', '#f87171'];

  return (
    <div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Analytics & Forecasts</h3> 
        <p className="text-slate-600 mb-6 max-w-3xl"> 
            Proactively identify risks with early warning signals and simulate future inventory levels for each item based on current data.
            Adjust parameters in the 'Live Controls' tab to see the impact here.
        </p>

        <EarlyWarningSignals company={company} forecastData={forecastData} />
        
        <ExplanationPanel forecastData={forecastData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {forecastData.map((forecast) => (
                <div key={forecast.warehouseId} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-[450px] flex flex-col"> 
                    <h4 className="font-bold text-slate-700 mb-4 tracking-tight">{forecast.warehouseName} Item-Level Forecast</h4>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecast.chartData} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /> 
                                <XAxis dataKey="day" label={{ value: 'Days from Today', position: 'insideBottom', offset: -15, fill: '#64748b' }} /> 
                                <YAxis 
                                    tickFormatter={(value) => `${(value as number) / 1000}k`}
                                />
                                <Tooltip formatter={(value) => `${(value as number).toLocaleString()} units`} cursor={{strokeDasharray: '3 3'}}/>
                                <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}}/>
                                <ReferenceLine y={0} label={{value: 'Stockout', position: 'insideTopLeft', fill: '#fb7185'}} stroke="#fb7185" strokeDasharray="4 4" /> 
                                {forecast.itemNames.map((itemName, index) => (
                                    <Line 
                                        key={itemName}
                                        type="monotone" 
                                        dataKey={itemName}
                                        stroke={itemColors[index % itemColors.length]} 
                                        strokeWidth={2.5}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ))}
             <SupplierCapacityForecast company={company} />
        </div>
    </div>
  );
};

export default ForecastView;
