

import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import type { Node as NodeType, NodeType as NodeTypeString, Warehouse, Supplier, Customer, Company, Connection } from '../types';
import { SupplierIcon, WarehouseIcon, CustomerIcon, PlusIcon, EditIcon, DeleteIcon, ShieldIcon, InfoIcon, CheckCircleIcon, TruckIcon, AlertTriangleIcon } from './Icons';
import NodeModal from './NodeModal';
import ConnectionModal from './ConnectionModal';
import ConfirmationDialog from './ConfirmationDialog';
import ColorKey from './ColorKey';
import { useExplanation } from './ExplanationProvider';
import { useTooltip } from './TooltipProvider';
import { metricDefinitions } from '../data/metricDefinitions';


interface NetworkGraphProps {
  company: Company;
  onSelectNode: (node: NodeType) => void;
  dispatch: React.Dispatch<any>;
}

interface LineData {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    isDelayed: boolean;
    connection: Connection;
}

const ResilienceBadge: React.FC<{ score: number, metricKey: string, company: Company, node: NodeType }> = ({ score, metricKey, company, node }) => {
    const { showExplanation } = useExplanation();
    const { showTooltip, hideTooltip } = useTooltip();
    const badgeRef = useRef<HTMLButtonElement>(null);

    let colorClass = 'text-slate-400';
    let title = 'Resilience: Unknown';
    if (score >= 80) {
        colorClass = 'text-emerald-500';
        title = `Resilience: High (${score})`;
    } else if (score >= 50) {
        colorClass = 'text-amber-500';
        title = `Resilience: Medium (${score})`;
    } else {
        colorClass = 'text-rose-500'; 
        title = `Resilience: Low (${score})`;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        showExplanation(metricKey, company, node, `Resilience Score (${score})`);
    };

    const handleHover = () => {
        const definition = metricDefinitions[metricKey];
        if (definition && badgeRef.current) {
            showTooltip(definition, badgeRef.current.getBoundingClientRect());
        }
    };

    return (
        <button 
            ref={badgeRef}
            onClick={handleClick} 
            onMouseEnter={handleHover}
            onMouseLeave={hideTooltip}
            className="absolute -top-1.5 -left-1.5 z-10 p-1 bg-white/50 rounded-full" 
            title={title}
        >
            <ShieldIcon className={`w-5 h-5 ${colorClass}`} />
        </button>
    );
};

const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    let colorClass = 'bg-slate-100 text-slate-700';
    let icon = <InfoIcon className="w-3.5 h-3.5" />;
    
    switch (status.toLowerCase()) {
        case 'delivered':
            colorClass = 'bg-emerald-100 text-emerald-800';
            icon = <CheckCircleIcon className="w-3.5 h-3.5" />;
            break;
        case 'in transit':
            colorClass = 'bg-sky-100 text-sky-800';
            icon = <TruckIcon className="w-3.5 h-3.5" />;
            break;
        case 'delayed': 
            colorClass = 'bg-rose-100 text-rose-800'; 
            icon = <AlertTriangleIcon className="w-3.5 h-3.5" />;
            break;
    }
    
    return (
        <div className={`absolute bottom-3 left-3 text-xs font-semibold inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${colorClass}`}>
            {icon}
            <span>{status}</span>
        </div>
    );
};


