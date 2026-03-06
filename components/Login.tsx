

import React, { useState } from 'react';
import { BuildingIcon, UserIcon, KeyIcon } from './Icons';

interface LoginProps {
    // FIX: Explicitly type 'password' parameter to 'string' to avoid implicit 'any'.
    onLogin: (username: string, password: string) => void;
    error: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md animate-fade-in-up">
                <form 
                    onSubmit={handleSubmit} 
                    className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-2xl px-8 pt-10 pb-8 mb-4 border border-white/30"
                >
                    <div className="text-center mb-8">
                         <div className="inline-flex items-center justify-center bg-sky-600 p-3 rounded-xl shadow-lg mb-4">
                            <BuildingIcon />
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">SCAD</h1>
                        <p className="text-slate-500">Please sign in to continue</p>
                    </div>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg relative mb-6 text-sm" role="alert">
                            <strong className="font-bold">Error:</strong>
                            <span className="block sm:inline ml-2">{error}</span>
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="username">
                            Username
                        </label>
                         <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <UserIcon />
                            </div>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g., admin"
                                className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 pl-10 pr-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <KeyIcon />
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="e.g., admin123"
                                className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 pl-10 pr-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            Sign In
                        </button>
                    </div>
                     <p className="text-center text-slate-500 text-xs mt-6">
                        Use <strong>admin/admin123</strong> for administrator access.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;