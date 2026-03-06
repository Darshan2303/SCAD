

import React from 'react';
import type { ScenarioData } from '../types';
import { SupplierIcon, WarehouseIcon, CustomerIcon } from './Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SummaryViewProps {
  data: ScenarioData;
}

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-80"> 
        <h4 className="font-bold text-slate-800 mb-4 tracking-tight">{title}</h4> 
        <div className="h-[calc(100%-2rem)]">
          {children}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white rounded-md shadow-lg p-2 px-3 text-sm">
        <p className="font-bold">{label}</p>
        <p>{`${payload[0].name}: ${payload[0].value.toLocaleString()}${payload[0].unit || ''}`}</p>
      </div>
    );
  }
  return null;
};


const SummaryView: React.FC<SummaryViewProps> = ({ data }) => {
  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartContainer title="Warehouse Inventory Levels">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.warehouses} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /> 
                        <XAxis dataKey="name" angle={-20} textAnchor="end" height={50} interval={0} />
                        <YAxis tickFormatter={(value) => `${(value as number) / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}/>
                        <Bar dataKey="inventoryLevel" fill="#34d399" name="Inventory" radius={[4, 4, 0, 0]} unit=" units" /> 
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
            <ChartContainer title="Warehouse OTIF (%)">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.warehouses.map(w => ({ ...w, otif: w.metrics.otif.value }))} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" angle={-20} textAnchor="end" height={50} interval={0}/>
                        <YAxis domain={[50, 100]} unit="%" />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}/>
                        <Bar dataKey="otif" fill="#fb923c" name="OTIF" radius={[4, 4, 0, 0]} unit="%" /> 
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
             <ChartContainer title="Supplier Average Delay (hrs)">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.suppliers} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" angle={-20} textAnchor="end" height={50} interval={0} />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}/>
                        <Bar dataKey="averageDelayHours" fill="#fcd34d" name="Avg Delay" radius={[4, 4, 0, 0]} unit=" hrs"/> 
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2 tracking-tight"><WarehouseIcon className="w-6 h-6 text-amber-600"/> Warehouses</h3> 
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto"> 
          <table className="w-full text-left">
            <thead className="bg-slate-50"> 
              <tr className="border-b-2 border-slate-100"> 
                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Name</th>
                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Inventory Level</th>
                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">OTIF (%)</th>
                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Dispatched (24h)</th>
                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Resilience</th>
              </tr>
            </thead>
            <tbody>
              {data.warehouses.map(wh => (
                <tr key={wh.id} className="border-b border-slate-100 last:border-b-0 even:bg-slate-50/50 hover:bg-slate-100 transition-colors"> 
                  <td className="p-3 font-semibold text-slate-700">{wh.name}</td>
                  <td className="p-3 font-mono text-slate-600">{wh.inventoryLevel.toLocaleString()} units</td>
                  {/* FIX: Called toFixed on the 'value' property of the metric object. */}
                  <td className="p-3 font-mono text-slate-600">{wh.metrics.otif.value.toFixed(1)}%</td>
                  <td className="p-3 font-mono text-slate-600">{wh.dispatchedLast24h.toLocaleString()} units</td>
                  <td className="p-3 font-mono text-slate-700 font-bold">{wh.resilienceScore}</td> 
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2 tracking-tight"><SupplierIcon className="w-6 h-6 text-sky-600"/> Suppliers</h3> 
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto"> 
          <table className="w-full text-left">
            <thead className="bg-slate-50/80"> 
              <tr className="border-b-2 border-slate-100"> 
                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Name</th>
                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Avg. Delay</th>
                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Supply Capacity</th>
                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Resilience</th>
              </tr>
            </thead>
            <tbody>
              {data.suppliers.map(sup => (
                <tr key={sup.id} className="border-b border-slate-100 last:border-b-0 even:bg-slate-50/50 hover:bg-slate-100 transition-colors"> 
                  <td className="p-3 font-semibold text-slate-700">{sup.name}</td>
                  <td className="p-3 font-mono text-slate-600">{sup.averageDelayHours} hrs</td>
                  <td className="p-3 font-mono text-slate-600">{sup.supplyCapacity.toLocaleString()} u/day</td>
                  <td className="p-3 font-mono text-slate-700 font-bold">{sup.resilienceScore}</td> 
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;