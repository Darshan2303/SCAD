

import React from 'react';
import { BuildingIcon, UserIcon, LogoutIcon, SettingsIcon } from './Icons';
import type { CurrentUser } from '../types';


interface HeaderProps {
    currentUser: CurrentUser;
    onLogout: () => void;
    isWsConnected: boolean;
    onOpenSettings: () => void;
}

const ConnectionStatus: React.FC<{ isConnected: boolean }> = ({ isConnected }) => {
    const bgColor = isConnected ? 'bg-emerald-300' : 'bg-rose-300';
    const ringColor = isConnected ? 'ring-emerald-200' : 'ring-rose-200';
    const title = isConnected ? 'Live connection active' : 'Disconnected. Changes will not be saved.';
    return (
        <div className="relative flex items-center justify-center" title={title}>
            <div className={`w-2.5 h-2.5 rounded-full ${bgColor}`}></div>
            {!isConnected && <div className={`absolute w-2.5 h-2.5 rounded-full ${bgColor} animate-ping`}></div>}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, isWsConnected, onOpenSettings }) => {
  return (
    <header className="bg-white/90 backdrop-blur-lg shadow-sm p-4 sticky top-0 z-50 border-b border-slate-100"> 
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-sky-400 p-2 rounded-lg shadow-sm"> 
                    <BuildingIcon className="text-white"/> 
                </div>
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                        SCAD
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm font-semibold tracking-wider uppercase">Supply Chain Analysis Dashboard</p>
                </div>
            </div>
             {currentUser && (
                 <div className="flex items-center gap-4">
                    <button
                        onClick={onOpenSettings}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Settings"
                        aria-label="Open Settings"
                    >
                        <SettingsIcon className="w-5 h-5"/>
                    </button>
                    <div className="flex items-center gap-3 bg-white pl-3 pr-2 py-1.5 rounded-full border border-slate-200 shadow-sm"> 
                        <ConnectionStatus isConnected={isWsConnected} />
                        <div className="bg-slate-100 p-1.5 rounded-full">
                            <UserIcon />
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-slate-700">{currentUser.name}</span>
                            <span className="text-xs text-slate-500 block capitalize">{currentUser.role}</span>
                        </div>
                    </div>
                    <button onClick={onLogout} className="text-sm font-semibold text-slate-600 hover:text-sky-500 transition-colors flex items-center gap-1.5"> 
                        <LogoutIcon className="w-5 h-5"/>
                    <span className="sr-only sm:not-sr-only">Logout</span>
                    </button>
                </div>
             )}
        </div>
    </header>
  );
};

export default Header;