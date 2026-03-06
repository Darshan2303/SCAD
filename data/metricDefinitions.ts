
export const metricDefinitions: Record<string, string> = {
  // Network & High-Level Metrics
  otif: 'On-Time In-Full: The percentage of orders delivered on time and with the correct items/quantities.',
  networkResilience: 'The network\'s overall ability to withstand and recover from disruptions.',
  costPerOrder: 'The average total cost to fulfill a single customer order across the network.',
  inventoryTurnover: 'How many times inventory is sold or used within a specific time period.',
  orderAccuracy: 'The percentage of orders fulfilled without any errors.',

  // Component Metrics
  pickingSpeed: 'The average number of items a worker picks per hour.',
  packingEfficiency: 'The percentage of orders packed correctly and without damage.',
  dispatchTimeliness: 'The percentage of orders that leave the warehouse on schedule.',
  
  // Node-Specific Resilience
  warehouseResilience: 'A warehouse\'s ability to handle disruptions, based on its inventory and supplier reliability.',
  supplierResilience: 'A supplier\'s reliability, primarily measured by their on-time delivery performance.',

  // Warehouse-Specific Metrics
  daysUntilStockout: 'The projected number of days until a warehouse\'s overall inventory is depleted, considering both incoming supply and outgoing demand.',

  // Workforce Metrics
  workforceActive: 'The number of employees currently active in the selected warehouse.',
  workforceOnTrack: 'The percentage of the workforce meeting their primary productivity targets.',
  picksPerHour: 'The average number of items picked by each employee per hour.',
  errorRate: 'The percentage of orders that contain picking or packing errors.',
  rework: 'The percentage of orders that need to be re-processed due to errors.',
  overtime: 'The percentage of total work hours classified as overtime.',
};