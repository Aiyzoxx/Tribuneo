import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LoginPage = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Look for error or success in URL params (from OAuth or email validation)
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError(decodeURIComponent(params.get('error')));
      window.history.replaceState({}, document.title, "/");
    }
    if (params.get('success')) {
      setSuccess(decodeURIComponent(params.get('success')));
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNom('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (mode === 'register' && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (mode === 'register' && password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        // App will automatically re-render and hide LoginPage because isAuthenticated becomes true
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/register`, { email, password, nom });
        setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de la requête');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }} className="transition-colors duration-300">
      
      {/* Left side: Premium Branding (Sober/Professional) */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
        color: '#0f172a',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid #e2e8f0',
      }} className="hidden lg:flex flex-col justify-center">
        {/* Subtle geometric background pattern */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(15,23,42,0.03) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%', width: '800px', height: '800px',
          background: 'radial-gradient(circle, rgba(15,23,42,0.02) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-1px' }}>
            L'intelligence<br />
            <span style={{ color: '#475569' }}>au service de votre prospection.</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '400px', marginBottom: '40px' }}>
            Accédez à vos outils de pilotage avec Tribuneo. Base de données, analyse cartographique et alertes géographiques.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', border: '2px solid #ffffff', marginLeft: i > 1 ? '-12px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>
                  {i}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Rejoignez les <strong style={{ color: '#0f172a' }}>milliers</strong> de professionnels qui font confiance à Tribuneo.
            </p>
          </div>
        </div>
      </div>

      {/* Card Form */}
      <div style={{
        flex: 1,
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#ffffff',
        height: '100vh',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.02)',
        zIndex: 10,
        overflowY: 'auto'
      }} className="p-6 md:p-10 w-full">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: '#fff', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            marginBottom: '16px'
          }}>
            <img src="/logo.png" alt="Tribuneo Logo" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {mode === 'login' ? 'Entrez vos identifiants pour accéder à vos outils.' : 'Remplissez le formulaire ci-dessous pour démarrer.'}
          </p>
        </div>

        {/* Custom Tabs */}
        <div style={{ display: 'flex', marginBottom: '32px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => switchMode('login')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '14px', transition: 'all 0.2s',
              background: mode === 'login' ? '#fff' : 'transparent',
              color: mode === 'login' ? '#0f172a' : '#64748b',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Se connecter
          </button>
          <button
            onClick={() => switchMode('register')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '14px', transition: 'all 0.2s',
              background: mode === 'register' ? '#fff' : 'transparent',
              color: mode === 'register' ? '#0f172a' : '#64748b',
              boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Créer un compte
          </button>
        </div>

        {/* Bouton Google */}
        <a
          href="/api/auth/google"
          id="google-login-btn"
          className="hover:bg-slate-50 transition-colors"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', width: '100%', padding: '12px',
            background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px',
            color: '#334155', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box',
            marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {mode === 'login' ? 'Continuer avec Google' : 'S\'inscrire avec Google'}
        </a>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>ou avec votre email</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '500' }}>{error}</span>
          </div>
        )}
        {success && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
            </svg>
            <span style={{ fontSize: '13px', color: '#15803d', fontWeight: '500' }}>{success}</span>
          </div>
        )}

        {/* Form */}
        <div key={mode} className="animate-fade-in animate-slide-up">
          <form onSubmit={handleSubmit}>
          
          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Nom complet
              </label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                required
                placeholder="Jean Dupont"
                className="login-input"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#fff', transition: 'all 0.2s' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              Email professionnel
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                className="login-input"
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#fff', transition: 'all 0.2s' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              <span>Mot de passe</span>
              {mode === 'login' && <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500' }} className="hover:underline">Oublié ?</a>}
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
                style={{ width: '100%', padding: '12px 40px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#fff', transition: 'all 0.2s' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  color: '#94a3b8',
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="login-input"
                  style={{ width: '100%', padding: '12px 40px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#fff', transition: 'all 0.2s' }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-btn hover:scale-[1.02]"
            style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
              background: '#0f172a', color: '#fff', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.7 : 1, marginTop: '24px', boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)'
            }}
          >
            {loading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : 'Créer un compte')}
          </button>
        </form>
        </div>
      </div>

      <style>{`
        .login-input:focus {
          border-color: #0f172a !important;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08) !important;
        }
        .login-btn:hover {
          background: #1e293b !important;
          box-shadow: 0 6px 15px rgba(15, 23, 42, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
