
import * as XLSX from 'xlsx';
import type { Company, ScenarioData, Supplier, Warehouse, Customer, Connection, StorageItem, Item, Transport, Dispatch } from '../types';

// Function to generate and download the Excel template
export const generateExcelTemplate = () => {
    // 1. Create a new workbook
    const wb = XLSX.utils.book_new();

    // 2. Define headers and example data for each sheet
    const companyInfoSheet = [
        { "Key": "Company Name", "Value": "My Awesome Company" },
        { "Key": "Description", "Value": "A description of the supply chain network." }
    ];
    
    const networkTargetsSheetData = [
        { Metric: "OTIF (%)", Target: 95 },
        { Metric: "Order Cycle Time (hrs)", Target: 24 },
        { Metric: "Order Accuracy (%)", Target: 99 },
        { Metric: "Dock to Stock Time (hrs)", Target: 8 },
        { Metric: "Cost per Order (₹)", Target: 150 },
        { Metric: "Inventory Turnover (x)", Target: 10 },
        { Metric: "Picking Speed (u/hr)", Target: 35 },
        { Metric: "Packing Efficiency (%)", Target: 97 },
        { Metric: "Dispatch Timeliness (%)", Target: 95 },
    ];

    const suppliersSheet = [{
        id: "sup-1",
        name: "Main Supplier",
        username: "supplier_user",
        password: "password123",
        supplyCapacity: 10000,
        materialsSupplied: "parts-A, parts-B",
        averageDelayHours: 0.5,
        deliveryTimeVariance: 1.2
    }];
    
    // Note: for simplicity we'll ask for some efficiency metrics, the rest will be defaulted
    const warehousesSheet = [{
        id: "wh-1",
        name: "Central Warehouse",
        username: "warehouse_user",
        password: "password123",
        inventoryLevel: 25000,
        storage: '[{"itemId":"parts-A", "itemName": "Part A", "quantity":15000},{"itemId":"parts-B", "itemName":"Part B", "quantity":10000}]',
        dispatchedLast24h: 5000,
        workforce_active: 100,
        efficiency_picksPerHour: 35,
        efficiency_errorRate: 2,
        efficiency_rework: 5,
        efficiency_overtime: 3,
        cost_labor: 70,
        cost_packaging: 20,
        cost_shipping: 50,
    }];

    const customersSheet = [{
        id: "cust-1",
        name: "Primary Customer",
        username: "customer_user",
        password: "password123",
        demand: 4500,
        requirements: "Part A, Part B"
    }];

    const connectionsSheet = [
        { from_id: "sup-1", to_id: "wh-1", transitTime: 24, capacity: 12000 },
        { from_id: "wh-1", to_id: "cust-1", transitTime: 12, capacity: 6000 }
    ];

    // 3. Create worksheets from the data
    const wsCompany = XLSX.utils.json_to_sheet(companyInfoSheet);
    const wsNetworkTargets = XLSX.utils.json_to_sheet(networkTargetsSheetData);
    const wsSuppliers = XLSX.utils.json_to_sheet(suppliersSheet);
    const wsWarehouses = XLSX.utils.json_to_sheet(warehousesSheet);
    const wsCustomers = XLSX.utils.json_to_sheet(customersSheet);
    const wsConnections = XLSX.utils.json_to_sheet(connectionsSheet);

    // 4. Append worksheets to the workbook
    XLSX.utils.book_append_sheet(wb, wsCompany, "Company Info");
    XLSX.utils.book_append_sheet(wb, wsNetworkTargets, "Network Targets");
    XLSX.utils.book_append_sheet(wb, wsSuppliers, "Suppliers");
    XLSX.utils.book_append_sheet(wb, wsWarehouses, "Warehouses");
    XLSX.utils.book_append_sheet(wb, wsCustomers, "Customers");
    XLSX.utils.book_append_sheet(wb, wsConnections, "Connections");

    // 5. Trigger the download
    XLSX.writeFile(wb, "SupplyChainTemplate.xlsx");
};


// Helper to normalize keys from Excel sheet headers to handle variations
const normalizeObjectKeys = (data: any[], keyMap: Record<string, string>): any[] => {
    return data.map(row => {
        const newRow: { [key: string]: any } = {};
        for (const key in row) {
            // Normalize the header key: lowercase and remove all non-alphanumeric chars
            const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            const targetKey = keyMap[normalizedKey];
            if (targetKey) {
                newRow[targetKey] = row[key];
            } else {
                // Keep original key if no mapping is found, in case it's already correct
                newRow[key] = row[key];
            }
        }
        return newRow;
    });
};

const supplierKeyMap: Record<string, string> = {
    'id': 'id',
    'name': 'name',
    'username': 'username',
    'password': 'password',
    'supplycapacity': 'supplyCapacity',
    'materialssupplied': 'materialsSupplied',
    'averagedelayhours': 'averageDelayHours',
    'deliverytimevariance': 'deliveryTimeVariance'
};

