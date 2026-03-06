
export const metricExplanations: Record<string, string> = {
  // Network & High-Level Metrics
  otif: 'On-Time In-Full (OTIF) is the percentage of orders delivered to the correct destination, with the right quantity, and on the specified delivery date. It is a critical measure of customer satisfaction. The network OTIF is a weighted average of individual warehouse OTIFs, based on the number of units dispatched.',
  networkResilience: 'The network resilience score is a weighted average of the resilience scores of all warehouses (70% weight) and suppliers (30% weight). It measures the network\'s ability to withstand disruptions.',
  costPerOrder: 'Represents the average cost to fulfill an order across all warehouses in the network. It is calculated by averaging the \'Cost per Order\' from all individual warehouses, which includes labor, packaging, and shipping costs.',
  inventoryTurnover: 'Measures how many times inventory is sold or used in a time period. A higher number is generally better. This is the average turnover rate across all warehouses.',
  orderAccuracy: 'The percentage of orders fulfilled without any errors (e.g., wrong items, wrong quantities). A key component of customer satisfaction.',

  // Component Metrics for OTIF
  pickingSpeed: 'The average time it takes for a worker to pick the items for an order. Faster times contribute positively to OTIF.',
  packingEfficiency: 'The percentage of orders packed correctly and without damage. Efficiency here prevents delays and errors, boosting OTIF.',
  dispatchTimeliness: 'The percentage of orders that leave the warehouse on schedule. Delays in dispatch are a primary cause of late deliveries and lower OTIF scores.',
  
  // Node-Specific Resilience
  warehouseResilience: 'A warehouse\'s ability to handle disruptions. It\'s calculated as a blend of its inventory coverage (60% weight) and the average resilience of its connected suppliers (40% weight). Ample stock and reliable suppliers lead to a higher score.',
  supplierResilience: 'A supplier\'s reliability score. It starts at 100 and is penalized based on average delivery delays. Every hour of delay negatively impacts this score, indicating a higher risk of disruption.',

  // Warehouse-Specific Metrics
  dispatchDelayHours: 'The average delay in hours for dispatches from the warehouse. This is calculated based on capacity strain, where demand exceeding dispatch capacity leads to delays.',
  dispatchedLast24h: 'The total number of units shipped from this warehouse in the last 24 hours.',
  daysUntilStockout: 'The projected number of days until a warehouse\'s overall inventory is depleted, taking into account both daily inbound supply from suppliers and daily outbound demand from customers.',

  // Workforce Metrics
  workforceActive: 'The total number of active employees currently working in the selected warehouse.',
  workforceOnTrack: 'The percentage of the workforce meeting their primary productivity targets.',
  picksPerHour: 'The average number of items picked by each employee per hour. A measure of individual productivity.',
  errorRate: 'The percentage of orders that contain picking errors. A higher error rate can lead to increased rework costs and lower customer satisfaction.',
  rework: 'The percentage of orders that need to be re-processed due to errors. This directly impacts labor costs and efficiency.',
  overtime: 'The percentage of total work hours that are classified as overtime.',
};