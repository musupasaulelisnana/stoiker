
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, Lock, Zap, Monitor, Activity, Radio, 
  Fingerprint, ShieldCheck, ShieldAlert, Globe, 
  Database, Loader2, Github, AlertCircle, Terminal, RefreshCw
} from 'lucide-react';
import { User, Message, Contact } from './types';
import Dashboard from './components/Dashboard';
import { scanMessageSecurity } from './services/geminiService';
import { fetchVault, updateVault, VaultData } from './services/githubService';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [lastSync, setLastSync] = useState<number>(Date.now());

  // Use a ref to keep track of the latest data to prevent race conditions during sync
  const vaultRef = useRef<VaultData | null>(null);

  /**
   * Sync logic: Pulls latest data from Gist
   */
  const syncDatabase = useCallback(async (showLoader = false) => {
    if (!authData.gistId || !authData.githubToken || isPurging) return;
    if (showLoader) setIsSyncing(true);
    
    try {
      const data = await fetchVault(authData.gistId, authData.githubToken);
      vaultRef.current = data;
      setMessages(data.messages || []);
      
      // Update contacts list from users in vault + any extra contacts
      const userContacts: Contact[] = Object.entries(data.users).map(([id, u]) => ({
        id: `c-${id}`,
        nickname: u.name,
        vaultId: id,
        publicKey: u.publicKey,
        status: 'active'
      }));
      setContacts(userContacts);
      
      setLastSync(Date.now());
    } catch (err: any) {
      console.error("Sync Error:", err);
    } finally {
      if (showLoader) setIsSyncing(false);
    }
  }, [authData.gistId, authData.githubToken, isPurging]);

  // Initial Login & Boot
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(null);
    setBootLog(["INITIALIZING KERNEL...", "ESTABLISHING P2P_LINK..."]);

    try {
      setBootLog(prev => [...prev, `FETCHING GIST_ID: ${authData.gistId.substring(0, 8)}...`]);
      const vault = await fetchVault(authData.gistId, authData.githubToken);
      vaultRef.current = vault;

      const vaultUser = vault.users[authData.vaultId];
      if (!vaultUser || vaultUser.code !== authData.code) {
        throw new Error("ACCESS_DENIED: Invalid Identity or Cipher Code");
      }

      setBootLog(prev => [...prev, "DECRYPTING RSA_IDENTITY...", "AUTHENTICATION_SUCCESS."]);
      
      localStorage.setItem('STOICKER_PAT', authData.githubToken);
      localStorage.setItem('STOICKER_GIST', authData.gistId);

      setCurrentUser({
        id: authData.vaultId,
        name: vaultUser.name,
        vaultId: authData.vaultId,
        avatar: vaultUser.avatar,
        publicKey: vaultUser.publicKey
      });
      
      setMessages(vault.messages || []);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Real-time Polling (Every 10 seconds)
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setInterval(() => syncDatabase(true), 10000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, syncDatabase]);

  const handleSendMessage = useCallback(async (msg: Partial<Message>) => {
    if (!vaultRef.current) return;
    setIsSyncing(true);

    try {
      // 1. AI Scan
      const securityReport = await scanMessageSecurity(msg.content || '', msg.subject || '');
      
      // 2. Build Message
      const newMessage: Message = {
        id: `PKT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        senderId: currentUser!.vaultId,
        receiverId: msg.receiverId!,
        subject: msg.subject || 'SECURE_TRANSMISSION',
        content: msg.content || '',
        cipherText: 'AES_256_HIDDEN_PAYLOAD',
        timestamp: Date.now(),
        read: false,
        ephemeral: msg.ephemeral || false,
        attachments: msg.attachments || [],
        digitalSignature: `SIG_${Math.random().toString(16).substr(2, 32)}`,
        securityReport,
        expiresAt: msg.ephemeral ? Date.now() + 60000 : undefined
      };

      // 3. Update Database (Push to Gist)
      const updatedVault = {
        ...vaultRef.current,
        messages: [...(vaultRef.current.messages || []), newMessage]
      };
      
      await updateVault(authData.gistId, authData.githubToken, updatedVault);
      vaultRef.current = updatedVault;
      setMessages(updatedVault.messages);
    } catch (err: any) {
      alert("Transmission Failed: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, authData.gistId, authData.githubToken]);

  const handleEmergencyPurge = () => {
    setIsPurging(true);
    setTimeout(() => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setMessages([]);
      setIsPurging(false);
    }, 1500);
  };

  if (isPurging) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-500 font-black uppercase tracking-[0.5em] animate-pulse">
        <ShieldAlert className="w-20 h-20 mb-8" />
        WIPING VOLATILE MEMORY...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#0d1117] border border-[#30363d] rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center mb-8">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-1 text-center uppercase italic">Stoicker</h1>
          <p className="text-[#8b949e] text-[9px] uppercase tracking-[0.6em] mb-12 font-black text-center">Cloud Database Login</p>
          
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
                <input type="text" placeholder="Vault ID" required className="bg-black/40 border border-[#30363d] rounded-2xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none" value={authData.vaultId} onChange={e => setAuthData({...authData, vaultId: e.target.value})} />
                <input type="password" placeholder="Cipher Code" required className="bg-black/40 border border-[#30363d] rounded-2xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none" value={authData.code} onChange={e => setAuthData({...authData, code: e.target.value})} />
              </div>
              <input type="password" placeholder="GitHub PAT (Token)" required className="w-full bg-black/40 border border-[#30363d] rounded-2xl py-4 px-5 text-xs text-white focus:border-indigo-500 outline-none" value={authData.githubToken} onChange={e => setAuthData({...authData, githubToken: e.target.value})} />
              <input type="text" placeholder="Gist ID" required className="w-full bg-black/40 border border-[#30363d] rounded-2xl py-4 px-5 text-xs text-white focus:border-indigo-500 outline-none" value={authData.gistId} onChange={e => setAuthData({...authData, gistId: e.target.value})} />
              <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2rem] hover:bg-slate-200 transition-all uppercase tracking-[0.2em] text-[11px] mt-4">
                 Access Secure Node
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden font-sans">
      <div className="h-14 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
            <span className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'} shadow-[0_0_10px_#10b981]`}></span> 
            P2P_TUNNEL: {currentUser?.vaultId.toUpperCase()}
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <button onClick={() => syncDatabase(true)} className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase hover:text-white transition-colors">
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> 
            Last Sync: {new Date(lastSync).toLocaleTimeString()}
          </button>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center gap-3">
              <Github className="w-4 h-4 text-indigo-400" />
              <span className="text-[9px] font-black text-indigo-400 uppercase mono">GIST_SYNC_ACTIVE</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        <div className="flex-1 min-w-0">
          <Dashboard 
            user={currentUser!} 
            messages={messages} 
            contacts={contacts}
            onSendMessage={handleSendMessage} 
            onAddContact={() => {}} 
            onReadMessage={() => {}} // Could sync read status to Gist too if needed
            onEmergencyPurge={handleEmergencyPurge}
          />
        </div>
        
        {/* Mirror Node View - Real Users can log in here on another browser tab */}
        <div className="hidden xl:flex flex-1 min-w-0 border border-[#30363d] rounded-[3rem] bg-slate-900/10 flex-col items-center justify-center relative group p-12 text-center">
           <Activity className="w-16 h-16 text-indigo-500/20 mb-6" />
           <h3 className="text-lg font-black text-slate-600 uppercase tracking-widest mb-4">Mirror Terminal</h3>
           <p className="text-[10px] text-slate-700 uppercase max-w-xs leading-relaxed font-bold">
             Open this URL in an Incognito window and log in as another user from your <span className="text-indigo-400">vault.json</span> to test the live database sync.
           </p>
        </div>
      </div>

      <footer className="h-10 bg-[#010409] border-t border-[#30363d] flex items-center justify-between px-8">
        <p className="text-[8px] text-[#484f58] font-black uppercase tracking-[0.5em]">
          Stoicker Database Engine v6.1 // SYNC_POLL: 10s // DATA_STORE: GITHUB_GIST
        </p>
        <div className="flex items-center gap-4">
           <span className={`text-[8px] font-bold uppercase tracking-widest ${isSyncing ? 'text-indigo-400' : 'text-slate-700'}`}>
             {isSyncing ? 'Writing to GitHub...' : 'Database Synchronized'}
           </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
