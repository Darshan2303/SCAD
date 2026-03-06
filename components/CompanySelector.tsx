

import React, { useState, useRef } from 'react';
import type { Company } from '../types';
import { PlusIcon, DeleteIcon, ShieldIcon, FileUploadIcon, FileDownloadIcon, SparklesIcon } from './Icons'; // Removed CheckCircleIcon, AlertTriangleIcon
import CompanyModal from './CompanyModal';
import ConfirmationDialog from './ConfirmationDialog';
import { generateExcelTemplate, parseExcelToCompany } from '../utils/excelUtils';
import { getAIAnalysisForCompany } from '../utils/aiAnalysis';


interface CompanySelectorProps {
  companies: Company[];
  onSelect: (companyId: string) => void;
  dispatch: React.Dispatch<any>;
  apiKey: string | null;
}

const ResilienceIndicator: React.FC<{ score: number }> = ({ score }) => {
    let colorClass = 'text-slate-500 bg-slate-100';
    let text = 'Unknown';
    if (score >= 80) {
        colorClass = 'text-emerald-700 bg-emerald-100'; 
        text = 'High';
    } else if (score >= 50) {
        colorClass = 'text-amber-700 bg-amber-100'; 
        text = 'Medium';
    } else {
        colorClass = 'text-rose-700 bg-rose-100'; 
        text = 'Low';
    }
    return (
        <div className={`text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colorClass}`}>
            <ShieldIcon className="w-3.5 h-3.5" />
            <span>{text} ({score})</span>
        </div>
    );
};

const CompanyCard: React.FC<{ company: Company, onSelect: () => void, onDelete: () => void, style: React.CSSProperties }> = ({ company, onSelect, onDelete, style }) => {
    // Removed isProblem check as scenario is deprecated
    
    return (
        <div
            style={style}
            onClick={onSelect}
            className="group relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 border border-slate-200 hover:border-sky-300" 
        >
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-slate-800">{company.name}</h3>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 rounded-full bg-slate-100/70 hover:bg-rose-100 text-slate-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all duration-300" 
                        aria-label="Delete company"
                    >
                        <DeleteIcon />
                    </button>
                </div>
                <p className="text-slate-600 mt-2 text-sm h-10">{company.description}</p> 
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2"> 
                    {/* Removed conditional rendering based on `isProblem` */}
                    <ResilienceIndicator score={company.data.resilienceScore} />
                </div>
            </div>
        </div>
    );
};

const AddCompanyCard: React.FC<{ onClick: () => void, style: React.CSSProperties }> = ({ onClick, style }) => (
    <div
        style={style}
        onClick={onClick}
        className="bg-transparent border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-sky-400 hover:bg-white hover:shadow-xl hover:text-sky-500 flex flex-col items-center justify-center text-slate-500 min-h-[220px] hover:-translate-y-1" 
    >
        <PlusIcon className="w-10 h-10 mb-2" />
        <h3 className="text-lg font-semibold">Add New Company</h3>
    </div>
);

const ExcelCard: React.FC<{ onUploadSuccess: (company: Company) => void; apiKey: string | null, style: React.CSSProperties }> = ({ onUploadSuccess, apiKey, style }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            setLoadingMessage('Parsing Sheet...');
            let newCompany = await parseExcelToCompany(file);
            
            if (apiKey) {
                setLoadingMessage('Analyzing with AI...');
                const aiDescription = await getAIAnalysisForCompany(newCompany, apiKey);
                newCompany.description = aiDescription;
            }

            onUploadSuccess(newCompany);
            setSuccessMessage(`Success! Company "${newCompany.name}" created & analyzed.`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div style={style} className="bg-white rounded-xl p-6 transition-all duration-300 shadow-lg border border-slate-200 flex flex-col justify-between min-h-[220px]">
            <div>
                 <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-sky-400" /> 
                    Analyze from Excel
                </h3>
                <p className="text-slate-600 mt-2 text-sm min-h-[40px]"> 
                    Upload a sheet to model your network and get an instant AI-powered analysis.
                </p>
                 {!apiKey && (
                    <p className="text-xs text-amber-700 bg-amber-100 p-2 rounded-md my-2"> 
                        <strong>Note:</strong> AI analysis is disabled. Set your API key in settings to enable it.
                    </p>
                )}
            </div>
             {successMessage && <p className="text-xs text-emerald-600 bg-emerald-100 p-2 rounded-md my-2">{successMessage}</p>}
             {error && <p className="text-xs text-rose-600 bg-rose-100 p-2 rounded-md my-2">{error}</p>} 
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3"> 
                <button
                    onClick={generateExcelTemplate}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition-all" 
                >
                    <FileDownloadIcon className="w-5 h-5" />
                    Download Template
                </button>
                 <button
                    onClick={handleUploadClick}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? (
                        <>
                         <svg className="animate-spin h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> 
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {loadingMessage || 'Processing...'}
                        </>
                    ) : (
                        <>
                            <FileUploadIcon className="w-5 h-5" />
                            Upload & Analyze
                        </>
                    )}
                 </button>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xlsx, .xls"
                />
            </div>
        </div>
    );
};

const CompanySelector: React.FC<CompanySelectorProps> = ({ companies, onSelect, dispatch, apiKey }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

    const handleAddCompany = (newCompany: Company) => {
        dispatch({ type: 'ADD_COMPANY', payload: { companyData: newCompany } });
        setIsModalOpen(false);
    };

    const handleDeleteConfirm = () => {
        if (companyToDelete) {
            dispatch({ type: 'DELETE_COMPANY', payload: { companyId: companyToDelete.id } });
            setCompanyToDelete(null);
        };
    };

    return (
        <>
            <div className="relative text-center flex flex-col items-center min-h-[80vh] px-4 py-16 overflow-hidden">
                <div className="absolute inset-0 -z-10" />

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Select a Supply Chain to Analyze</h2>
                <p className="text-lg text-slate-600 max-w-2xl mb-12"> 
                    Each company represents a unique supply chain network. Choose one to dive into the data, or create a new one to start from scratch.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
                    {companies.map((company, index) => (
                        <CompanyCard 
                            key={company.id} 
                            company={company} 
                            onSelect={() => onSelect(company.id)} 
                            onDelete={() => setCompanyToDelete(company)}
                            style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`, opacity: 0 }}
                        />
                    ))}
                    <AddCompanyCard
                        onClick={() => setIsModalOpen(true)}
                        style={{ animation: `fadeInUp 0.5s ease-out ${companies.length * 0.1}s forwards`, opacity: 0 }}
                    />
                    <ExcelCard
                        onUploadSuccess={handleAddCompany}
                        apiKey={apiKey}
                        style={{ animation: `fadeInUp 0.5s ease-out ${(companies.length + 1) * 0.1}s forwards`, opacity: 0 }}
                    />
                </div>
            </div>
            <CompanyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddCompany}
            />
            <ConfirmationDialog
                isOpen={!!companyToDelete}
                onClose={() => setCompanyToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Company"
                message={`Are you sure you want to delete "${companyToDelete?.name}"? This action cannot be undone.`}
            />
        </>
    );
};

export default CompanySelector;