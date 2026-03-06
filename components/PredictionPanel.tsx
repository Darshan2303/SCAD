
import React, { useMemo, useRef } from 'react';
import type { Company, Warehouse } from '../types';
import { InfoIcon } from './Icons';
import { useExplanation } from './ExplanationProvider';
import { useTooltip } from './TooltipProvider';
import { metricDefinitions } from '../data/metricDefinitions';
// FIX: Imported the new utility function for item-level inventory forecasting.
import { calculateItemInventoryForecast } from '../utils/metricCalculations';

interface PredictionPanelProps {
  warehouse: Warehouse;
  company: Company;
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({ warehouse, company }) => {
  const { showExplanation } = useExplanation();
  const { showTooltip, hideTooltip } = useTooltip();
  const predictionRef = useRef<HTMLDivElement>(null);

  const daysUntilStockout = useMemo(() => {
    // If no items in storage, cannot stock out
    if (!warehouse.storage || warehouse.storage.length === 0) {
      return Infinity;
    }

    let minDaysToStockout = Infinity;
    const FORECAST_DAYS = 60; // Max days to forecast, consistent with ForecastView

    warehouse.storage.forEach(storageItem => {
      const forecastData = calculateItemInventoryForecast(company, warehouse, storageItem, FORECAST_DAYS);
      const stockoutPoint = forecastData.find(d => d.inventory === 0);

      if (stockoutPoint) {
        minDaysToStockout = Math.min(minDaysToStockout, stockoutPoint.day);
      }
    });

    return minDaysToStockout;
  }, [warehouse, company]); // Dependencies for useMemo

  const getStatusClasses = (days: number) => {
    if (days <= 7) return 'text-rose-600';
    if (days <= 14) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const predictionText = daysUntilStockout === Infinity 
    ? "All critical item inventory levels are stable or increasing."
    : `Projected stockout for at least one critical item in ${daysUntilStockout} days.`;

  return (
    <div 
        ref={predictionRef}
        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mt-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => showExplanation('daysUntilStockout', company, warehouse, 'Days Until Item Stockout (Earliest)')}
        onMouseEnter={() => {
            const definition = metricDefinitions['daysUntilStockout'];
            if (definition && predictionRef.current) {
                showTooltip(definition, predictionRef.current.getBoundingClientRect());
            }
        }}
        onMouseLeave={hideTooltip}
    >
        <div className="p-2 bg-sky-100 text-sky-600 rounded-md">
            <InfoIcon className="w-5 h-5"/>
        </div>
        <div>
            <div className="text-xs text-slate-500">Days Until Item Stockout <InfoIcon className="w-3 h-3 text-slate-300" /></div>
            <div className={`font-bold text-lg ${getStatusClasses(daysUntilStockout)}`}>
                {daysUntilStockout === Infinity ? 'Stable' : daysUntilStockout} {daysUntilStockout !== Infinity ? 'days' : ''}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{predictionText}</p>
        </div>
    </div>
  );
};

export default PredictionPanel;
