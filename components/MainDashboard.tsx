
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Company, Warehouse, Metrics, Node, CurrentUser } from '../types';
import { DashboardIcon, MapIcon, ReportsIcon, ControlsIcon, ForecastIcon, InfoIcon, FlowIcon, BackArrowIcon, SupplierIcon, CustomerIcon, WarehouseIcon, SparklesIcon } from './Icons';
import { useExplanation } from './ExplanationProvider';
import { useTooltip } from './TooltipProvider';
import { metricDefinitions } from '../data/metricDefinitions';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import SpotlightNavbar from './SpotlightNavbar';
import MetricTree from './MetricTree';

import NetworkGraph from './NetworkGraph';
import SummaryView from './SummaryView';
import ControlAndPredictionPanel from './ControlAndPredictionPanel';
import ForecastView from './ForecastView';
import SupplierOperations from './SupplierOperations';
import WarehouseOperations from './WarehouseOperations'; // Corrected import path
import CustomerOperations from './CustomerOperations';
import WarehouseDetailView from './WarehouseDetailView';
import SupplierDetailView from './SupplierDetailView';
import CustomerDetailView from './CustomerDetailView';
import { AIAnalysisView } from './AIAnalysisView';


interface MainDashboardProps {
  company: Company;
  onBack?: () => void;
  dispatch: React.Dispatch<any>;
  currentUser: CurrentUser;
  apiKey: string | null;
}

