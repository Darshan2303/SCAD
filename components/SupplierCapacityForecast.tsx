

import React, { useMemo } from 'react';
import type { Company } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SupplierCapacityForecastProps {
    company: Company;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-700 text-white rounded-md shadow-lg p-2 px-3 text-sm">
          <p className="font-bold">{label}</p>
          {payload.map((p: any) => (
              <p key={p.dataKey} style={{ color: p.color }}>{`${p.name}: ${p.value.toLocaleString()} u/day`}</p>
          ))}
        </div>
      );
    }
    return null;
  };

const SupplierCapacityForecast: React.FC<SupplierCapacityForecastProps> = ({ company }) => {

    const chartData = useMemo(() => {
        return company.data.suppliers.map(supplier => {
            const connectedWarehouseIds = company.data.connections
                .filter(c => c.from === supplier.id)
                .map(c => c.to);
            
            const aggregatedDemand = company.data.warehouses
                .filter(wh => connectedWarehouseIds.includes(wh.id))
                .reduce((totalDemand, wh) => {
                    const outboundDemand = company.data.connections
                        .filter(c => c.from === wh.id)
                        .reduce((whDemand, conn) => {
                            const customer = company.data.customers.find(cust => cust.id === conn.to);
                            return whDemand + (customer?.demand || 0);
                        }, 0);
                    return totalDemand + outboundDemand;
                }, 0);

            return {
                name: supplier.name,
                Capacity: supplier.supplyCapacity,
                Demand: aggregatedDemand,
            };
        });
    }, [company]);

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-[450px] flex flex-col">
            <h4 className="font-bold text-slate-700 mb-4 tracking-tight">Supplier Capacity vs. Aggregated Demand</h4>
             <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
                        <YAxis tickFormatter={(value) => `${(value as number) / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}/>
                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}}/>
                        <Bar dataKey="Capacity" fill="#10b981" name="Supply Capacity" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Demand" fill="#f43f5e" name="Aggregated Demand" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
    );
};

export default SupplierCapacityForecast;