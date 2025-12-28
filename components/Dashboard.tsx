
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Mail, Trash2, Lock, FileText, 
  Image as ImageIcon, AlertTriangle, 
  CheckCircle2, Plus, Clock, ChevronRight,
  ShieldCheck, Zap, Activity, Bug, Fingerprint,
  Eye, ShieldAlert, Key, Upload, Loader2, Users,
  Globe, Server, Cpu, Database
} from 'lucide-react';
import { User, Message, Attachment, Contact } from '../types';
import { scanFileContent } from '../services/geminiService';

interface DashboardProps {
  user: User;
  messages: Message[];
  contacts: Contact[];
  onSendMessage: (msg: Partial<Message>) => void;
  onAddContact: (contact: Partial<Contact>) => void;
  onReadMessage: (id: string) => void;
  onEmergencyPurge: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, messages, contacts, onSendMessage, onAddContact, onReadMessage, onEmergencyPurge
}) => {
  const [view, setView] = useState<'inbox' | 'compose' | 'reading' | 'contacts'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ nickname: '', vaultId: '', publicKey: '' });
  
  const [composeData, setComposeData] = useState({ 
    to: '', subject: '', content: '', ephemeral: true, attachments: [] as Attachment[]
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inboxMessages = messages.filter(m => m.receiverId === user.vaultId);

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage({
      senderId: user.vaultId,
      receiverId: composeData.to,
      subject: composeData.subject,
      content: composeData.content,
      ephemeral: composeData.ephemeral,
      attachments: composeData.attachments,
    });
    setView('inbox');
    setComposeData({ to: '', subject: '', content: '', ephemeral: true, attachments: [] });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setScanStatus("DISSECTING BINARY...");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const scanResult = await scanFileContent(file.name, file.type, base64);
      
      const newAttach: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        size: `${(file.size / 1024).toFixed(1)} KB`,
        url: base64,
        scanStatus: scanResult.isSafe ? 'safe' : 'threat',
        threatReport: scanResult.findings,
        visionAnalysis: scanResult.reasoning
      };

      if (scanResult.isSafe) {
        setComposeData(prev => ({ ...prev, attachments: [...prev.attachments, newAttach] }));
      }
      setIsScanning(false);
      setScanStatus('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

      {/* Identity Bar */}
      <header className="px-6 py-4 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">{user.name} <span className="text-indigo-400 font-mono text-[10px]">@{user.vaultId}</span></h2>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Identity Verified // Node Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onEmergencyPurge} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl transition-all">
            <ShieldAlert className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Advanced Sidebar */}
        <aside className="w-20 lg:w-56 bg-slate-950 border-r border-slate-900 flex flex-col p-3 gap-2">
          <button onClick={() => setView('compose')} className="flex items-center justify-center lg:justify-start gap-3 w-full p-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-xl group">
            <Plus className="w-5 h-5 text-white" />
            <span className="hidden lg:block font-black text-[10px] uppercase tracking-widest">New Transmission</span>
          </button>
          
          <div className="mt-6 space-y-1">
            <button onClick={() => setView('inbox')} className={`flex items-center gap-4 w-full p-3 rounded-xl transition-all ${view === 'inbox' ? 'bg-slate-900 text-indigo-400 shadow-inner' : 'text-slate-500 hover:bg-slate-900/50'}`}>
               <Server className="w-5 h-5" /> <span className="hidden lg:block text-[10px] font-black uppercase">Secure Box</span>
            </button>
            <button onClick={() => setView('contacts')} className={`flex items-center gap-4 w-full p-3 rounded-xl transition-all ${view === 'contacts' ? 'bg-slate-900 text-indigo-400 shadow-inner' : 'text-slate-500 hover:bg-slate-900/50'}`}>
               <Users className="w-5 h-5" /> <span className="hidden lg:block text-[10px] font-black uppercase">Active Nodes</span>
            </button>
            <button className="flex items-center gap-4 w-full p-3 text-slate-500 hover:bg-slate-900/50 rounded-xl transition-all">
               <Database className="w-5 h-5" /> <span className="hidden lg:block text-[10px] font-black uppercase">Vault Audit</span>
            </button>
          </div>

          <div className="mt-auto p-4 bg-slate-900/30 border border-slate-800 rounded-2xl hidden lg:block">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">CPU LOAD</span>
                <span className="text-[8px] font-mono text-indigo-500">2.4%</span>
             </div>
             <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[12%]"></div>
             </div>
          </div>
        </aside>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 relative">
          
          {view === 'inbox' && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                <Globe className="w-4 h-4 text-indigo-500" /> Decrypted Feed // {inboxMessages.length} Packets
              </h3>
              {inboxMessages.length === 0 ? (
                <div className="h-64 border-2 border-dashed border-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-800">
                   <Lock className="w-12 h-12 mb-4 opacity-10" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Quiet on all frequencies</p>
                </div>
              ) : (
                inboxMessages.map(msg => (
                  <div key={msg.id} onClick={() => { setSelectedMessage(msg); onReadMessage(msg.id); setView('reading'); }} className="p-5 bg-slate-900/50 border border-slate-900 rounded-3xl hover:border-indigo-500/30 hover:bg-slate-900 transition-all cursor-pointer group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2 relative z-10">
                       <span className="text-[9px] font-black text-indigo-500/60 uppercase mono tracking-tighter">SHA256: {msg.id}</span>
                       <span className="text-[8px] font-bold text-slate-600 uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <h4 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{msg.subject}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 truncate font-mono">FR: {msg.senderId}</p>
                    {msg.ephemeral && <div className="mt-3 flex items-center gap-2"><Clock className="w-3 h-3 text-orange-500" /> <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Self-Destruct Engaged</span></div>}
                  </div>
                ))
              )}
            </div>
          )}

          {view === 'contacts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" /> Trusted Node Network
                 </h3>
                 <button onClick={() => setIsAddingContact(true)} className="px-4 py-2 bg-indigo-600 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-500 transition-all">Add New Node</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {contacts.map(c => (
                   <div key={c.id} className="p-5 bg-slate-900/50 border border-slate-900 rounded-3xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                            <Fingerprint className="w-6 h-6 text-slate-600" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-white">{c.nickname}</p>
                            <p className="text-[9px] font-mono text-indigo-500">ID: {c.vaultId}</p>
                         </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{c.status}</div>
                   </div>
                 ))}
              </div>

              {isAddingContact && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                   <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-md space-y-4">
                      <h4 className="text-lg font-black uppercase tracking-tight">Register Node</h4>
                      <input type="text" placeholder="Identity Nickname" className="w-full bg-black/50 border border-slate-800 p-4 rounded-2xl text-xs outline-none focus:border-indigo-500" value={newContact.nickname} onChange={e => setNewContact({...newContact, nickname: e.target.value})} />
                      <input type="text" placeholder="Vault ID (GitHub-Link)" className="w-full bg-black/50 border border-slate-800 p-4 rounded-2xl text-xs outline-none focus:border-indigo-500" value={newContact.vaultId} onChange={e => setNewContact({...newContact, vaultId: e.target.value})} />
                      <textarea placeholder="Public Handshake Key" className="w-full bg-black/50 border border-slate-800 p-4 rounded-2xl text-xs outline-none focus:border-indigo-500 h-24 resize-none" value={newContact.publicKey} onChange={e => setNewContact({...newContact, publicKey: e.target.value})} />
                      <div className="flex gap-2">
                        <button onClick={() => setIsAddingContact(false)} className="flex-1 py-4 bg-slate-800 rounded-2xl text-[10px] font-black uppercase">Cancel</button>
                        <button onClick={() => { onAddContact(newContact); setIsAddingContact(false); }} className="flex-1 py-4 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase">Verify & Save</button>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}

          {view === 'compose' && (
            <div className="max-w-xl mx-auto space-y-8 py-4">
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4">
                <Cpu className="w-8 h-8 text-indigo-400" /> Construct Transmission
              </h2>
              <form onSubmit={handleCompose} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Target Node</label>
                    <select value={composeData.to} onChange={e => setComposeData({...composeData, to: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs outline-none focus:border-indigo-500" required>
                       <option value="">Select identity...</option>
                       {contacts.map(c => (
                         <option key={c.id} value={c.vaultId}>{c.nickname.toUpperCase()} (@{c.vaultId})</option>
                       ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Persistence Protocol</label>
                    <button type="button" onClick={() => setComposeData({...composeData, ephemeral: !composeData.ephemeral})} className={`w-full h-[48px] px-4 rounded-2xl border transition-all flex items-center justify-between ${composeData.ephemeral ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                       <span className="text-[9px] font-black uppercase">{composeData.ephemeral ? 'Ephemeral Mode' : 'Persistent Storage'}</span>
                       {composeData.ephemeral ? <Clock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Header Signature</label>
                   <input type="text" value={composeData.subject} onChange={e => setComposeData({...composeData, subject: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs outline-none focus:border-indigo-500" placeholder="SUBJECT_IDENTIFIER_X99" required />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Encrypted Payload</label>
                   <textarea rows={6} value={composeData.content} onChange={e => setComposeData({...composeData, content: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs outline-none focus:border-indigo-500 resize-none mono" placeholder="Enter private communication text..." required />
                </div>

                <div className="space-y-3">
                   <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase px-1">
                      <span>Sandbox Attachments</span>
                      {isScanning && <div className="flex items-center gap-2 text-indigo-400 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> {scanStatus}</div>}
                   </div>
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 hover:border-indigo-500/50 hover:bg-slate-900/40 transition-all group">
                      <Upload className="w-8 h-8 text-slate-700 group-hover:text-indigo-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inject Local Data Into Sandbox</p>
                   </button>
                   <div className="grid grid-cols-1 gap-3">
                      {composeData.attachments.map(at => (
                        <div key={at.id} className={`flex items-center justify-between p-4 rounded-2xl border ${at.scanStatus === 'threat' ? 'bg-red-500/10 border-red-500/30' : 'bg-indigo-500/5 border-indigo-500/10'}`}>
                           <div className="flex items-center gap-4 overflow-hidden">
                              {at.scanStatus === 'threat' ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                              <div className="min-w-0">
                                 <p className="text-[10px] font-black text-white uppercase truncate">{at.name}</p>
                                 <p className="text-[8px] text-slate-600 font-bold mono">{(at.scanStatus === 'safe' ? 'CLEARED_SUCCESS' : 'THREAT_BLOCKED').toUpperCase()}</p>
                              </div>
                           </div>
                           <button type="button" onClick={() => setComposeData({...composeData, attachments: composeData.attachments.filter(x => x.id !== at.id)})} className="text-slate-700 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                   </div>
                </div>

                <button type="submit" disabled={isScanning || composeData.attachments.some(a => a.scanStatus === 'threat')} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl shadow-2xl transition-all disabled:opacity-20 uppercase tracking-[0.3em] flex items-center justify-center gap-3 mt-4">
                   <Lock className="w-5 h-5" /> Execute Secure Transfer
                </button>
              </form>
            </div>
          )}

          {view === 'reading' && selectedMessage && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-start border-b border-slate-900 pb-6">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500">
                       <ShieldCheck className="w-4 h-4" /> Integrity Verified // Zero Trace
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">{selectedMessage.subject}</h2>
                    <p className="text-[9px] text-slate-500 mono uppercase tracking-widest">Digital Signature: {selectedMessage.digitalSignature.substring(0, 48)}</p>
                 </div>
                 <button onClick={() => setView('inbox')} className="px-6 py-3 bg-slate-900 rounded-2xl text-[10px] font-black hover:bg-slate-800 transition-colors uppercase tracking-widest">Close Circuit</button>
               </div>

               {/* AI Security HUD */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-5 rounded-[2rem] border ${selectedMessage.securityReport?.identityVerified ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                     <div className="text-[9px] font-black text-slate-500 uppercase mb-3">Identity Score</div>
                     <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${selectedMessage.securityReport?.identityVerified ? 'text-emerald-500' : 'text-red-500'}`}>{selectedMessage.securityReport?.identityVerified ? '100%' : '2%'}</span>
                        <span className="text-[9px] font-bold text-slate-700 uppercase">{selectedMessage.securityReport?.identityVerified ? 'Verified' : 'Spoofed?'}</span>
                     </div>
                  </div>
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-[2rem] md:col-span-2">
                     <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Neural Scan Summary</div>
                     <p className="text-xs text-slate-400 italic leading-relaxed">"{selectedMessage.securityReport?.summary}"</p>
                  </div>
               </div>

               <div className="p-10 bg-slate-900/30 border border-slate-800 rounded-[3rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                     <Lock className="w-48 h-48" />
                  </div>
                  <p className="text-sm text-slate-100 font-mono leading-relaxed whitespace-pre-wrap relative z-10 selection:bg-indigo-500/40">
                    {selectedMessage.content}
                  </p>
               </div>

               {selectedMessage.attachments.length > 0 && (
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Sandbox Assets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {selectedMessage.attachments.map(at => (
                         <div key={at.id} className="p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-4">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-slate-800 rounded-2xl">
                                    {at.type === 'image' ? <ImageIcon className="w-5 h-5 text-indigo-400" /> : <FileText className="w-5 h-5 text-indigo-400" />}
                                  </div>
                                  <p className="text-xs font-black text-white truncate uppercase">{at.name}</p>
                               </div>
                               <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            </div>
                            {at.visionAnalysis && (
                              <div className="p-4 bg-black/40 border border-slate-800 rounded-2xl">
                                <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase mb-2">
                                   <Eye className="w-4 h-4" /> AI Dissection Result
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">"{at.visionAnalysis}"</p>
                              </div>
                            )}
                            {at.url && at.type === 'image' && (
                              <div className="relative group rounded-3xl overflow-hidden aspect-video border border-slate-800">
                                 <img src={at.url} className="w-full h-full object-cover blur-[4px] hover:blur-0 transition-all cursor-crosshair" />
                                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white border-2 border-white/20 px-4 py-2 rounded-xl backdrop-blur-md">Secure Preview Locked</p>
                                 </div>
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
