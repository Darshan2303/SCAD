

import React, { useState, useRef, useEffect } from 'react';
// FIX: Imported the correct Metric types from the centralized types file.
import type { Metrics, MetricDetail, Company } from '../types';
import { ChevronRightIcon, ChevronDownIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon, InfoIcon, EditIcon } from './Icons';
import { useExplanation } from './ExplanationProvider';
import { useTooltip } from './TooltipProvider';
import { metricDefinitions } from '../data/metricDefinitions';

interface MetricTreeProps {
  company: Company;
  title: string;
  onTargetChange?: (metricKey: string, newValue: number) => void;
}

type Trend = 'up' | 'down' | 'stable';
type Status = 'target' | 'risk' | 'critical';

interface MetricItemProps {
  label: string;
  metric?: MetricDetail;
  unit: string;
  metricKey: string;
  isRoot?: boolean;
  onTargetChange?: (metricKey: string, newValue: number) => void;
  children?: React.ReactNode;
  company: Company;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, metric, unit, metricKey, isRoot = false, onTargetChange, children, company }) => {
  const [isExpanded, setIsExpanded] = useState(isRoot);
  const { showExplanation } = useExplanation();
  const { showTooltip, hideTooltip } = useTooltip();
  const hasChildren = React.Children.count(children) > 0;
  
  const headerRef = useRef<HTMLButtonElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  if (!metric) return null;

  const { value, target } = metric;
  const [editValue, setEditValue] = useState(target);
  
  useEffect(() => {
    setEditValue(target);
  }, [target]);

  useEffect(() => {
    if (isEditing) {
        inputRef.current?.focus();
        inputRef.current?.select();
    }
  }, [isEditing]);
  
  const handleTargetUpdate = () => {
      if (onTargetChange && editValue !== target) {
          onTargetChange(metricKey, editValue);
      }
      setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleTargetUpdate();
      } else if (e.key === 'Escape') {
          setEditValue(target);
          setIsEditing(false);
      }
  };


  const getStatus = (): Status => {
    const percentage = target > 0 ? value / target : 1;
    if (["Cost per Order", "Order Cycle Time", "Dock to Stock Time"].includes(label)) {
      if (percentage > 1.1) return 'critical';
      if (percentage > 1.05) return 'risk';
      return 'target';
    } else {
      if (percentage < 0.9) return 'critical';
      if (percentage < 0.95) return 'risk';
      return 'target';
    }
  };
  const status = getStatus();

  const getTrend = (): Trend => {
    if (status === 'critical') return 'down';
    if (status === 'risk') return 'stable';
    return 'up';
  };
  const trend = getTrend();

  const statusClasses = {
    target: 'text-emerald-500', // Softer emerald
    risk: 'text-amber-500',   // Softer amber
    critical: 'text-rose-500',  // Softer red/rose
  };
  
  const TrendArrow = () => {
    switch(trend) {
      case 'up': return <TrendingUpIcon className={`w-3.5 h-3.5 ${statusClasses.target}`} />;
      case 'down': return <TrendingDownIcon className={`w-3.5 h-3.5 ${statusClasses.critical}`} />;
      case 'stable': return <MinusIcon className={`w-3.5 h-3.5 ${statusClasses.risk}`} />;
    }
  };

  const formattedValue = (val: number, u: string) => {
    if (u === '%') return `${val.toFixed(1)}${u}`;
    if (u === 'x') return `${val.toFixed(1)}${u}`;
    if (u.startsWith('₹')) return `${u}${val.toFixed(0)}`;
    return `${val.toFixed(1)} ${u}`;
  };

  const itemClass = `flex items-center justify-between py-2 transition-all duration-300 ${!isRoot ? 'pl-8' : ''}`;
  const valueClass = `text-sm font-semibold tracking-tighter ${statusClasses[status]}`;

  const handleHeaderClick = () => {
      showExplanation(metricKey, company, null, label);
  }

  const handleHover = () => {
    const definition = metricDefinitions[metricKey];
    if (definition && headerRef.current) {
        showTooltip(definition, headerRef.current.getBoundingClientRect());
    }
  };

  return (
    <li className={`border-b border-slate-100 last:border-b-0 ${isRoot ? '' : 'ml-4 border-l-2 border-slate-100'}`}> 
        <div className={itemClass}>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => hasChildren && setIsExpanded(!isExpanded)} 
                    className="flex items-center gap-2 group"
                    onMouseEnter={handleHover}
                    onMouseLeave={hideTooltip}
                    ref={headerRef}
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDownIcon className="w-4 h-4 text-slate-400"/> : <ChevronRightIcon className="w-4 h-4 text-slate-400"/>
                    ) : (
                        <div className="w-4"></div>
                    )}
                    <div className={`w-2 h-2 rounded-full ${status === 'target' ? 'bg-emerald-400' : status === 'risk' ? 'bg-amber-400' : 'bg-rose-400'}`}></div> 
                    <span className="font-semibold text-slate-700 text-sm">{label}</span>
                </button>
                <button onClick={handleHeaderClick} className="group"><InfoIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" /></button>
            </div>
            <div className="flex items-center gap-3">
                <span className={valueClass}>{formattedValue(value, unit)}</span>
                <span className="text-sm text-slate-400 font-medium">/</span>
                <div className="flex items-center gap-1.5 group/target">
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                      onBlur={handleTargetUpdate}
                      onKeyDown={handleKeyDown}
                      className="w-20 text-sm font-semibold rounded-md border-slate-300 shadow-sm text-right px-1 py-0.5 focus:border-sky-300 focus:ring-sky-300/50"
                    />
                  ) : (
                    <span
                      onClick={() => onTargetChange && setIsEditing(true)}
                      className={`text-sm text-slate-400 font-medium ${onTargetChange ? 'cursor-pointer hover:text-slate-700 hover:font-semibold' : ''}`}
                    >
                      {formattedValue(target, unit)}
                    </span>
                  )}
                  {onTargetChange && !isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="opacity-0 group-hover/target:opacity-100 transition-opacity"
                    >
                      <EditIcon />
                    </button>
                  )}
                </div>
                <div className={`p-1 rounded-full ${status === 'target' ? 'bg-emerald-100' : status === 'risk' ? 'bg-amber-100' : 'bg-rose-100'}`}> 
                    <TrendArrow />
                </div>
            </div>
        </div>
        {hasChildren && isExpanded && (
            <ul className="transition-opacity duration-500">
                {children}
            </ul>
        )}
    </li>
  );
}