const GraphNode = React.forwardRef<HTMLDivElement, {
    node: NodeType;
    type: NodeTypeString;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    company: Company;
}>(({ node, type, onClick, onEdit, onDelete, company }, ref) => {
    let icon, iconBgColor;
    if (type === 'supplier') {
      icon = <SupplierIcon className="w-6 h-6 text-teal-600" />; 
      iconBgColor = 'bg-teal-100';
    } else if (type === 'customer') {
      icon = <CustomerIcon className="w-6 h-6 text-violet-600" />; 
      iconBgColor = 'bg-violet-100';
    } else {
      icon = <WarehouseIcon className="w-6 h-6 text-amber-600" />; 
      iconBgColor = 'bg-amber-100';
    }

    const baseClasses = "relative bg-white border-2 rounded-xl p-3 w-full text-left transition-all duration-300 shadow-sm cursor-pointer";
    
    // Removed problemState and criticalDelay logic as scenarios are deprecated.
    // Nodes will have a default border style unless other conditions apply.
    let stateClasses = "border-slate-200/80"; 
    
    const clickableClasses = "hover:shadow-lg hover:border-sky-300 hover:-translate-y-px transform"; 

    const customerDemand = type === 'customer' ? (node as Customer).demand : 0;
    const demandBars = [];
    if (customerDemand > 0) demandBars.push(<div key="1" className="w-1.5 h-2 rounded-t-sm bg-violet-400/70"></div>); 
    if (customerDemand >= 5000) demandBars.push(<div key="2" className="w-1.5 h-3 rounded-t-sm bg-violet-400/85"></div>);
    if (customerDemand >= 10000) demandBars.push(<div key="3" className="w-1.5 h-4 rounded-t-sm bg-violet-400"></div>);

    const hasResilienceScore = 'resilienceScore' in node;
    const resilienceKey = type === 'warehouse' ? 'warehouseResilience' : 'supplierResilience';

    return (
        <div
            ref={ref}
            className={`relative group ${baseClasses} ${stateClasses} ${clickableClasses}`}
            onClick={onClick}
        >
            {hasResilienceScore && <ResilienceBadge score={(node as Warehouse | Supplier).resilienceScore} metricKey={resilienceKey} company={company} node={node} />}
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${iconBgColor}`}>
                    {icon}
                </div>
                <div>
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        {node.name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{type}</p>
                </div>
            </div>

            {type === 'customer' && <OrderStatusBadge status={(node as Customer).currentOrder.status} />}

            {type === 'customer' && (
                 <div className="absolute bottom-2 right-3 flex items-end gap-0.5 h-4" title={`Daily Demand: ${customerDemand.toLocaleString()}`}>
                    {demandBars}
                </div>
            )}

            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-md bg-white hover:bg-slate-200 text-slate-600 border border-slate-300 shadow-sm"><EditIcon /></button>
                 <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-md bg-white hover:bg-rose-100 text-slate-600 hover:text-rose-700 border border-slate-300 shadow-sm"><DeleteIcon /></button> 
            </div>
            {type === 'supplier' && (
                <div className="absolute bottom-full mb-2 w-max left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs rounded-md py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                    Avg. Delay: <strong>{(node as Supplier).averageDelayHours.toFixed(1)} hrs</strong>
                </div>
            )}
        </div>
    );
});


const NetworkGraph: React.FC<NetworkGraphProps> = ({ company, onSelectNode, dispatch }) => {
    const { data } = company; 
    const nodeRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<LineData[]>([]);
    
    const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
    const [nodeModalConfig, setNodeModalConfig] = useState<{ type: NodeTypeString; node?: NodeType } | null>(null);
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [nodeToDelete, setNodeToDelete] = useState<{id: string, type: NodeTypeString} | null>(null);

    const { minCapacity, maxCapacity } = useMemo(() => {
        const capacities = data.connections.map(c => c.capacity);
        if (capacities.length === 0) {
            return { minCapacity: 0, maxCapacity: 10000 };
        }
        return {
            minCapacity: Math.min(...capacities),
            maxCapacity: Math.max(...capacities),
        };
    }, [data.connections]);

    const getStrokeWidthFromCapacity = (capacity: number) => {
        if (maxCapacity <= minCapacity) {
            return 4;
        }
        const minStroke = 2;
        const maxStroke = 8;
        const normalizedCapacity = (capacity - minCapacity) / (maxCapacity - minCapacity);
        return (minStroke + (normalizedCapacity * (maxStroke - minStroke))) || minStroke;
    };


    useLayoutEffect(() => {
        const calculateLines = () => {
            const newLines: LineData[] = [];
            const container = containerRef.current;
            if (!container) return;

            const containerRect = container.getBoundingClientRect();

            data.connections.forEach(conn => {
                const fromNodeEl = nodeRefs.current.get(conn.from);
                const toNodeEl = nodeRefs.current.get(conn.to);

                if (fromNodeEl && toNodeEl) {
                    const fromRect = fromNodeEl.getBoundingClientRect();
                    const toRect = toNodeEl.getBoundingClientRect();

                    const x1 = fromRect.right - containerRect.left;
                    const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
                    const x2 = toRect.left - containerRect.left;
                    const y2 = toRect.top + toRect.height / 2 - containerRect.top;

                    // isDelayed now only depends on connection status, not global scenario
                    const isDelayed = conn.status === 'delayed'; 

                    newLines.push({ key: `${conn.from}-${conn.to}`, x1, y1, x2, y2, isDelayed, connection: conn });
                }
            });
            setLines(newLines);
        };
        
        const timer = setTimeout(calculateLines, 100);
        window.addEventListener('resize', calculateLines);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateLines);
        }
    }, [data]); 

    const openNodeModal = (type: NodeTypeString, node?: NodeType) => {
        setNodeModalConfig({ type, node });
        setIsNodeModalOpen(true);
    };
    const closeNodeModal = () => {
        setIsNodeModalOpen(false);
        setNodeModalConfig(null);
    };
    const handleNodeSubmit = (nodeData: NodeType, connections?: { suppliers: string[], customers: string[] }) => {
        const actionType = nodeModalConfig?.node ? 'UPDATE_NODE' : 'ADD_NODE';
        dispatch({ type: actionType, payload: { companyId: company.id, nodeType: nodeModalConfig!.type, nodeData } });
        
        if (nodeModalConfig?.type === 'warehouse' && connections) {
             const newConnections = [
                ...data.connections.filter(c => c.from !== nodeData.id && c.to !== nodeData.id),
                ...connections.suppliers.map(sId => ({ from: sId, to: nodeData.id, status: 'normal', transitTime: 24, capacity: 5000 })),
                ...connections.customers.map(cId => ({ from: nodeData.id, to: cId, status: 'normal', transitTime: 24, capacity: 5000 })),
            ];
             dispatch({ type: 'UPDATE_COMPANY_DATA', payload: { companyId: company.id, updatedData: { connections: newConnections } } });
        }
        closeNodeModal();
    };
    
    const openConnectionModal = (connection: Connection) => {
        setSelectedConnection(connection);
        setIsConnectionModalOpen(true);
    };
    const closeConnectionModal = () => {
        setIsConnectionModalOpen(false);
        setSelectedConnection(null);
    };
    const handleConnectionSubmit = (connectionData: Connection) => {
        dispatch({ type: 'UPDATE_CONNECTION', payload: { companyId: company.id, connectionData } });
        closeConnectionModal();
    };

    const openConfirmDialog = (id: string, type: NodeTypeString) => {
        setNodeToDelete({id, type});
        setIsConfirmOpen(true);
    }
    const handleDeleteConfirm = () => {
        if (nodeToDelete) {
            dispatch({ type: 'DELETE_NODE', payload: { companyId: company.id, nodeId: nodeToDelete.id, nodeType: nodeToDelete.type } });
        }
        setIsConfirmOpen(false);
        setNodeToDelete(null);
    }
    
    const getUtilizationClasses = (utilization: number) => {
      if (utilization > 0.9) return 'stroke-rose-400 text-rose-400'; 
      if (utilization > 0.7) return 'stroke-amber-400 text-amber-400'; 
      return 'stroke-cyan-400 text-cyan-400'; 
    };

    const nodeCategories = [
        { title: 'Suppliers', nodes: data.suppliers, type: 'supplier' as const },
        { title: 'Warehouses', nodes: data.warehouses, type: 'warehouse' as const },
        { title: 'Customers', nodes: data.customers, type: 'customer' as const },
    ];
    
  return (
    <>
    <div className="relative bg-blue-50/50 p-4 rounded-xl border border-blue-100 min-h-[70vh] shadow-inner overflow-hidden"> 
      <div 
          ref={containerRef}
          className="relative w-full h-full rounded-md"
          style={{
            backgroundImage: 'radial-gradient(circle at center, #E0F2FE 1px, transparent 1px)', 
            backgroundSize: '3rem 3rem',
            backgroundColor: '#F8FAFC'
          }}
        >
        <svg width="100%" height="100%" className="absolute inset-0 z-0">
            <defs>
                <marker id="arrow-normal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
            </defs>
            {lines.map((line) => {
                const utilization = line.connection.utilization || 0;
                const colorClasses = line.isDelayed ? 'stroke-orange-300 text-orange-300' : getUtilizationClasses(utilization); 
                const strokeWidth = getStrokeWidthFromCapacity(line.connection.capacity);
                
                return (
                    <g key={line.key} className="cursor-pointer group" onClick={() => openConnectionModal(line.connection)}>
                        <line
                            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                            stroke="transparent"
                            strokeWidth="16"
                        />
                        <line
                            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                            className={`${colorClasses} transition-all duration-300 fill-current group-hover:stroke-emerald-400 group-hover:text-emerald-400`}
                            strokeWidth={strokeWidth}
                            markerEnd="url(#arrow-normal)"
                            strokeDasharray={line.isDelayed ? '8 6' : 'none'}
                        />
                     </g>
                );
            })}
        </svg>

        <div className="relative z-10 grid grid-cols-3 gap-8 md:gap-16 items-start h-full px-4 md:px-8 pt-12 pb-64">
            {nodeCategories.map(category => (
                 <div key={category.title} className="space-y-8 flex flex-col items-center justify-center min-h-[60vh]">
                     {category.nodes.map(node => (
                        <GraphNode 
                            key={node.id} 
                            ref={el => { nodeRefs.current.set(node.id, el); }}
                            node={node} 
                            type={category.type}
                            onClick={() => onSelectNode(node)}
                            onEdit={() => openNodeModal(category.type, node)}
                            onDelete={() => openConfirmDialog(node.id, category.type)}
                            company={company} 
                        />
                     ))}
                     <button onClick={() => openNodeModal(category.type)} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:text-emerald-500 text-slate-500 font-semibold rounded-lg p-4 transition-all duration-300 hover:bg-white hover:shadow-sm"> 
                        <PlusIcon /> Add {category.title.slice(0, -1)}
                     </button>
                 </div>
            ))}
        </div>
      </div>
      <ColorKey />
    </div>
    {isNodeModalOpen && nodeModalConfig && (
        <NodeModal 
            isOpen={isNodeModalOpen}
            onClose={closeNodeModal}
            onSubmit={handleNodeSubmit}
            nodeType={nodeModalConfig.type}
            initialData={nodeModalConfig.node}
            company={company}
        />
    )}
    {isConnectionModalOpen && selectedConnection && (
        <ConnectionModal
            isOpen={isConnectionModalOpen}
            onClose={closeConnectionModal}
            onSubmit={handleConnectionSubmit}
            initialData={selectedConnection}
            company={company}
        />
    )}
    <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Node"
        message={`Are you sure you want to delete this ${nodeToDelete?.type}? This will also remove all its connections.`}
    />
    </>
  );
};

export default NetworkGraph;