const warehouseKeyMap: Record<string, string> = {
    'id': 'id',
    'name': 'name',
    'username': 'username',
    'password': 'password',
    'inventorylevel': 'inventoryLevel',
    'storage': 'storage',
    'dispatchedlast24h': 'dispatchedLast24h',
    'workforceactive': 'workforce_active',
    'efficiencypicksperhour': 'efficiency_picksPerHour',
    'efficiencyerrorrate': 'efficiency_errorRate',
    'efficiencyrework': 'efficiency_rework',
    'efficiencyovertime': 'efficiency_overtime',
    'costlabor': 'cost_labor',
    'costpackaging': 'cost_packaging',
    'costshipping': 'cost_shipping'
};

const customerKeyMap: Record<string, string> = {
    'id': 'id',
    'name': 'name',
    'username': 'username',
    'password': 'password',
    'demand': 'demand',
    'requirements': 'requirements'
};

const connectionKeyMap: Record<string, string> = {
    'fromid': 'from_id',
    'toid': 'to_id',
    'transittime': 'transitTime',
    'capacity': 'capacity'
};

// Function to parse the uploaded Excel file into a Company object
export const parseExcelToCompany = (file: File): Promise<Company> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const wb = XLSX.read(data, { type: 'array' });

                // Parse each sheet
                const companyInfo = XLSX.utils.sheet_to_json<any>(wb.Sheets["Company Info"]);
                const networkTargetsData = wb.Sheets["Network Targets"] ? XLSX.utils.sheet_to_json<any>(wb.Sheets["Network Targets"]) : [];
                const suppliersDataRaw = XLSX.utils.sheet_to_json<any>(wb.Sheets["Suppliers"]);
                const warehousesDataRaw = XLSX.utils.sheet_to_json<any>(wb.Sheets["Warehouses"]);
                const customersDataRaw = XLSX.utils.sheet_to_json<any>(wb.Sheets["Customers"]);
                const connectionsDataRaw = XLSX.utils.sheet_to_json<any>(wb.Sheets["Connections"]);

                // Normalize headers to handle variations
                const suppliersData = normalizeObjectKeys(suppliersDataRaw, supplierKeyMap);
                const warehousesData = normalizeObjectKeys(warehousesDataRaw, warehouseKeyMap);
                const customersData = normalizeObjectKeys(customersDataRaw, customerKeyMap);
                const connectionsData = normalizeObjectKeys(connectionsDataRaw, connectionKeyMap);

                const companyName = companyInfo.find(row => row.Key === "Company Name")?.Value || "Unnamed Company";
                const description = companyInfo.find(row => row.Key === "Description")?.Value || "";

                // --- START: Robust Item Collection from all sources ---
                const allItemsMap = new Map<string, Item>(); // itemId -> Item object

                // 1. Collect items from Suppliers (by ID)
                suppliersData.forEach(row => {
                    const materials = String(row.materialsSupplied || '').split(',').map((s:string) => s.trim()).filter(Boolean);
                    materials.forEach(materialId => {
                        if (materialId && !allItemsMap.has(materialId)) {
                            // Assume item ID is also a reasonable default name if no other name is found
                            allItemsMap.set(materialId, { id: materialId, name: materialId, sku: '' });
                        }
                    });
                });

                // 2. Collect/refine items from Warehouses (by ID and Name)
                const parsedWarehouses = warehousesData.map((row, index) => {
                    let storage: StorageItem[] = [];
                    try {
                        if (row.storage) {
                            const rawStorage: { itemId: string; itemName?: string; quantity: number }[] = JSON.parse(row.storage);
                            storage = rawStorage.map(sItem => {
                                // Prioritize provided itemName, then existing map name, then itemId as fallback
                                let resolvedItemName = sItem.itemName || (allItemsMap.has(sItem.itemId) ? allItemsMap.get(sItem.itemId)!.name : sItem.itemId);
                                
                                // Update/add to master list
                                if (sItem.itemId) {
                                  allItemsMap.set(sItem.itemId, { id: sItem.itemId, name: resolvedItemName, sku: '' });
                                }
                                return { ...sItem, itemName: resolvedItemName }; // Ensure itemName is always set in storage
                            });
                        }
                    } catch (err) {
                        console.error("Could not parse storage JSON for warehouse:", row.name, err);
                    }
                    
                    const laborCost = Number(row.cost_labor) || 70;
                    const packagingCost = Number(row.cost_packaging) || 20;
                    const shippingCost = Number(row.cost_shipping) || 50;

                    return {
                        id: row.id || `wh-${index}`,
                        name: row.name,
                        username: row.username,
                        password: row.password,
                        location: { x: 45, y: Math.random() * 80 + 10 },
                        inventoryLevel: Number(row.inventoryLevel) || 0,
                        storage, // Use the processed storage
                        dispatchedLast24h: Number(row.dispatchedLast24h) || 0,
                        dispatchDelayHours: 0,
                        resilienceScore: 100,
                        workforce: {
                            active: Number(row.workforce_active) || 0,
                            onTrack: 0, // default, will be recalculated
                        },
                        efficiency: {
                            picksPerHour: Number(row.efficiency_picksPerHour) || 0,
                            errorRate: Number(row.efficiency_errorRate) || 0,
                            rework: Number(row.efficiency_rework) || 0,
                            overtime: Number(row.efficiency_overtime) || 0,
                        },
                        metrics: {
                            otif: { value: 95, target: 95 }, 
                            orderCycleTime: { value: 24, target: 24 }, 
                            orderAccuracy: { value: 99, target: 99 }, 
                            dockToStockTime: { value: 8, target: 8 },
                            costPerOrder: { 
                                value: 140, // Will be recalculated
                                target: 140, 
                                labor: laborCost, 
                                packaging: packagingCost, 
                                shipping: shippingCost,
                            },
                            inventoryTurnover: { value: 0, target: 9, stockoutRate: 0, overstockRate: 0, shrinkageRate: 0 },
                            pickingSpeed: { value: 35, target: 35 },
                            packingEfficiency: { value: 97, target: 97 },
                            dispatchTimeliness: { value: 95, target: 95 }
                        }
                    };
                });


                // 3. Collect/refine items from Customers (by Name)
                const parsedCustomers = customersData.map((row, index) => {
                    const requirements = String(row.requirements || '').split(',').map((s:string) => s.trim()).filter(Boolean);
                    requirements.forEach(reqName => {
                        // Check if an item with this name already exists (case-insensitive for comparison)
                        const existingItem = Array.from(allItemsMap.values()).find(item => item.name.toLowerCase() === reqName.toLowerCase());
                        if (!existingItem) {
                            // If customer requires an item not yet seen, add it. Generate a simple ID.
                            const newId = reqName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
                            allItemsMap.set(newId, { id: newId, name: reqName, sku: '' });
                        }
                    });
                    return {
                        id: row.id || `cust-${index}`,
                        name: row.name,
                        username: row.username,
                        password: row.password,
                        location: { x: 85, y: Math.random() * 80 + 10 },
                        demand: Number(row.demand) || 0,
                        requirements, // Use the processed requirements
                        currentOrder: { id: `ord-${index}`, status: 'Pending' }
                    };
                });
                
                const finalItems: Item[] = Array.from(allItemsMap.values());
                // --- END: Robust Item Collection ---

                const suppliers: Supplier[] = suppliersData.map((row, index) => ({
                    id: row.id || `sup-${index}`,
                    name: row.name,
                    username: row.username,
                    password: row.password,
                    location: { x: 10, y: Math.random() * 80 + 10 },
                    supplyCapacity: Number(row.supplyCapacity) || 0,
                    materialsSupplied: String(row.materialsSupplied || '').split(',').map((s:string) => s.trim()).filter(Boolean),
                    averageDelayHours: Number(row.averageDelayHours) || 0,
                    deliveryTimeVariance: Number(row.deliveryTimeVariance) || 1,
                    resilienceScore: 100 // default, will be recalculated
                }));

                const connections: Connection[] = connectionsData.map(row => ({
                    from: row.from_id,
                    to: row.to_id,
                    status: 'normal',
                    transitTime: Number(row.transitTime) || 24,
                    capacity: Number(row.capacity) || 0,
                }));

                const getTarget = (metricName: string, defaultValue: number): number => {
                    const row = networkTargetsData.find((r: any) => r.Metric && r.Metric.toLowerCase().includes(metricName.toLowerCase()));
                    return row && !isNaN(Number(row.Target)) ? Number(row.Target) : defaultValue;
                };

                const initialData: ScenarioData = {
                    networkName: `${companyName} Network`,
                    networkMetrics: { // Will be recalculated
                        otif: { value: 100, target: getTarget("otif", 95) }, 
                        orderCycleTime: { value: 0, target: getTarget("order cycle time", 24) }, 
                        orderAccuracy: { value: 100, target: getTarget("order accuracy", 99) }, 
                        dockToStockTime: { value: 0, target: getTarget("dock to stock time", 8) },
                        costPerOrder: { value: 0, target: getTarget("cost per order", 150), labor: 0, packaging: 0, shipping: 0 },
                        inventoryTurnover: { value: 0, target: getTarget("inventory turnover", 10), stockoutRate: 0, overstockRate: 0, shrinkageRate: 0 },
                        pickingSpeed: { value: 0, target: getTarget("picking speed", 35) },
                        packingEfficiency: { value: 100, target: getTarget("packing efficiency", 97) },
                        dispatchTimeliness: { value: 100, target: getTarget("dispatch timeliness", 95) }
                    },
                    resilienceScore: 100,
                    suppliers, // Use the newly mapped suppliers
                    warehouses: parsedWarehouses, // Use the newly parsed warehouses
                    customers: parsedCustomers, // Use the newly parsed customers
                    connections,
                    items: finalItems, // Populate the items array!
                    transportPersonnel: [],
                    dispatches: [],
                };

                const newCompany: Company = {
                    id: `${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                    name: companyName,
                    description,
                    data: initialData,
                };

                resolve(newCompany);

            } catch (err) {
                console.error("Error parsing Excel file:", err);
                reject(new Error("Failed to parse Excel file. Please check the format."));
            }
        };

        reader.onerror = (err) => {
            reject(new Error("Failed to read the file."));
        };

        reader.readAsArrayBuffer(file);
    });
};