import React, { useEffect, useState } from 'react';
import * as googleAuthService from '../services/googleAuthService';

const DebugAuth: React.FC = () => {
    const [status, setStatus] = useState<any>({});
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const checkStatus = () => {
            const gapi = (window as any).gapi;
            const google = (window as any).google;

            setStatus({
                gapiLoaded: !!gapi,
                googleLoaded: !!google,
                gapiClient: !!gapi?.client,
                authServiceInitialized: googleAuthService.isInitialized(), // We need to add this method
                clientId: process.env.GOOGLE_CLIENT_ID ? 'Present (Ends with ' + process.env.GOOGLE_CLIENT_ID.slice(-4) + ')' : 'MISSING',
                apiKey: process.env.API_KEY ? 'Present' : 'MISSING',
                timestamp: new Date().toLocaleTimeString()
            });
        };

        const interval = setInterval(checkStatus, 1000);
        checkStatus();
        return () => clearInterval(interval);
    }, []);

    if (!isVisible) return <button onClick={() => setIsVisible(true)} className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full z-50 text-xs">🐞</button>;

    return (
        <div className="fixed bottom-4 right-4 bg-black/90 text-green-400 p-4 rounded-lg border border-green-500/30 font-mono text-xs z-50 shadow-2xl max-w-sm">
            <div className="flex justify-between items-center mb-2 border-b border-green-500/30 pb-1">
                <h3 className="font-bold">🔍 Google Auth Debugger</h3>
                <button onClick={() => setIsVisible(false)} className="text-red-400 hover:text-red-300">✕</button>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between"><span>GAPI Script:</span> <span className={status.gapiLoaded ? 'text-green-400' : 'text-red-500'}>{status.gapiLoaded ? 'OK' : 'MISSING'}</span></div>
                <div className="flex justify-between"><span>Google Identity:</span> <span className={status.googleLoaded ? 'text-green-400' : 'text-red-500'}>{status.googleLoaded ? 'OK' : 'MISSING'}</span></div>
                <div className="flex justify-between"><span>Client ID:</span> <span className={status.clientId !== 'MISSING' ? 'text-green-400' : 'text-red-500'}>{status.clientId}</span></div>
                <div className="flex justify-between"><span>API Key:</span> <span className={status.apiKey !== 'MISSING' ? 'text-green-400' : 'text-red-500'}>{status.apiKey}</span></div>
                <div className="flex justify-between"><span>Service Init:</span> <span className={status.authServiceInitialized ? 'text-green-400' : 'text-yellow-500'}>{status.authServiceInitialized ? 'YES' : 'NO'}</span></div>
                <div className="mt-2 pt-2 border-t border-green-500/30 text-[10px] text-gray-500">Last Check: {status.timestamp}</div>
            </div>
        </div>
    );
};

export default DebugAuth;
