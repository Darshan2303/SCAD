
import type { Company, Warehouse, Supplier, StorageItem } from '../types';

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

  supplierResilience: (company, context) => {
    const supplier: Supplier = context;
    if (!supplier) return 'No supplier context provided for calculation.';
    
    // Use the same logic as in recalculateAllMetrics for consistency
    const calculatedScore = Math.max(0, 100 - (supplier.averageDelayHours * 5) - (supplier.deliveryTimeVariance * 10));

    return `
        A supplier's resilience score (${calculatedScore.toFixed(1)}) is calculated based on its historical performance indicators:
        <ul>
            <li>Starts at a base of 100.</li>
            <li>Reduced by <strong>5 points</strong> for every hour of average delay (${supplier.averageDelayHours} hrs).</li>
            <li>Reduced by <strong>10 points</strong> for every unit of delivery time variance (${supplier.deliveryTimeVariance}).</li>
        </ul>
        <strong>Calculation:</strong> 100 - (${supplier.averageDelayHours} * 5) - (${supplier.deliveryTimeVariance} * 10) = <strong>${calculatedScore.toFixed(1)}</strong>
    `;
  },
};


/**
 * Calculates the inventory forecast for a single item within a specific warehouse over a given number of days.
 * This function accounts for item-specific inbound (from suppliers) and outbound (to customers) flows,
 * respecting supplier capacities.
 * @param company The overall company data.
 * @param warehouse The warehouse for which to calculate the forecast.
 * @param storageItem The specific item in storage to forecast.
 * @param forecastDays The number of days to project the inventory.
 * @returns An array of {day, inventory} data points.
 */
export function calculateItemInventoryForecast(company: Company, warehouse: Warehouse, storageItem: StorageItem, forecastDays: number): { day: number; inventory: number }[] {
    const itemName = storageItem.itemName;
    let currentInventory = storageItem.quantity;
    const data = [];

    // Determine the total demand for this specific item across all customers connected to this warehouse
    const totalCustomerDemandForThisItem = company.data.connections
        .filter(conn => conn.from === warehouse.id && company.data.customers.some(c => c.id === conn.to))
        .reduce((sum, connToCustomer) => {
            const customer = company.data.customers.find(cust => cust.id === connToCustomer.to);
            if (customer && customer.requirements.includes(itemName)) {
                // Prorate customer's total demand by the number of unique items they require
                return sum + (customer.demand / (customer.requirements.length || 1));
            }
            return sum;
        }, 0);

    // Determine the total capacity provided by suppliers for this specific item to this warehouse
    const totalSupplierCapacityForThisItem = company.data.connections
        .filter(conn => conn.to === warehouse.id && company.data.suppliers.some(s => s.id === conn.from))
        .reduce((sum, connFromSupplier) => {
            const supplier = company.data.suppliers.find(sup => sup.id === connFromSupplier.from);
            if (supplier && supplier.materialsSupplied.includes(storageItem.itemId)) {
                // Prorate supplier's total capacity by the number of unique materials they supply
                return sum + (supplier.supplyCapacity / (supplier.materialsSupplied.length || 1));
            }
            return sum;
        }, 0);

    // The actual daily outbound for this item from the warehouse
    const dailyOutbound = totalCustomerDemandForThisItem;

    // The actual daily inbound for this item to the warehouse, limited by supplier capacity
    const dailyInbound = totalSupplierCapacityForThisItem; 

    // Simulate inventory over time
    for (let i = 0; i <= forecastDays; i++) {
        data.push({
            day: i,
            inventory: Math.round(currentInventory)
        });
        currentInventory += (dailyInbound - dailyOutbound);
        // Inventory cannot go below zero
        if (currentInventory < 0) currentInventory = 0;
    }

    return data;
}

/**
 * A centralized function to recalculate all derived metrics for a given company.
 * This should be called after any state change that affects underlying data points.
 * @param company The company object to process.
 * @returns A new company object with updated metrics.
 */
export function recalculateAllMetrics(company: Company): Company {
    const newCompany = structuredClone(company);

    // 1. Recalculate metrics for each warehouse
    newCompany.data.warehouses.forEach(wh => {
        // a. Recalculate cost per order for the warehouse
        wh.metrics.costPerOrder.value =
            wh.metrics.costPerOrder.labor +
            wh.metrics.costPerOrder.packaging +
            wh.metrics.costPerOrder.shipping;
            
        // b. Recalculate workforce onTrack percentage
        const targetPicks = newCompany.data.networkMetrics.pickingSpeed.target || 35;
        // Avoid division by zero if target is not set
        const performanceRatio = targetPicks > 0 ? (wh.efficiency.picksPerHour / targetPicks) : 1;
        
        // Penalties for negative factors. e.g., 1% error rate = 2% penalty points.
        const errorPenalty = wh.efficiency.errorRate * 2;
        const reworkPenalty = wh.efficiency.rework * 1.5;
        const overtimePenalty = wh.efficiency.overtime * 1;

        // Base score is performance ratio (can exceed 100). Then apply penalties.
        let onTrackScore = (performanceRatio * 100) - errorPenalty - reworkPenalty - overtimePenalty;
        
        // Clamp the final score between 0 and 100
        wh.workforce.onTrack = Math.max(0, Math.min(100, Math.round(onTrackScore)));
    });

    // 2. Recalculate resilience scores for each supplier
    newCompany.data.suppliers.forEach(s => {
        // Example: 5 points penalty per hour of delay, 10 points per unit of variance
        s.resilienceScore = Math.max(0, 100 - (s.averageDelayHours * 5) - (s.deliveryTimeVariance * 10));
    });

    // 3. Recalculate network-level metrics (aggregates)
    const numWarehouses = newCompany.data.warehouses.length;
    if (numWarehouses > 0) {
        const totalDispatched = newCompany.data.warehouses.reduce((sum, wh) => sum + wh.dispatchedLast24h, 0);

        // Network Cost per Order (simple average)
        const totalCostPerOrder = newCompany.data.warehouses.reduce((sum, wh) => sum + wh.metrics.costPerOrder.value, 0);
        newCompany.data.networkMetrics.costPerOrder.value = totalCostPerOrder / numWarehouses;

        // Network OTIF (weighted by dispatch volume)
        if (totalDispatched > 0) {
            const weightedOtifSum = newCompany.data.warehouses.reduce((sum, wh) => sum + (wh.metrics.otif.value * wh.dispatchedLast24h), 0);
            newCompany.data.networkMetrics.otif.value = weightedOtifSum / totalDispatched;
        } else {
            // Fallback to simple average if no dispatches
            const simpleOtifSum = newCompany.data.warehouses.reduce((sum, wh) => sum + wh.metrics.otif.value, 0);
            newCompany.data.networkMetrics.otif.value = simpleOtifSum / numWarehouses;
        }
    }
    
    // Recalculate overall network resilience based on new supplier and warehouse scores
    const totalSupplierResilience = newCompany.data.suppliers.reduce((sum, s) => sum + s.resilienceScore, 0);
    const avgSupplierResilience = newCompany.data.suppliers.length > 0 ? totalSupplierResilience / newCompany.data.suppliers.length : 100;

    const totalWarehouseResilience = newCompany.data.warehouses.reduce((sum, wh) => sum + wh.resilienceScore, 0);
    const avgWarehouseResilience = newCompany.data.warehouses.length > 0 ? totalWarehouseResilience / newCompany.data.warehouses.length : 100;
    
    // Arbitrary weighting for network resilience
    newCompany.data.resilienceScore = Math.round((avgWarehouseResilience * 0.7) + (avgSupplierResilience * 0.3));

    return newCompany;
}