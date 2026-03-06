
import React, { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { Warehouse, Supplier, Customer, Company, Dispatch, Transport, CurrentUser, Node, Action } from './types';
import Header from './components/Header';
import Login from './components/Login';
import CompanySelector from './components/CompanySelector';
// FIX: Changed import of MainDashboard from default to named to resolve "has no default export" error.
import { MainDashboard } from './components/MainDashboard';
import TransportDashboard from './components/TransportDashboard';
import SettingsModal from './components/SettingsModal';
import { getCompanies } from './utils/api';
import { connectWebSocket, sendAction } from './utils/websocket';
import { db } from './utils/db';
import { companies as mockCompanies } from './data/mockData';
import { recalculateAllMetrics } from './utils/metricCalculations';

const companyReducer = (state: Company[], action: Action): Company[] => {
  if (action.type === 'SET_COMPANIES') {
    return action.payload.map(recalculateAllMetrics);
  }
  if (action.type === 'ADD_COMPANY') {
    const newCompany = recalculateAllMetrics(action.payload.companyData);
    return [...state, newCompany];
  }
  if (action.type === 'DELETE_COMPANY') {
    return state.filter(c => c.id !== action.payload.companyId);
  }

  return state.map(company => {
    if (company.id !== action.payload.companyId) return company;

    let newCompany = structuredClone(company);
    
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
            // Also remove connections
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
    
    // No more baseData to update since scenarios are removed
    return recalculateAllMetrics(newCompany);
  });
};


const App: React.FC = () => {
  const [companies, dispatch] = useReducer(companyReducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const [isWsConnected, setIsWsConnected] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(() => {
    return sessionStorage.getItem('gemini-api-key') || process.env.API_KEY || null;
  });

  useEffect(() => {
    // This effect synchronizes the application state with the local database (Dexie).
    // It triggers whenever the 'companies' state array is modified.
    // The '!isLoading' check prevents writing the initial state back to the DB immediately after loading,
    // avoiding potential race conditions or overwrites on startup.
    if (!isLoading && companies.length > 0) {
        db.companies.bulkPut(companies);
    }
  }, [companies, isLoading]);
  
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Try loading from local DB
            const localCompanies = await db.companies.toArray();
            if (localCompanies.length > 0) {
                dispatch({ type: 'SET_COMPANIES', payload: localCompanies });
            }

            // 2. Fetch from remote to get latest data
            const remoteCompanies = await getCompanies();
            if (remoteCompanies.length > 0) {
                await db.companies.bulkPut(remoteCompanies);
                dispatch({ type: 'SET_COMPANIES', payload: remoteCompanies });
            } else if (localCompanies.length === 0) {
                // 3. If remote is empty and local is empty, seed from mock
                await db.companies.bulkPut(mockCompanies);
                dispatch({ type: 'SET_COMPANIES', payload: mockCompanies });
            }
        } catch (error) {
            console.error("Failed to load data, will use offline/mock data:", error);
            const localCompanies = await db.companies.toArray();
            if (localCompanies.length === 0) {
                await db.companies.bulkPut(mockCompanies);
                dispatch({ type: 'SET_COMPANIES', payload: mockCompanies });
            }
        } finally {
            setIsLoading(false);
        }
    };
    loadData();

    // 2. Connect to WebSocket for real-time updates and status
    connectWebSocket({
      onStateUpdate: async (newCompaniesState: Company[]) => {
        console.log("Received state update from server. Updating local DB and UI.");
        await db.companies.bulkPut(newCompaniesState);
        dispatch({ type: 'SET_COMPANIES', payload: newCompaniesState });
      },
      onOpen: () => setIsWsConnected(true),
      onClose: () => setIsWsConnected(false),
    });
  }, []);

  const dispatchAction = useCallback((action: Action) => {
    dispatch(action);
    sendAction(action);
  }, []);

  const handleApiKeySave = (newKey: string) => {
    sessionStorage.setItem('gemini-api-key', newKey);
    setApiKey(newKey);
  };
  
  const handleLogin = (username: string, password: string) => {
    setLoginError(null);
    if (username === 'admin' && password === 'admin123') {
        setCurrentUser({ id: 'admin', name: 'Admin', role: 'admin' });
        return;
    }
    
    for (const company of companies) {
        const allEntities: (Supplier | Warehouse | Customer | Transport)[] = [
            ...company.data.suppliers, 
            ...company.data.warehouses, 
            ...company.data.customers,
            ...company.data.transportPersonnel
        ];
        
        for (const entity of allEntities) {
            if (entity.username === username && entity.password === password) {
                let role: NonNullable<CurrentUser>['role'];
                if ('materialsSupplied' in entity) role = 'supplier';
                else if ('storage' in entity) role = 'warehouse';
                else if ('transportPersonnel' in company.data && company.data.transportPersonnel.some(t => t.id === entity.id)) role = 'transport';
                else role = 'customer';
                
                const user = { id: entity.id, name: entity.name, role, companyId: company.id };
                setCurrentUser(user);
                setSelectedCompanyId(company.id);
                return;
            }
        }
    }
    setLoginError("Invalid username or password.");
  }

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedCompanyId(null);
  }
  
  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
  }

  const handleBackToSelector = () => {
    setSelectedCompanyId(null);
  }

  const [currentView, appContent] = useMemo(() => {
    let viewKey: string;
    let content: React.ReactNode;
    let viewType: 'auth' | 'dashboard' = 'dashboard'; // Default to dashboard style

    if (isLoading) {
        viewKey = 'loading';
        viewType = 'auth';
        content = (
            <div className="flex items-center justify-center min-h-screen">
                 <div className="relative">
                    <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-slate-300"></div>
                    <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-8 border-b-8 border-sky-500 animate-spin"></div>
                </div>
            </div>
        );
    } else if (!currentUser) {
        viewKey = 'login';
        viewType = 'auth';
        content = <Login onLogin={handleLogin} error={loginError} />;
    } else if (currentUser.role === 'admin' && !selectedCompanyId) {
        viewKey = 'selector';
        content = <CompanySelector companies={companies} onSelect={handleSelectCompany} dispatch={dispatchAction} apiKey={apiKey} />;
    } else {
        viewType = 'dashboard';
        const companyIdToShow = currentUser.role === 'admin' ? selectedCompanyId : currentUser.companyId;
        const company = companies.find(c => c.id === companyIdToShow);
        
        if (!company) {
             viewKey = 'error';
             content = <div>Error: Company data not found or you do not have access.</div>;
        } else if (currentUser.role === 'transport') {
            viewKey = `transport-${company.id}`;
            const transportUser = company.data.transportPersonnel.find(t => t.id === currentUser.id);
            if (transportUser) {
                content = <TransportDashboard company={company} transport={transportUser} dispatch={dispatchAction} currentUser={currentUser} />;
            }
        } else {
            viewKey = `dashboard-${company.id}`;
            content = <MainDashboard 
                company={company} 
                dispatch={dispatchAction}
                onBack={currentUser.role === 'admin' ? handleBackToSelector : undefined}
                currentUser={currentUser}
                apiKey={apiKey}
            />
        }
    }

    return [viewType, <div key={viewKey} className="animate-fade-in">{content}</div>];
  }, [isLoading, currentUser, selectedCompanyId, companies, loginError, dispatchAction, apiKey]);


  const mainClass = `min-h-screen transition-colors duration-500 ${currentView === 'auth' ? 'auth-view-bg' : ''}`;

  return (
      <div className={mainClass}>
        <Header 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          isWsConnected={isWsConnected} 
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          // Removed time simulation props
        />
        <main className="p-4 sm:p-6 lg:p-8">
          {appContent}
        </main>
        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)}
          currentApiKey={apiKey}
          onApiKeySave={handleApiKeySave}
        />
      </div>
  );
};

export default App;
