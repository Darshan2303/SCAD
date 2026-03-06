

import React, { useState, useCallback } from 'react';
import type { Company, AIAnalysisResult, AIAnalysisRisk, AIAnalysisRecommendation } from '../types';
import { SparklesIcon, AlertTriangleIcon, KeyIcon, InfoIcon, ShieldIcon } from './Icons';
import { getStrategicAIAnalysis } from '../utils/aiStrategicAnalysis';

interface AIAnalysisViewProps {
  company: Company;
  apiKey: string | null;
}

const RiskCard: React.FC<{ risk: AIAnalysisRisk }> = ({ risk }) => {
    const severityClasses = {
        High: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-500' },
        Medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-500' },
        Low: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', icon: 'text-yellow-500' },
    };
    const classes = severityClasses[risk.severity] || severityClasses.Medium;

    return (
        <div className={`p-4 rounded-lg border ${classes.bg} ${classes.border}`}>
            <div className="flex items-start gap-3">
                <AlertTriangleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${classes.icon}`} />
                <div>
                    <h4 className={`font-bold ${classes.text}`}>{risk.title}</h4>
                    <p className={`text-sm mt-1 ${classes.text} opacity-90`}>{risk.description}</p>
                </div>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${classes.bg} ${classes.text}`}>{risk.severity}</span>
            </div>
        </div>
    );
};

const RecommendationCard: React.FC<{ recommendation: AIAnalysisRecommendation }> = ({ recommendation }) => {
    const impactClasses = {
        High: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-500' },
        Medium: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', icon: 'text-sky-500' },
        Low: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-500' },
    };
    const classes = impactClasses[recommendation.impact] || impactClasses.Medium;
    
    return (
        <div className={`p-4 rounded-lg border ${classes.bg} ${classes.border}`}>
             <div className="flex items-start gap-3">
                <ShieldIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${classes.icon}`} />
                <div>
                    <h4 className={`font-bold ${classes.text}`}>{recommendation.title}</h4>
                    <p className={`text-sm mt-1 ${classes.text} opacity-90`}>{recommendation.description}</p>
                </div>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${classes.bg} ${classes.text}`}>{recommendation.impact}</span>
            </div>
        </div>
    );
};


const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({ company, apiKey }) => {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!apiKey) {
      setError("An API Key is required for AI Analysis. Please set it in the settings.");
      setAnalysisResult(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await getStrategicAIAnalysis(company, apiKey);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error("Failed to get AI analysis:", err);
      setError(err.message || "An error occurred while fetching AI analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [company, apiKey]);

  // Fetch analysis when the component mounts or company/apiKey changes
  // Not fetching immediately on mount, waiting for user interaction or clearer lifecycle
  // useEffect(() => {
  //   fetchAnalysis();
  // }, [fetchAnalysis]);


  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="bg-sky-100 p-2 rounded-lg border border-sky-200">
                <SparklesIcon className="w-6 h-6 text-sky-600"/>
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">AI Strategic Analysis</h3>
        </div>
        <p className="mt-4 text-slate-600 max-w-3xl">
          Leverage Gemini AI to get an instant strategic overview of your supply chain network.
          This will identify critical risks and recommend actionable improvements based on your current data.
        </p>
        
        {!apiKey && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md mt-4 flex items-start gap-3">
                <KeyIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                    <strong>API Key Required:</strong> To enable AI analysis, please navigate to settings and provide your Gemini API Key.
                </p>
            </div>
        )}

        <div className="mt-6">
            <button
                onClick={fetchAnalysis}
                disabled={isLoading || !apiKey}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        Generate AI Analysis
                    </>
                )}
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
                <h4 className="font-bold">Analysis Error</h4>
                <p className="text-sm mt-1">{error}</p>
            </div>
        </div>
      )}

      {analysisResult && (
        <>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Identified Risks</h3>
            <div className="space-y-4">
              {analysisResult.risks.map((risk, index) => (
                <RiskCard key={index} risk={risk} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Recommendations</h3>
            <div className="space-y-4">
              {analysisResult.recommendations.map((recommendation, index) => (
                <RecommendationCard key={index} recommendation={recommendation} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { AIAnalysisView };
