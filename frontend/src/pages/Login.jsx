import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Validación simple: usuario "admin", password "admin"
    if (username === 'admin' && password === 'admin') {
      setError('');
      navigate('/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-soft">
      <div className="bg-surface p-8 rounded-3xl shadow-xl shadow-slate-200/80 w-full max-w-md border border-surface-muted">
        <h2 className="text-2xl font-bold mb-6 text-center text-brand">Iniciar Sesión</h2>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-surface-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-surface-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand text-surface py-3 rounded-xl hover:bg-brand-dark transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Entrar
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600 text-center">
          Usuario: admin<br />
          Contraseña: admin
        </p>
      </div>
    </div>
  );
};

export default Login;