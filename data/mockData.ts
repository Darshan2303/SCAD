


import type { Company, ScenarioData } from '../types';

// FIX: Added missing properties to scenario data to match type definitions.
const innovateIncData: ScenarioData = {
    networkName: "Innovate Inc. Network",
    items: [
        { id: 'item-eb', name: 'Engine Blocks', sku: 'EB-001' },
        { id: 'item-ch', name: 'Chassis', sku: 'CH-002' },
        { id: 'item-mc', name: 'Microchips', sku: 'MC-003' },
    ],
    suppliers: [
        { id: 'sup-detroit', name: 'Detroit Parts Co.', location: { x: 10, y: 25 }, materialsSupplied: ['item-eb', 'item-ch'], username: 'detroit', password: 'detroit123', supplyCapacity: 10000, averageDelayHours: 0.5, deliveryTimeVariance: 1, resilienceScore: 95 },
    ],
    warehouses: [
        {
            id: 'wh-chicago',
            name: 'Chicago Warehouse',
            location: { x: 40, y: 25 },
            username: 'chicago',
            password: 'chicago123',
            storage: [
                { itemId: 'item-eb', itemName: 'Engine Blocks', quantity: 7000 }, 
                { itemId: 'item-ch', itemName: 'Chassis', quantity: 8000 }
            ],
            inventoryLevel: 15000,
            metrics: {
                otif: { value: 98.5, target: 95 },
                orderCycleTime: { value: 22, target: 24 },
                orderAccuracy: { value: 99.8, target: 99 },
                dockToStockTime: { value: 6, target: 8 },
                costPerOrder: { value: 135, target: 140, labor: 65, packaging: 20, shipping: 50 },
                inventoryTurnover: { value: 8.2, target: 9, stockoutRate: 0.5, overstockRate: 3, shrinkageRate: 0.2 },
                pickingSpeed: { value: 38, target: 35 },
                packingEfficiency: { value: 99, target: 97 },
                dispatchTimeliness: { value: 97, target: 95 }
            },
            dispatchedLast24h: 4800,
            dispatchDelayHours: 0,
            resilienceScore: 92,
            workforce: {
                active: 120,
                onTrack: 110,
            },
            efficiency: {
                picksPerHour: 42,
                errorRate: 1.2,
                rework: 0.8,
                overtime: 4,
            },
        },
    ],
    customers: [
        { id: 'cust-nyc', name: 'NYC Assembly Plant', location: { x: 85, y: 25 }, username: 'nyc', password: 'nyc123', demand: 4500, requirements: ['Engine Blocks', 'Chassis'], currentOrder: { id: 'ord-nyc-1', status: 'IN_TRANSIT' } },
    ],
    transportPersonnel: [
        { id: 'trans-1', name: 'John Doe', username: 't123', password: 't123' }
    ],
    connections: [
        { from: 'sup-detroit', to: 'wh-chicago', status: 'normal', transitTime: 12, capacity: 8000, utilization: 0.6 },
        { from: 'wh-chicago', to: 'cust-nyc', status: 'normal', transitTime: 24, capacity: 6000, utilization: 0.75 },
    ],
    dispatches: [
        {
            id: 'disp-1689020400000',
            type: 'SUPPLY',
            status: 'CREATED',
            itemId: 'item-eb',
            itemName: 'Engine Blocks',
            quantity: 500,
            fromId: 'sup-detroit',
            fromType: 'supplier',
            toId: 'wh-chicago',
            toType: 'warehouse',
            transportId: 'trans-1',
            isQrScanned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            qrCodePayload: JSON.stringify({
                v: 1,
                id: 'disp-1689020400000',
                from: 'sup-detroit',
                to: 'wh-chicago',
                item: 'item-eb',
                qty: 500,
                typ: 'SUPPLY'
            }),
            logs: [{
                actorId: 'sup-detroit',
                actorName: 'Detroit Parts Co.',
                actorRole: 'supplier',
                action: 'Dispatch Created',
                timestamp: new Date().toISOString()
            }]
        }
    ],
    networkMetrics: {
        otif: { value: 98.5, target: 95 },
        orderCycleTime: { value: 22, target: 24 },
        orderAccuracy: { value: 99.8, target: 99 },
        dockToStockTime: { value: 6, target: 8 },
        costPerOrder: { value: 135, target: 140, labor: 65, packaging: 20, shipping: 50 },
        inventoryTurnover: { value: 8.2, target: 9, stockoutRate: 0.5, overstockRate: 3, shrinkageRate: 0.2 },
        pickingSpeed: { value: 38, target: 35 },
        packingEfficiency: { value: 99, target: 97 },
        dispatchTimeliness: { value: 97, target: 95 }
    },
    resilienceScore: 94,
};

// FIX: Added missing `scenario` property to company object.
export const companies: Company[] = [
    {
        id: 'innovate-inc',
        name: 'Innovate Inc.',
        description: 'A modern, high-efficiency logistics network operating at peak performance.',
        data: structuredClone(innovateIncData),
    },
];