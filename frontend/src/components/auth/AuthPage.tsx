import { CustomInput } from '../common/CustomInput';
import React, { useState } from 'react';
import { api } from '../../api/client';
import type { AuthResponse } from '../../api/client';
import { Mail, Key, ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    if (password !== confirmPassword) {
      setStatusMessage({ text: 'VALIDATION_FAILED: Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await api.post<AuthResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });
      
      // Cache authentication footprint securely into local context blocks
      localStorage.setItem('aabit_session_token', res.data.token);
      localStorage.setItem('aabit_user_profile', JSON.stringify({ name: res.data.name, email: res.data.email }));
      
      window.location.href = '/';
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ 
        text: err.response?.data?.message || 'AUTHORIZATION_DENIED: Invalid credentials.', 
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
          <p className="text-[10px] text-neutral-500 tracking-wider">SECURE_AUTHENTICATION_REQUIRED</p>
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

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">User Identity Endpoint</label>
              <div className="flex items-center gap-2.5 bg-[#171717] border border-neutral-800 rounded-lg p-3 focus-within:border-neutral-600 transition-colors">
                <Mail size={16} className="text-neutral-500" />
                <CustomInput
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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">Security Passphrase</label>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="flex items-center gap-2.5 bg-[#171717] border border-neutral-800 rounded-lg p-3 focus-within:border-neutral-600 transition-colors">
                <Key size={16} className="text-neutral-500" />
                <CustomInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="bg-transparent text-sm w-full outline-none text-white placeholder-neutral-600 pr-2"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">Confirm Passphrase</label>
              <div className="flex items-center gap-2.5 bg-[#171717] border border-neutral-800 rounded-lg p-3 focus-within:border-neutral-600 transition-colors">
                <Key size={16} className="text-neutral-500 opacity-50" />
                <CustomInput
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password..."
                  className="bg-transparent text-sm w-full outline-none text-white placeholder-neutral-600 pr-2"
                  disabled={loading}
                  required
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-mono font-bold tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 outline-none cursor-pointer mt-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'AUTHORIZE_SESSION_NODE'}
          </button>
        </form>
      </div>
    </div>
  );
};