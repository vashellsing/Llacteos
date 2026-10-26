import React, { useEffect, useState } from 'react';
import { UserProfile } from '../../types';

interface LoginScreenProps {
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedCode = userCode.trim().toUpperCase();
    const matchedUser = users.find(
      (u) =>
        u.code.toUpperCase() === trimmedCode ||
        u.name.toLowerCase().includes(userCode.trim().toLowerCase())
    );

    if (!matchedUser) {
      setErrorMsg('Código de usuario o carnet no registrado en el sistema.');
      return;
    }

    // Check password/pin if provided
    const validPass = matchedUser.password || '1234';
    const validPin = matchedUser.pin || '1234';

    if (password && password !== validPass && password !== validPin && password !== 'admin' && password !== '1234') {
      setErrorMsg('Contraseña o PIN incorrecto. Revisa tus credenciales.');
      return;
    }

    onLogin(matchedUser);
  };

  const handleQuickLogin = (user: UserProfile) => {
    onLogin(user);
  };

  const handleSimulateRfid = () => {
    const op = users.find((u) => u.role === 'operador') || users[1];
    onLogin(op);
  };

  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#191c1e] flex flex-col justify-between selection:bg-amber-200">
      {/* Top Plant Bar */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#e6decb] flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#004ac6] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[24px]">factory</span>
          </div>
          <div>
            <span className="text-sm sm:text-base font-black tracking-tight text-[#191c1e] block leading-tight">
              PLANTA LÁCTEA CENTRAL
            </span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              Sistema de Control de Producción Láctea
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Servidor en Línea</span>
          </div>
          <div className="font-bold text-gray-800 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
            <span>{timeStr}</span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-[#e6decb] overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-in fade-in zoom-in-95">
          {/* Left Panel: Information & Quick Access (7 Cols) */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-white via-[#fcfaf7] to-[#f4efe6] border-b md:border-b-0 md:border-r border-[#e6decb]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Control de Acceso Seguro
                </span>
                <span className="text-[10px] text-gray-500 font-mono">NTC-589 / BPM</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-[#191c1e] mt-2 leading-tight">
                Inicio de Sesión en Planta
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                Selecciona tu perfil de usuario o ingresa tu código de operario para acceder a las líneas de producción y consolas de supervisión.
              </p>

              {/* Quick Login Profiles */}
              <div className="mt-6 flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  ACCESO RÁPIDO POR PERFIL (DEMO / TERMINAL INDUSTRIAL):
                </span>

                {users.map((u) => {
                  const isAdmin = u.role === 'administrador';
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleQuickLogin(u)}
                      type="button"
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 ${
                        isAdmin
                          ? 'bg-red-50/60 border-red-200 hover:border-red-400'
                          : 'bg-white border-[#e6decb] hover:border-[#004ac6]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                            isAdmin
                              ? 'bg-red-800 text-white'
                              : 'bg-blue-100 text-[#004ac6]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {isAdmin ? 'admin_panel_settings' : 'badge'}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-[#191c1e] flex items-center gap-1.5">
                            <span>{u.name}</span>
                            <span className="text-[10px] font-mono font-bold text-gray-500">
                              ({u.code})
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {isAdmin
                              ? 'Administrador General · Control y Auditoría'
                              : 'Operador Responsable de Planta'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                            isAdmin
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : 'bg-blue-50 text-[#004ac6] border-blue-200'
                          }`}
                        >
                          {isAdmin ? 'Admin' : 'Operador'}
                        </span>
                        <span className="material-symbols-outlined text-[18px] text-gray-400">
                          arrow_forward
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RFID Badge Simulation Button */}
            <div className="mt-6 pt-4 border-t border-[#e6decb]/80 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSimulateRfid}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-gray-300 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-[#004ac6]">contactless</span>
                <span>Simular Lectura de Carnet RFID (Operario Línea 1)</span>
              </button>
              <span className="text-[10px] text-gray-500 text-center">
                Terminal HMI compatible con lectores RFID / código de barras de planta
              </span>
            </div>
          </div>

          {/* Right Panel: Manual Credentials Form (5 Cols) */}
          <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <form onSubmit={handleManualLogin} className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  INGRESO MANUAL
                </span>
                <h3 className="text-lg font-bold text-[#191c1e] mt-0.5">
                  Credenciales de Usuario
                </h3>
              </div>

              {/* Código de Usuario */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Código de Usuario o Carnet</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[18px] text-gray-400">
                    person
                  </span>
                  <input
                    type="text"
                    value={userCode}
                    onChange={(e) => {
                      setUserCode(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="ej: ADM-901 o OP-104"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#e6decb] text-xs font-bold text-gray-900 outline-none uppercase focus:border-[#004ac6] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Contraseña / PIN */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Contraseña o PIN de Planta</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[18px] text-gray-400">
                    key
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#e6decb] text-xs font-bold text-gray-900 outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <span className="text-[10px] text-gray-500">
                  PIN demo: <strong>admin</strong> (para ADM-901) / <strong>1234</strong> (para OP-104)
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 mt-2"
              >
                <span>Ingresar al Sistema</span>
                <span className="material-symbols-outlined text-[18px]">login</span>
              </button>
            </form>

            {/* Quality & Traceability Footer */}
            <div className="mt-6 pt-4 border-t border-[#e6decb]/80 flex items-center justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
                <span>BPM & HACCP Verificado</span>
              </span>
              <span>Líneas Activas: 4</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Legal & Plant Standard */}
      <footer className="h-12 bg-white/70 border-t border-[#e6decb] flex items-center justify-between px-4 lg:px-8 text-[11px] text-gray-500">
        <div>Planta Láctea Central © 2026 · Control de Calidad e Inocuidad en Planta</div>
        <div className="hidden sm:inline">Líneas Habilitadas: Pasta Hilada y Fermentados (NTC-589 / NTC-805)</div>
      </footer>
    </div>
  );
};
