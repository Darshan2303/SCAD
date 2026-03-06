

import React from 'react';
import type { Company, Warehouse, Metrics } from '../types';
import MetricTree from './MetricTree';
// FIX: Changed import of WorkforceEfficiencyWidget to a named import to resolve "has no exported member" error.
import { OperationsWidget, WorkforceEfficiencyWidget } from './MainDashboard'; // Re-using existing widgets

interface WarehouseDetailViewProps {
    company: Company;
    warehouse: Warehouse;
    dispatch: React.Dispatch<any>;
}

const WarehouseDetailView: React.FC<WarehouseDetailViewProps> = ({ company, warehouse, dispatch }) => {
    
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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OperationsWidget company={company} selectedWarehouse={warehouse} />
                <WorkforceEfficiencyWidget company={company} selectedWarehouse={warehouse} />
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
};

export default WarehouseDetailView;