const MetricTree: React.FC<MetricTreeProps> = ({ company, title, onTargetChange }) => {
  const metrics = company.data.networkMetrics;
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm"> 
      <div className="flex justify-between items-center mb-4"> 
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3> 
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>On Target</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div>At Risk</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-400"></div>Critical</div> 
        </div>
      </div>
      <div className="p-2 border-t border-slate-100"> 
        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-4 py-3"> 
          <span>Root Metrics</span>
          <span>Value / Target</span>
        </div>
        <ul>
          <MetricItem label="On-Time In-Full (OTIF)" metric={metrics.otif} metricKey="otif" unit="%" isRoot onTargetChange={onTargetChange} company={company}>
            <MetricItem label="Picking Speed" metric={metrics.pickingSpeed} metricKey="pickingSpeed" unit="hr" onTargetChange={onTargetChange} company={company} />
            <MetricItem label="Packing Efficiency" metric={metrics.packingEfficiency} metricKey="packingEfficiency" unit="%" onTargetChange={onTargetChange} company={company} />
            <MetricItem label="Dispatch Timeliness" metric={metrics.dispatchTimeliness} metricKey="dispatchTimeliness" unit="%" onTargetChange={onTargetChange} company={company} />
          </MetricItem>
          <MetricItem label="Order Accuracy" metric={metrics.orderAccuracy} metricKey="orderAccuracy" unit="%" isRoot onTargetChange={onTargetChange} company={company} />
          <MetricItem label="Cost per Order" metric={metrics.costPerOrder} metricKey="costPerOrder" unit="₹" isRoot onTargetChange={onTargetChange} company={company} />
          <MetricItem label="Inventory Turnover" metric={metrics.inventoryTurnover} metricKey="inventoryTurnover" unit="x" isRoot onTargetChange={onTargetChange} company={company} />
        </ul>
      </div>
    </div>
  );
};

export default MetricTree;