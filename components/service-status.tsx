
'use client';

import { useEffect, useState } from 'react';

export function ServiceStatus() {
  const [statuses, setStatuses] = useState({ socket: 'checking', webhook: 'checking' });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setStatuses({ socket: data.socket, webhook: data.webhook });
      } catch (error) {
        setStatuses({ socket: 'error', webhook: 'error' });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 flex gap-4 text-xs font-mono bg-black/80 p-2 rounded-md border border-white/10 z-50">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statuses.socket === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-white">Socket</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statuses.webhook === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-white">Webhook</span>
      </div>
    </div>
  );
}
