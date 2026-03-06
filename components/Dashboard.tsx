

import React, { useState } from 'react';
import type { Company, Node } from '../types';
import MetricTree from './MetricTree';
import NetworkGraph from './NetworkGraph';
import Tabs from './Tabs'; // Keep Tabs for now, to be replaced by SpotlightNavbar
import SummaryView from './SummaryView';
import ControlAndPredictionPanel from './ControlAndPredictionPanel';
import ForecastView from './ForecastView';
import { BackArrowIcon, DashboardIcon, MapIcon, ReportsIcon, ControlsIcon, ForecastIcon, FlowIcon, SparklesIcon } from './Icons';
import SpotlightNavbar from './SpotlightNavbar';


interface DashboardProps {
  company: Company;
  onSelectNode: (node: Node) => void;
  onBack: () => void;
  dispatch: React.Dispatch<any>; // Using any for simplicity with reducer actions
}

const Dashboard: React.FC<DashboardProps> = ({
  company,
  onSelectNode,
  onBack,
  dispatch,
}) => {
  const [activeTab, setActiveTab] = useState('Dashboard'); // Default to a more general Dashboard view
  
  const tabs = [
      { label: 'Dashboard', icon: <DashboardIcon /> },
      { label: 'Map View', icon: <MapIcon /> },
      { label: 'Reports', icon: <ReportsIcon /> },
      { label: 'Controls', icon: <ControlsIcon /> },
      { label: 'Forecasts', icon: <ForecastIcon /> },
      { label: 'AI Analysis', icon: <SparklesIcon /> }
  ];

  const renderTabContent = () => {
    const animationWrapperClass = "mt-6";
    switch (activeTab) {
      case 'Dashboard':
        return (
          <div className={`${animationWrapperClass}`}>
            <MetricTree 
              company={company}
              title="Overall Network KPIs" 
            />
          </div>
        );
      case 'Map View':
        return (
            <div className={`${animationWrapperClass}`}>
              <NetworkGraph
                  company={company}
                  onSelectNode={onSelectNode}
                  dispatch={dispatch}
              />
            </div>
        );
      case 'Reports':
        return <div className={animationWrapperClass}><SummaryView data={company.data} /></div>;
      case 'Controls':
        return <div className={animationWrapperClass}><ControlAndPredictionPanel company={company} dispatch={dispatch} currentUser={null} /></div>; // currentUser is null for admin view here
      case 'Forecasts':
        return <div className={`${animationWrapperClass}`}><ForecastView company={company} /></div>;
      case 'AI Analysis':
        return <div className={`${animationWrapperClass}`}>AI Analysis View Placeholder</div>; // Placeholder for new AIAnalysisView
      default:
        return (
            <div className={`${animationWrapperClass}`}>
              <NetworkGraph
                  company={company}
                  onSelectNode={onSelectNode}
                  dispatch={dispatch}
              />
            </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-blue-50/50 rounded-xl shadow-inner border border-blue-100"> 
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">{company.name}</h2>
              <p className="text-slate-600 mt-1">{company.description}</p> 
            </div>
            <button onClick={onBack} className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 transition-all duration-200 shadow-sm flex items-center gap-2 self-start sm:self-center hover:shadow-md hover:border-sky-300"> 
              <BackArrowIcon />
              Change Company
            </button>
        </div>
        
        <SpotlightNavbar tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} /> 

        <div>
            {renderTabContent()}
        </div>
    </div>
  );
};

export default Dashboard;