export const OperationsWidget: React.FC<{ company: Company, selectedWarehouse: Warehouse | null }> = ({ company, selectedWarehouse }) => {
    const { showExplanation } = useExplanation();
    const { showTooltip, hideTooltip } = useTooltip();
    
    const costRef = useRef<HTMLDivElement>(null);
    const workforceRef = useRef<HTMLDivElement>(null);

    const cost = company.data.networkMetrics.costPerOrder.value;
    const isCostProblem = cost > company.data.networkMetrics.costPerOrder.target;

    const handleHover = (metricKey: string, ref: React.RefObject<HTMLDivElement>) => {
        const definition = metricDefinitions[metricKey];
        if (definition && ref.current) {
            showTooltip(definition, ref.current.getBoundingClientRect());
        }
    };

    return (
        <div className="bg-white p-5 h-full rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-slate-700">Operations</h3>
            <div className="space-y-4 mt-2">
                <div 
                    ref={costRef}
                    className="flex items-center gap-3 p-2 -m-2 rounded-lg cursor-pointer hover:bg-slate-50/70 transition-colors"
                    onClick={() => showExplanation('costPerOrder', company, null, 'Cost-to-Serve (Network)')}
                    onMouseEnter={() => handleHover('costPerOrder', costRef)}
                    onMouseLeave={hideTooltip}
                >
                    <div className="p-2 bg-sky-100 text-sky-600 rounded-md"> 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.133 0V7.151c.22.07.412.164.567.267zM11.567 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 01-1.133 0V7.151c.22.07.412.164.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.876.662C6.168 6.23 5.5 7.085 5.5 8.002v.004a.5.5 0 00.5.5h.292a.5.5 0 00.434-.252c.16-.266.386-.5.672-.693a.5.5 0 01.62-.033c.224.133.42.3.58.488a.5.5 0 00.62.033c.16-.266.386-.5.672-.693a.5.5 0 01.62-.033c.224.133.42.3.58.488a.5.5 0 00.62.033c.16-.266.386-.5.672-.693a.5.5 0 01.434-.252H14.5a.5.5 0 00.5-.5v-.004c0-.917-.668-1.772-1.624-2.234A4.5 4.5 0 0011 5.092V5zM8.5 12a.5.5 0 00-.5.5v2a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-2a.5.5 0 00-.5-.5h-3z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">Cost-to-Serve (Network) <InfoIcon className="w-3 h-3 text-slate-300" /></div>
                        <div className={`font-bold text-lg ${isCostProblem ? 'text-rose-500' : 'text-slate-800'}`}>₹{cost.toFixed(0)}/order</div> 
                    </div>
                </div>
                 <div 
                    ref={workforceRef}
                    className="flex items-center gap-3 p-2 -m-2 rounded-lg cursor-pointer hover:bg-slate-50/70 transition-colors"
                    onClick={() => showExplanation('workforceActive', company, selectedWarehouse, 'Active Workforce')}
                    onMouseEnter={() => handleHover('workforceActive', workforceRef)}
                    onMouseLeave={hideTooltip}
                >
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md"> 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">Workforce <InfoIcon className="w-3 h-3 text-slate-300" /></div>
                        <div className="font-bold text-lg text-slate-800">{selectedWarehouse?.workforce.active || 0} active</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const WorkforceEfficiencyWidget: React.FC<{ company: Company, selectedWarehouse: Warehouse | null }> = ({ company, selectedWarehouse }) => {
    const { showExplanation } = useExplanation();
    const { showTooltip, hideTooltip } = useTooltip();
    
    const onTrack = selectedWarehouse?.workforce.onTrack || 0;
    const efficiency = selectedWarehouse?.efficiency || { picksPerHour: 0, errorRate: 0, rework: 0, overtime: 0 };
    const chartData = [{ name: 'On Track', value: onTrack, fill: '#34d399' }]; 

    const MetricRow: React.FC<{label: string, value: string | number, metricKey: string, valueClass?: string}> = ({label, value, metricKey, valueClass=""}) => {
        const rowRef = useRef<HTMLDivElement>(null);
        
        const handleHover = () => {
            const definition = metricDefinitions[metricKey];
            if (definition && rowRef.current) {
                showTooltip(definition, rowRef.current.getBoundingClientRect());
            }
        };

        return (
            <div 
                ref={rowRef}
                className="flex justify-between items-center p-1 -m-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => showExplanation(metricKey, company, selectedWarehouse, label)}
                onMouseEnter={handleHover}
                onMouseLeave={hideTooltip}
            >
                <span className="text-slate-500 flex items-center gap-1">{label} <InfoIcon className="w-3 h-3 text-slate-300" /></span>
                <span className={`font-bold ${valueClass}`}>{value}</span>
            </div>
        );
    };
    
    const onTrackRef = useRef<HTMLDivElement>(null);

    return (
        <div className="bg-white p-5 h-full rounded-xl border border-slate-100 shadow-sm flex flex-col"> 
            <h3 className="font-bold text-slate-700">Workforce Efficiency</h3>
            <div className="flex-grow flex items-center my-2 gap-6">
                <div className="w-32 h-32 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                            innerRadius="80%" 
                            outerRadius="100%" 
                            data={chartData} 
                            startAngle={90} 
                            endAngle={-270}
                            barSize={10}
                        >
                            <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                angleAxisId={0}
                                tick={false}
                            />
                            <RadialBar
                                background={{ fill: '#f1f5f9' }}
                                dataKey="value"
                                cornerRadius={5}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                 <div 
                    ref={onTrackRef}
                    className="cursor-pointer"
                    onClick={() => showExplanation('workforceOnTrack', company, selectedWarehouse, 'On Track Workforce')}
                    onMouseEnter={() => {
                        const definition = metricDefinitions['workforceOnTrack'];
                        if (definition && onTrackRef.current) {
                            showTooltip(definition, onTrackRef.current.getBoundingClientRect());
                        }
                    }}
                    onMouseLeave={hideTooltip}
                 >
                    <div className="text-5xl font-extrabold text-slate-800 tracking-tight">{onTrack}<span className="text-3xl text-slate-500">%</span></div>
                    <div className="font-semibold text-emerald-600 flex items-center gap-1 mt-1"> 
                        On Track 
                        <InfoIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>
            <div className="space-y-2 text-sm">
                <MetricRow label="Picks/Hour" value={efficiency.picksPerHour} metricKey="picksPerHour" />
                <MetricRow label="Error Rate" value={`${efficiency.errorRate}%`} metricKey="errorRate" valueClass="text-amber-600" />
                <MetricRow label="Rework" value={`${efficiency.rework}%`} metricKey="rework" />
                <MetricRow label="Overtime" value={`${efficiency.overtime}%`} metricKey="overtime" />
            </div>
        </div>
    );
};

const MainDashboard: React.FC<MainDashboardProps> = ({ company, onBack, dispatch, currentUser, apiKey }) => {
  const [activeTab, setActiveTab] = useState(currentUser?.role === 'admin' ? 'Dashboard' : 'Operations');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(company.data.warehouses[0]?.id || null);

  useEffect(() => {
    if (!selectedWarehouseId && company.data.warehouses.length > 0) {
      setSelectedWarehouseId(company.data.warehouses[0].id);
    }
    if (selectedWarehouseId) {
        const warehouseExists = company.data.warehouses.some(wh => wh.id === selectedWarehouseId);
        if (!warehouseExists) {
            setSelectedWarehouseId(company.data.warehouses[0]?.id || null);
        }
    }
  }, [company.data.warehouses, selectedWarehouseId]);

  const selectedWarehouse = useMemo(() => 
    company.data.warehouses.find(wh => wh.id === selectedWarehouseId),
    [company.data.warehouses, selectedWarehouseId]
  );

  useEffect(() => {
    // If the selected node gets deleted from company data, reset the view
    if (selectedNode) {
        const nodeType = 'materialsSupplied' in selectedNode ? 'suppliers' : 'storage' in selectedNode ? 'warehouses' : 'customers';
        const nodeExists = (company.data[nodeType] as Node[]).some(n => n.id === selectedNode.id);
        if (!nodeExists) {
            setSelectedNode(null);
        }
    }
  }, [company.data, selectedNode]);

  const baseTabs = [
      { label: 'Dashboard', icon: <DashboardIcon /> },
      { label: 'Map View', icon: <MapIcon /> },
      { label: 'Reports', icon: <ReportsIcon /> },
      { label: 'Controls', icon: <ControlsIcon /> },
      { label: 'Forecasts', icon: <ForecastIcon /> },
      { label: 'AI Analysis', icon: <SparklesIcon /> }
  ];
  
  const tabs = currentUser?.role !== 'admin' 
    ? [{ label: 'Operations', icon: <FlowIcon /> }]
    : baseTabs;

  useEffect(() => {
    if(currentUser?.role !== 'admin') {
      setActiveTab('Operations');
    } else if (!selectedNode) {
      setActiveTab('Dashboard');
    }
  }, [currentUser?.role, selectedNode]);
  
  const handleNetworkTargetChange = (metricKey: string, newValue: number) => {
    dispatch({
        type: 'UPDATE_NETWORK_METRIC_TARGET',
        payload: {
            companyId: company.id,
            metricKey: metricKey as keyof Metrics,
            newValue: newValue,
        }
    });
  };

  const renderDashboard = () => {
    if (!selectedWarehouse) {
        return (
            <div className="text-center py-20 bg-white mt-6 rounded-xl border border-slate-100 shadow-sm"> 
                <h3 className="text-xl font-bold text-slate-700">No Warehouse Selected</h3>
                <p className="text-slate-500 mt-2">Please add a warehouse to view dashboard analytics.</p>
            </div>
        );
    }
    return (
        <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OperationsWidget company={company} selectedWarehouse={selectedWarehouse} />
                <WorkforceEfficiencyWidget company={company} selectedWarehouse={selectedWarehouse} />
            </div>
            <div>
                <MetricTree 
                    company={company}
                    title="Network Metric Tree" 
                    onTargetChange={handleNetworkTargetChange} 
                />
            </div>
        </div>
    );
  }

  const renderOperations = () => {
    if (!currentUser) return null;
    switch(currentUser.role) {
      case 'supplier':
        const supplier = company.data.suppliers.find(s => s.id === currentUser.id);
        if(!supplier) return <div>Supplier data not found.</div>;
        return <SupplierOperations company={company} supplier={supplier} dispatch={dispatch} currentUser={currentUser} />;
      case 'warehouse':
        const warehouse = company.data.warehouses.find(w => w.id === currentUser.id);
        if(!warehouse) return <div>Warehouse data not found.</div>;
        return <WarehouseOperations company={company} warehouse={warehouse} dispatch={dispatch} currentUser={currentUser} />;
      case 'customer':
        const customer = company.data.customers.find(c => c.id === currentUser.id);
        if(!customer) return <div>Customer data not found.</div>;
        return <CustomerOperations company={company} customer={customer} dispatch={dispatch} currentUser={currentUser} />;
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    let content;
    switch(activeTab) {
        case 'Dashboard':
            content = renderDashboard(); break;
        case 'Map View':
            content = (
                <div className="space-y-6">
                     <NetworkGraph
                        company={company}
                        onSelectNode={setSelectedNode}
                        dispatch={dispatch}
                    />
                </div>
            ); break;
        case 'Reports':
            content = <SummaryView data={company.data} />; break;
        case 'Controls':
             content = <ControlAndPredictionPanel company={company} dispatch={dispatch} currentUser={currentUser} />; break;
        case 'Forecasts':
            content = <ForecastView company={company} />; break;
        case 'AI Analysis':
            content = <AIAnalysisView company={company} apiKey={apiKey} />; break;
        default:
            content = renderOperations();
    }
    return (
        <div key={activeTab} className="mt-6 animate-fade-in-up">
            {content}
        </div>
    )
  };
  
  const renderDetailView = () => {
      if (!selectedNode) return null;
      
      let detailContent = null;
      let icon = null;
      if ('storage' in selectedNode) {
          detailContent = <WarehouseDetailView company={company} warehouse={selectedNode} dispatch={dispatch} />;
          icon = <WarehouseIcon className="w-8 h-8 text-amber-600" />; 
      } else if ('materialsSupplied' in selectedNode) {
          detailContent = <SupplierDetailView company={company} supplier={selectedNode} />;
          icon = <SupplierIcon className="w-8 h-8 text-teal-600" />; 
      } else if ('demand' in selectedNode) {
          detailContent = <CustomerDetailView company={company} customer={selectedNode} />;
          icon = <CustomerIcon className="w-8 h-8 text-violet-600" />; 
      }

      return (
        <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setSelectedNode(null)} className="bg-white hover:bg-slate-50 text-slate-700 font-semibold p-2.5 rounded-lg border border-slate-300 shadow-sm">
                    <BackArrowIcon />
                </button>
                 <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">{icon}</div>
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{selectedNode.name}</h3>
                    <p className="text-slate-600 font-semibold">Node Detail View</p> 
                </div>
            </div>
            {detailContent}
        </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto">
        {!selectedNode && (
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{company.name}</h2>
                  <p className="text-slate-600 mt-1 max-w-2xl">{company.description}</p> 
                </div>
                <div className="flex items-center gap-4 self-start sm:self-center">
                    {activeTab === 'Dashboard' && currentUser?.role === 'admin' && company.data.warehouses.length > 0 && (
                        <div className="relative">
                            <WarehouseIcon className="w-5 h-5 absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedWarehouseId || ''}
                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                className="pl-10 pr-4 py-2.5 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                                {company.data.warehouses.map(wh => (
                                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {onBack &&
                        <button onClick={onBack} className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 transition-all duration-200 shadow-sm flex items-center gap-2">
                            Change Company
                        </button>
                    }
                </div>
            </div>
        )}

        { (currentUser?.role === 'admin' && !selectedNode) || currentUser?.role !== 'admin' ? (
            <SpotlightNavbar
                tabs={tabs}
                activeTab={activeTab}
                onTabClick={setActiveTab}
            />
        ) : null }

        { currentUser?.role === 'admin' ? (selectedNode ? renderDetailView() : renderTabContent()) : renderOperations() }
    </div>
  );
};
export { MainDashboard };