
import React, { useRef } from 'react';

interface SpotlightNavbarProps {
    tabs: { label: string; icon: React.ReactNode }[];
    activeTab: string;
    onTabClick: (tab: string) => void;
}

const SpotlightNavbar: React.FC<SpotlightNavbarProps> = ({ tabs, activeTab, onTabClick }) => {
    const navRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const nav = navRef.current;
        if (!nav) return;
        const rect = nav.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        nav.style.setProperty("--mouse-x", `${x}px`);
        nav.style.setProperty("--mouse-y", `${y}px`);
    };

    const handleMouseLeave = () => {
        const nav = navRef.current;
        if (!nav) return;
        nav.style.setProperty("--mouse-x", `-9999px`);
        nav.style.setProperty("--mouse-y", `-9999px`);
    };

    return (
        <div
            ref={navRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="spotlight-nav bg-white/70 backdrop-blur-lg p-2 rounded-xl border border-slate-900/10 shadow-sm flex items-center gap-1 sm:gap-2 overflow-x-auto"
        >
            {tabs.map((tab) => (
                <button
                    key={tab.label}
                    onClick={() => onTabClick(tab.label)}
                    className={`relative flex-shrink-0 flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 w-full sm:w-auto z-10 ${
                        activeTab === tab.label
                            ? 'text-white'
                            : 'text-slate-600 hover:text-slate-800'
                    }`}
                >
                    <span className="absolute inset-0 rounded-lg bg-sky-600 opacity-0 transition-opacity duration-300" style={{ opacity: activeTab === tab.label ? 1 : 0 }}></span>
                    <span 
                        className="absolute inset-0 rounded-lg bg-white/60 opacity-0 transition-opacity duration-300 hover:opacity-100"
                        style={{ opacity: activeTab === tab.label ? 0 : undefined }}
                    ></span>
                    <span className="relative">{tab.icon}</span>
                    <span className="relative">{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default SpotlightNavbar;