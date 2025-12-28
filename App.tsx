
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Lock, Zap, Monitor, Activity, Radio, 
  Fingerprint, ShieldCheck, ShieldAlert, Globe, 
  Database, Loader2, Github, AlertCircle, Terminal
} from 'lucide-react';
import { User, Message, Contact } from './types';
import Dashboard from './components/Dashboard';
import { scanMessageSecurity } from './services/geminiService';
import { fetchVault, VaultData } from './services/githubService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  // Auth State
  const [authData, setAuthData] = useState({ 
    vaultId: '', 
    code: '', 
    githubToken: localStorage.getItem('STOICKER_PAT') || '', 
    gistId: localStorage.getItem('STOICKER_GIST') || '' 
  });
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  // Auto-purge ephemeral messages logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages(prev => prev.filter(m => !m.expiresAt || m.expiresAt > now));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(null);
    setBootLog(["INITIALIZING KERNEL...", "ESTABLISHING P2P_LINK..."]);

    try {
      setBootLog(prev => [...prev, `FETCHING GIST_ID: ${authData.gistId.substring(0, 8)}...`]);
      const vault = await fetchVault(authData.gistId, authData.githubToken);
      
      const vaultUser = vault.users[authData.vaultId];
      
      if (!vaultUser || vaultUser.code !== authData.code) {
        throw new Error("ACCESS_DENIED: Invalid Vault Identity or Cipher Code");
      }

      setBootLog(prev => [...prev, "DECRYPTING RSA_IDENTITY...", "AUTHENTICATION_SUCCESS."]);
      
      // Save for convenience
      localStorage.setItem('STOICKER_PAT', authData.githubToken);
      localStorage.setItem('STOICKER_GIST', authData.gistId);

      // Convert vault users to local contacts
      const loadedContacts: Contact[] = Object.entries(vault.users).map(([id, data]) => ({
        id: `c-${id}`,
        nickname: data.name,
        vaultId: id,
        publicKey: data.publicKey,
        status: 'active'
      }));

      setTimeout(() => {
        setCurrentUser({
          id: authData.vaultId,
          name: vaultUser.name,
          vaultId: authData.vaultId,
          avatar: vaultUser.avatar,
          publicKey: vaultUser.publicKey
        });
        setContacts(loadedContacts);
        setIsAuthenticated(true);
        setIsAuthenticating(false);
      }, 1000);

    } catch (err: any) {
      setError(err.message);
      setIsAuthenticating(false);
      setBootLog([]);
    }
  };

  const handleSendMessage = useCallback(async (msg: Partial<Message>) => {
    const securityReport = await scanMessageSecurity(msg.content || '', msg.subject || '');
    const fullMessage: Message = {
      id: `PKT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      senderId: currentUser!.vaultId,
      receiverId: msg.receiverId!,
      subject: msg.subject || 'UNIDENTIFIED_PACKET',
      content: msg.content || '',
      cipherText: 'ENCRYPTED_DATA_STREAM',
      timestamp: Date.now(),
      read: false,
      ephemeral: msg.ephemeral || false,
      attachments: msg.attachments || [],
      digitalSignature: `SIG_${Math.random().toString(16).substr(2, 32)}`,
      securityReport: securityReport,
      expiresAt: msg.ephemeral ? Date.now() + 60000 : undefined
    };
    setMessages(prev => [...prev, fullMessage]);
  }, [currentUser]);

  const handleEmergencyPurge = () => {
    setIsPurging(true);
    setTimeout(() => {
      setMessages([]);
      setIsAuthenticated(false);
      setIsPurging(false);
      setCurrentUser(null);
      setBootLog([]);
    }, 1500);
  };

  if (isPurging) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-500 font-black uppercase tracking-[0.5em] animate-pulse">
        <ShieldAlert className="w-20 h-20 mb-8" />
        ZEROING DISK SECTORS...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4 selection:bg-indigo-500/50">
        <div className="max-w-lg w-full bg-[#0d1117] border border-[#30363d] rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
          
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center mb-8 shadow-indigo-500/20 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-tighter mb-1 text-center uppercase italic">Stoicker</h1>
          <p className="text-[#8b949e] text-[9px] uppercase tracking-[0.6em] mb-12 font-black text-center">Identity Verification Node</p>
          
          {isAuthenticating ? (
            <div className="space-y-3 py-6 bg-black/40 rounded-3xl p-6 border border-white/5">
               {bootLog.map((log, i) => (
                 <div key={i} className="flex items-center gap-3 text-[10px] font-mono text-indigo-400 uppercase">
                    <Terminal className="w-3.5 h-3.5" /> {log}
                 </div>
               ))}
               <div className="mt-8 flex justify-center"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-black uppercase">
                   <AlertCircle className="w-5 h-5" /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#8b949e] uppercase px-2">Vault ID</label>
                  <input type="text" placeholder="e.g. user1" required className="w-full bg-black/40 border border-[#30363d] rounded-2xl py-4 px-5 text-sm focus:border-indigo-500 outline-none transition-all text-white" value={authData.vaultId} onChange={e => setAuthData({...authData, vaultId: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#8b949e] uppercase px-2">Cipher Code</label>
                  <input type="password" placeholder="****" required className="w-full bg-black/40 border border-[#30363d] rounded-2xl py-4 px-5 text-sm focus:border-indigo-500 outline-none transition-all text-white" value={authData.code} onChange={e => setAuthData({...authData, code: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[#8b949e] uppercase px-2 flex items-center gap-2">
                  <Github className="w-3 h-3" /> GitHub Personal Token (PAT)
                </label>
                <input type="password" placeholder="ghp_xxxxxxxxxxxx" required className="w-full bg-black/40 border border-[#30363d] rounded-2xl py-4 px-5 text-xs focus:border-indigo-500 outline-none transition-all text-white font-mono" value={authData.githubToken} onChange={e => setAuthData({...authData, githubToken: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[#8b949e] uppercase px-2 flex items-center gap-2">
                  <Database className="w-3 h-3" /> Gist ID (Vault Database)
                </label>
                <input type="text" placeholder="Vault Gist Hash" required className="w-full bg-black/40 border border-[#30363d] rounded-2xl py-4 px-5 text-xs focus:border-indigo-500 outline-none transition-all text-white font-mono" value={authData.gistId} onChange={e => setAuthData({...authData, gistId: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2rem] hover:bg-slate-200 transition-all flex items-center justify-center gap-3 tracking-[0.2em] text-[11px] uppercase mt-4 shadow-xl shadow-indigo-500/10">
                 Establish Neural Handshake
              </button>
              
              <p className="text-[8px] text-[#484f58] text-center uppercase font-bold tracking-widest mt-4">
                Encryption keys are handled in memory. No persistent logs.
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden font-sans">
      <div className="h-14 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span> 
            NODE_LINK: {currentUser?.vaultId.toUpperCase()} // RSA-SIGNED
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center gap-3">
              <Github className="w-4 h-4 text-indigo-400" />
              <span className="text-[9px] font-black text-indigo-400 uppercase mono">GIST_SYNC_ACTIVE</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Main Terminal Client */}
        <div className="flex-1 min-w-0">
          <Dashboard 
            user={currentUser!} 
            messages={messages} 
            contacts={contacts}
            onSendMessage={handleSendMessage} 
            onAddContact={() => {}} // In Gist mode, adding happens via Gist update
            onReadMessage={id => setMessages(m => m.map(x => x.id === id ? {...x, read: true} : x))}
            onEmergencyPurge={handleEmergencyPurge}
          />
        </div>
        
        {/* Mirror Node View (Simulating the other person for testing) */}
        <div className="hidden xl:flex flex-1 min-w-0 border border-white/5 rounded-[3rem] bg-slate-900/10 flex-col items-center justify-center relative group">
           <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <Lock className="w-16 h-16 text-slate-800 mb-6" />
           <p className="text-[12px] font-black text-slate-700 uppercase tracking-[0.8em]">Mirror Frequency Offline</p>
           <p className="text-[9px] text-slate-800 uppercase mt-4 font-bold">Launch second instance with target ID for real testing</p>
        </div>
      </div>

      <footer className="h-10 bg-[#010409] border-t border-[#30363d] flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
           <Activity className="w-3.5 h-3.5 text-indigo-500" />
           <p className="text-[8px] text-[#484f58] font-black uppercase tracking-[0.5em]">
             Stoicker Kernel v5.0-GH // P2P_ENCRYPT: ENABLED // SANDBOX_STATE: ARMED
           </p>
        </div>
        <div className="flex items-center gap-6">
           <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">Memory Purge: 0.2s</span>
           <div className="h-2 w-24 bg-[#0d1117] rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-indigo-500/50 w-[88%]"></div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
