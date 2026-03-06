
import type { Company, Warehouse, Supplier } from '../types';

const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });

const renderList = (items: string[]) => `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;

export const metricCalculationGenerators: Record<string, (company: Company, context?: any) => string | null> = {
  otif: (company) => {
    const warehouses = company.data.warehouses;
    if (!warehouses.length) return 'No warehouses to calculate from.';
    
    const totalDispatched = warehouses.reduce((sum, wh) => sum + wh.dispatchedLast24h, 0);
    if (totalDispatched === 0) return 'No items dispatched in the last 24h.';

    const calculationSteps = warehouses.map(wh => 
        `Contribution from <strong>${wh.name}</strong>: (${formatPercent(wh.metrics.otif.value)} * ${formatNumber(wh.dispatchedLast24h)} units)`
    );
    
    return `
        A weighted average of each warehouse's OTIF score, based on its dispatch volume.
        ${renderList(calculationSteps)}
        <strong>Total Dispatched:</strong> ${formatNumber(totalDispatched)} units<br/>
        <strong>Final Calculated OTIF: ${formatPercent(company.data.networkMetrics.otif.value)}</strong>
    `;
  },

  costPerOrder: (company) => {
    const warehouses = company.data.warehouses;
    if (!warehouses.length) return 'No warehouses to calculate from.';
    
    const calculationSteps = warehouses.map(wh => 
        `<strong>${wh.name}</strong>: ${formatCurrency(wh.metrics.costPerOrder.value)}`
    );

    return `
        A simple average of the fulfillment cost from each warehouse.
        ${renderList(calculationSteps)}
        <strong>Final Calculated Cost/Order: ${formatCurrency(company.data.networkMetrics.costPerOrder.value)}</strong>
    `;
  },
  
  warehouseResilience: (company, context) => {
    const warehouse: Warehouse = context;
    if (!warehouse) return 'No warehouse context provided for calculation.';

    const connectedSuppliers = company.data.connections
      .filter(c => c.to === warehouse.id)
      .map(c => company.data.suppliers.find(s => s.id === c.from))
      .filter((s): s is Supplier => s !== undefined);

    let averageSupplierResilience = 0;
    if (connectedSuppliers.length > 0) {
      averageSupplierResilience = connectedSuppliers.reduce((sum, s) => sum + s.resilienceScore, 0) / connectedSuppliers.length;
    }

    // Simplified inventory coverage calculation (e.g., how many days of total demand can be covered)
    const totalDailyOutbound = company.data.connections
        .filter(c => c.from === warehouse.id)
        .reduce((sum, conn) => {
          const customer = company.data.customers.find(c => c.id === conn.to);
          return sum + (customer?.demand || 0);
        }, 0);

    const inventoryCoverage = totalDailyOutbound > 0 ? (warehouse.inventoryLevel / totalDailyOutbound) : 100; // Assume high coverage if no outbound
    const clampedCoverage = Math.min(100, Math.max(0, inventoryCoverage * 10)); // Scale to a max of 100 for score contribution

    const warehouseResilienceScore = (clampedCoverage * 0.6) + (averageSupplierResilience * 0.4);

    const supplierDetails = connectedSuppliers.length > 0
        ? renderList(connectedSuppliers.map(s => `<strong>${s.name}</strong>: Resilience ${s.resilienceScore}`))
        : '<em>No direct suppliers found.</em>';

    return `
        This warehouse's resilience score (${warehouse.resilienceScore}) is calculated as a blend of its inventory coverage (60% weight) and the average resilience of its connected suppliers (40% weight).
        <br/><br/>
        <strong>Inventory Coverage:</strong> Based on current inventory (${formatNumber(warehouse.inventoryLevel)} units) and total daily outbound demand (${formatNumber(totalDailyOutbound)} units), indicating approximately ${inventoryCoverage.toFixed(1)} days of supply.
        <br/><br/>
        <strong>Connected Suppliers Resilience:</strong>
        ${supplierDetails}
        Average Supplier Resilience: ${averageSupplierResilience.toFixed(1)}
        <br/><br/>
        <strong>Calculation:</strong> (Inventory Coverage Contribution ${clampedCoverage.toFixed(1)} * 0.6) + (Average Supplier Resilience ${averageSupplierResilience.toFixed(1)} * 0.4) = <strong>${warehouseResilienceScore.toFixed(1)}</strong>
    `;
  },
};
