
import { createServer } from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import type { ViteDevServer } from 'vite';
import type { Company, Action } from './types';
import { companies as mockCompanies } from './data/mockData';
import { recalculateAllMetrics } from './utils/metricCalculations';

// This is a simplified in-memory "database" for the dev server.
let companiesState: Company[] = structuredClone(mockCompanies);

// --- Reducer Logic (adapted to handle server-side state without scenarios) ---
const companyReducer = (state: Company[], action: Action): Company[] => {
    if (action.type === 'SET_COMPANIES') {
        // For SET_COMPANIES, assume payload is already the desired state
        return action.payload;
    }
    if (action.type === 'ADD_COMPANY') {
         // Apply metrics recalculation on the server as well for consistency
         const newCompany = recalculateAllMetrics(action.payload.companyData);
         return [...state, newCompany];
    }
    if (action.type === 'DELETE_COMPANY') return state.filter(c => c.id !== action.payload.companyId);

    return state.map(company => {
        if (company.id !== action.payload.companyId) return company;

        let newCompany = structuredClone(company); // Clone to ensure immutability
        
        switch (action.type) {
            case 'UPDATE_COMPANY_DATA':
                newCompany.data = { ...newCompany.data, ...action.payload.updatedData };
                break;
            case 'ADD_NODE': {
                const { nodeType, nodeData } = action.payload;
                const key = `${nodeType}s` as keyof typeof newCompany.data;
                if (Array.isArray(newCompany.data[key])) {
                    (newCompany.data[key] as any[]).push(nodeData);
                }
                break;
            }
            case 'UPDATE_NODE': {
                const { nodeType, nodeData } = action.payload;
                const key = `${nodeType}s` as keyof typeof newCompany.data;
                if (Array.isArray(newCompany.data[key])) {
                    const nodes = (newCompany.data[key] as any[]);
                    const index = nodes.findIndex(n => n.id === nodeData.id);
                    if (index !== -1) {
                        nodes[index] = nodeData;
                    }
                }
                break;
            }
            case 'DELETE_NODE': {
                const { nodeType, nodeId } = action.payload;
                const key = `${nodeType}s` as keyof typeof newCompany.data;
                if (Array.isArray(newCompany.data[key])) {
                    (newCompany.data as any)[key] = ((newCompany.data as any)[key]).filter((n: any) => n.id !== nodeId);
                    newCompany.data.connections = newCompany.data.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
                }
                break;
            }
            case 'UPDATE_CONNECTION': {
                const { connectionData } = action.payload;
                const index = newCompany.data.connections.findIndex(c => c.from === connectionData.from && c.to === connectionData.to);
                if (index !== -1) {
                    newCompany.data.connections[index] = connectionData;
                }
                break;
            }
            case 'UPDATE_NETWORK_METRIC_TARGET': {
                const { metricKey, newValue } = action.payload;
                if (metricKey in newCompany.data.networkMetrics) {
                    (newCompany.data.networkMetrics as any)[metricKey].target = newValue;
                }
                break;
            }
            case 'UPDATE_TRANSPORT_NODE': {
                const { transportData } = action.payload;
                const index = newCompany.data.transportPersonnel.findIndex(t => t.id === transportData.id);
                if (index !== -1) {
                    newCompany.data.transportPersonnel[index] = transportData;
                }
                break;
            }
            case 'CREATE_DISPATCH':
                newCompany.data.dispatches.unshift(action.payload.dispatch);
                break;
            case 'UPDATE_DISPATCH_STATUS': {
                const { dispatchId, newStatus, actor } = action.payload;
                const dispatch = newCompany.data.dispatches.find(d => d.id === dispatchId);
                if (dispatch) {
                    dispatch.status = newStatus;
                    dispatch.updatedAt = new Date().toISOString();
                    dispatch.logs.push({ ...actor, action: `Status updated to ${newStatus}`, timestamp: dispatch.updatedAt });
                }
                break;
            }
            case 'PROCESS_OUTBOUND_CREATION': {
                const { dispatch } = action.payload;
                newCompany.data.dispatches.unshift(dispatch);
                const warehouse = newCompany.data.warehouses.find(w => w.id === dispatch.fromId);
                if(warehouse) {
                    const itemInStorage = warehouse.storage.find(s => s.itemId === dispatch.itemId);
                    if(itemInStorage) itemInStorage.quantity -= dispatch.quantity;
                }
                break;
            }
            case 'PROCESS_INBOUND_SCAN': {
                const { dispatch } = action.payload;
                const targetDispatch = newCompany.data.dispatches.find(d => d.id === dispatch.id);
                if (targetDispatch && !targetDispatch.isQrScanned) {
                    targetDispatch.status = 'DELIVERED_TO_WAREHOUSE';
                    targetDispatch.isQrScanned = true;
                    targetDispatch.updatedAt = new Date().toISOString();
                    targetDispatch.logs.push({ ...action.payload.actor, action: 'Inbound Scanned & Verified', timestamp: targetDispatch.updatedAt });
                    
                    const warehouse = newCompany.data.warehouses.find(w => w.id === dispatch.toId);
                    if (warehouse) {
                        let itemInStorage = warehouse.storage.find(s => s.itemId === dispatch.itemId);
                        if (itemInStorage) {
                            itemInStorage.quantity += dispatch.quantity;
                        } else {
                            warehouse.storage.push({ itemId: dispatch.itemId, itemName: dispatch.itemName, quantity: dispatch.quantity });
                        }
                    }
                }
                break;
            }
        }
        // After any modification, recalculate all derived metrics before returning.
        return recalculateAllMetrics(newCompany);
    });
};
// --- End Reducer Logic ---

export const integratedServer = () => {
    return {
        name: 'integrated-server',
        configureServer(server: ViteDevServer) {
            const app = express();
            const wss = new WebSocketServer({ noServer: true });

            // API endpoint served by Express, relative to the base path '/api'
            app.get('/companies', (req, res) => {
                res.json(companiesState);
            });
            
            // Handle WebSocket connections
            wss.on('connection', ws => {
                console.log('[Server] Client connected.');
                ws.on('message', message => {
                    try {
                        const action: Action = JSON.parse(message.toString());
                        console.log('[Server] Received action:', action.type);
                        
                        // Apply the action to the server's state
                        companiesState = companyReducer(companiesState, action);
                        
                        // Broadcast the new state to all connected clients
                        wss.clients.forEach(client => {
                            if (client.readyState === 1) { // WebSocket.OPEN
                                client.send(JSON.stringify(companiesState));
                            }
                        });
                    } catch (e) {
                        console.error('[Server] Error processing message:', e);
                    }
                });
                ws.on('close', () => {
                    console.log('[Server] Client disconnected.');
                });
            });

            // Listen for the HTTP 'upgrade' event to handle WebSocket connections.
            server.httpServer?.on('upgrade', (request, socket, head) => {
                 if (request.url === '/app-ws') {
                    wss.handleUpgrade(request, socket as any, head, ws => {
                        wss.emit('connection', ws, request);
                    });
                }
            });

            // Use the Express app as middleware for Vite, but only for requests to '/api'
            server.middlewares.use('/api', app);
        }
    }
}
