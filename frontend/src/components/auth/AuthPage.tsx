import React, { useState } from 'react';
import { api } from '../../api/client';
import type { AuthResponse } from '../../api/client';
import { Mail, Key, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      await api.post('/auth/request', { email: email.trim().toLowerCase() });
      
      // If the backend returns a 200 OK success state, step onto the OTP field view
      setStep('OTP');
      setStatusMessage({ text: 'ACCESS_KEY_DISPATCHED: Check your primary inbox folder.', type: 'success' });
    } catch (err: any) {
      console.error("Authentication handshake rejected:", err);
      
      // Extract the raw server message thrown by your backend IllegalStateException
      const backendErrorMessage = err.response?.data?.message || err.response?.data;
      
      setStatusMessage({ 
        text: typeof backendErrorMessage === 'string' ? backendErrorMessage : 'TRANSACTION_REJECTED: Rate limits enforced.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await api.post<AuthResponse>('/auth/verify', {
        email: email.trim().toLowerCase(),
        otpCode: otpCode.trim()
      });
      
      // Cache authentication footprint securely into local context blocks
      localStorage.setItem('aabit_session_token', res.data.token);
      localStorage.setItem('aabit_user_profile', JSON.stringify({ name: res.data.name, email: res.data.email }));
      
      window.location.href = '/';
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ 
        text: err.response?.data?.message || 'AUTHORIZATION_DENIED: Verification string mismatch.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#121212] border border-neutral-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6 transition-all">
        
        {/* Security Header Panel */}
        <div className="flex flex-col gap-1 text-center border-b border-neutral-800 pb-4 font-mono select-none">
          <div className="mx-auto p-2.5 bg-[#171717] border border-neutral-800 rounded-xl mb-2 text-blue-500">
            <ShieldCheck size={22} />
          </div>
          <h2 className="text-xs font-bold text-white tracking-widest uppercase">AABIT_OS // CORE_IDENTITY_GATEWAY</h2>
          <p className="text-[10px] text-neutral-500 tracking-wider">STATELESS_AUTHENTICATION_REQUIRED</p>
        </div>

        {statusMessage && (
          <div className={`p-3 border rounded-lg text-xs font-mono text-center animate-in fade-in duration-150 ${
            statusMessage.type === 'error' 
              ? 'bg-red-950/20 border-red-900/40 text-red-400' 
              : 'bg-blue-950/20 border-blue-900/40 text-blue-400'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {step === 'EMAIL' ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">User Identity Endpoint</label>
              <div className="flex items-center gap-2.5 bg-[#171717] border border-neutral-800 rounded-lg p-3 focus-within:border-neutral-600 transition-colors">
                <Mail size={16} className="text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="bg-transparent text-sm w-full outline-none text-white placeholder-neutral-600"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 bg-white hover:bg-neutral-200 disabled:opacity-30 text-black text-xs font-mono font-bold tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 outline-none cursor-pointer"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'EXECUTE_OTP_REQUEST'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">Verification Access Key</label>
                <button 
                  type="button" 
                  onClick={() => { setStep('EMAIL'); setStatusMessage(null); }}
                  className="text-[10px] font-mono text-neutral-500 hover:text-white flex items-center gap-1 transition-colors outline-none cursor-pointer"
                >
                  <ArrowLeft size={10} /> EDIT_EMAIL
                </button>
              </div>
              <div className="flex items-center gap-2.5 bg-[#171717] border border-neutral-800 rounded-lg p-3 focus-within:border-neutral-600 transition-colors">
                <Key size={16} className="text-neutral-500" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit key..."
                  className="bg-transparent text-sm w-full outline-none text-white font-mono tracking-[0.4em] placeholder-neutral-600"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-mono font-bold tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 outline-none cursor-pointer"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'AUTHORIZE_SESSION_NODE'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};