

// FIX: Added missing type definitions and properties to resolve compilation errors throughout the app.

export interface Location {
    x: number;
    y: number;
}

export interface StorageItem {
    itemId: string;
    itemName: string; // denormalized
    quantity: number;
}

export interface Item {
    id: string;
    name: string;
    sku: string;
}

export interface MetricDetail {
    value: number;
    target: number;
}

export interface CostMetric extends MetricDetail {
    labor: number;
    packaging: number;
    shipping: number;
}

export interface TurnoverMetric extends MetricDetail {
    stockoutRate: number;
    overstockRate: number;
    shrinkageRate: number;
}

export interface Metrics {
    otif: MetricDetail;
    orderCycleTime: MetricDetail;
    orderAccuracy: MetricDetail;
    dockToStockTime: MetricDetail;
    costPerOrder: CostMetric;
    inventoryTurnover: TurnoverMetric;
    pickingSpeed: MetricDetail;
    packingEfficiency: MetricDetail;
    dispatchTimeliness: MetricDetail;
}

export interface Warehouse {
  id:string;
  name: string;
  location: Location;
  storage: StorageItem[];
  username?: string;
  password?: string;
  inventoryLevel: number;
  metrics: Metrics;
  dispatchedLast24h: number;
  dispatchDelayHours: number;
  resilienceScore: number;
  workforce: {
    active: number;
    onTrack: number;
  };
  efficiency: {
    picksPerHour: number;
    errorRate: number;
    rework: number;
    overtime: number;
  };
}

export interface Supplier {
    id: string;
    name: string;
    location: Location;
    materialsSupplied: string[]; // item IDs
    username?: string;
    password?: string;
    supplyCapacity: number;
    averageDelayHours: number;
    deliveryTimeVariance: number;
    resilienceScore: number;
}

export interface Customer {
    id: string;
    name: string;
    location: Location;
    username?: string;
    password?: string;
    demand: number;
    requirements: string[]; // item names
    currentOrder: {
        id: string;
        status: string;
    };
}

export interface Transport {
    id: string;
    name: string;
    username?: string;
    password?: string;
}

export type DispatchStatus = 
    | 'CREATED'
    | 'ASSIGNED_TO_TRANSPORT'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'DELIVERED_TO_WAREHOUSE'
    | 'DELIVERED_TO_CONSUMER'
    | 'CANCELLED';

export type DispatchType = 'SUPPLY' | 'DELIVERY';

export interface Dispatch {
    id: string;
    type: DispatchType;
    status: DispatchStatus;
    itemId: string;
    itemName: string; // denormalized
    quantity: number;
    fromId: string;
    fromType: 'supplier' | 'warehouse';
    toId: string;
    toType: 'warehouse' | 'customer';
    transportId?: string;
    qrCodePayload: string;
    isQrScanned: boolean;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    logs: AuditLogEntry[];
}

export interface AuditLogEntry {
    actorId: string;
    actorName: string;
    actorRole: string;
    action: string;
    timestamp: string;
}


export interface Connection {
    from: string;
    to: string;
    status: 'normal' | 'delayed';
    transitTime: number;
    capacity: number;
    utilization?: number;
}

export interface ScenarioData {
  networkName: string;
  items: Item[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  customers: Customer[];
  transportPersonnel: Transport[];
  connections: Connection[];
  dispatches: Dispatch[];
  networkMetrics: Metrics;
  resilienceScore: number;
}

export interface Company {
    id: string;
    name: string;
    description: string;
    data: ScenarioData;
}

export type Node = Supplier | Warehouse | Customer;
export type NodeType = 'supplier' | 'warehouse' | 'customer';

export type CurrentUser = {
  id: string;
  name: string;
  role: 'admin' | 'supplier' | 'warehouse' | 'customer' | 'transport';
  companyId?: string;
} | null;

// This type is used by both the client-side reducer and the server-side state management.
export type Action =
  | { type: 'SET_COMPANIES'; payload: Company[] }
  | { type: 'ADD_COMPANY'; payload: { companyData: Company } }
  | { type: 'DELETE_COMPANY', payload: { companyId: string } }
  | { type: 'UPDATE_NODE'; payload: { companyId: string; nodeType: string; nodeData: Node } }
  | { type: 'ADD_NODE'; payload: { companyId: string; nodeType: string; nodeData: Node } }
  | { type: 'DELETE_NODE'; payload: { companyId: string; nodeType: string; nodeId: string } }
  | { type: 'UPDATE_TRANSPORT_NODE', payload: { companyId: string; transportData: Transport } }
  | { type: 'UPDATE_CONNECTION'; payload: { companyId: string; connectionData: any } }
  | { type: 'UPDATE_COMPANY_DATA'; payload: { companyId: string; updatedData: any } }
  | { type: 'UPDATE_NETWORK_METRIC_TARGET'; payload: { companyId: string; metricKey: string; newValue: number } }
  | { type: 'CREATE_DISPATCH'; payload: { companyId: string; dispatch: Dispatch } }
  | { type: 'UPDATE_DISPATCH_STATUS'; payload: { companyId: string; dispatchId: string; newStatus: any, actor: any } }
  | { type: 'PROCESS_INBOUND_SCAN'; payload: { companyId: string; dispatch: Dispatch, actor: any } }
  | { type: 'PROCESS_OUTBOUND_CREATION'; payload: { companyId: string; dispatch: Dispatch, actor: any } };


export interface TooltipContextType {
  showTooltip: (content: string, rect: DOMRect) => void;
  hideTooltip: () => void;
}

export interface AIAnalysisRisk {
    title: string;
    description: string;
    severity: 'High' | 'Medium' | 'Low';
}

export interface AIAnalysisRecommendation {
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
}

export interface AIAnalysisResult {
    risks: AIAnalysisRisk[];
    recommendations: AIAnalysisRecommendation[];
}