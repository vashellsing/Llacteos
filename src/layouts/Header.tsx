import React, { useEffect, useState } from 'react';
import { AppView, BatchData, UserProfile, UserRole } from '../types';

interface HeaderProps {
  batch: BatchData;
  currentUser: UserProfile;
  currentView: AppView;
  onSwitchRole: (newRole: UserRole) => void;
  onNavigateView: (view: AppView) => void;
  onOpenMobileMenu: () => void;
  onOpenReviewModal: () => void;
  onOpenCorrectionModal?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  batch,
  currentUser,
  currentView,
  onSwitchRole,
  onNavigateView,
  onOpenMobileMenu,
  onOpenReviewModal,
  onOpenCorrectionModal,
  onLogout,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

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

  const isAdmin = currentUser.role === 'administrador';

  return (
    <header className={`fixed top-0 left-0 ${currentView === 'batch_process' ? 'lg:left-72' : ''} right-0 h-16 bg-[#fcfaf7]/90 backdrop-blur-xl border-b border-[#e6decb] z-40 flex items-center justify-between px-3 lg:px-6 transition-all duration-300`}>
      {/* Left zone: Mobile toggle & Line/Batch info */}
      <div className="flex items-center gap-2 sm:gap-3">
        {currentView === 'batch_process' && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-[#434655] hover:text-[#191c1e] rounded-lg hover:bg-[#f4efe6]"
            aria-label="Abrir menú de navegación"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        )}

        {currentView === 'batch_process' ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white border border-[#e6decb] shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-xs font-bold text-[#004ac6]">
                {batch.id}
              </span>
              <span className="text-[#ded5c2] hidden sm:inline">|</span>
              <span className="text-xs font-semibold text-amber-900 hidden sm:inline">
                {batch.productName}
              </span>
              <span className="text-[#ded5c2] hidden sm:inline">|</span>
              <span className="text-xs font-semibold text-gray-600 hidden sm:inline">
                {batch.line}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white border border-[#e6decb]">
            <span className="material-symbols-outlined text-[18px] text-[#004ac6]">factory</span>
            <span className="text-xs font-bold text-gray-900">
              {currentView === 'admin_dashboard'
                ? 'Panel de Supervisor / Admin'
                : currentView === 'operator_line_select'
                ? 'Elige tu Línea de Trabajo'
                : 'Elige el Producto a Elaborar'}
            </span>
          </div>
        )}

        {/* View Switchers based on role */}
        {isAdmin && (
          <div className="hidden md:flex items-center gap-1.5 ml-1">
            <button
              onClick={() => onNavigateView('admin_dashboard')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'admin_dashboard'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-[#e6decb]'
              }`}
            >
              Dashboard Global
            </button>
            <button
              onClick={() => onNavigateView('batch_process')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'batch_process'
                  ? 'bg-[#004ac6] text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-[#e6decb]'
              }`}
            >
              Ver Proceso Lote
            </button>
          </div>
        )}
      </div>

      {/* Center: Cronómetro Global (When in batch) */}
      <div className="flex items-center">
        {batch.processTimer.isRunning ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/90 border border-blue-300 shadow-xs">
            <span className="material-symbols-outlined text-[18px] text-[#004ac6] animate-pulse">
              timer
            </span>
            <div className="flex flex-col">
              <div className="text-[9px] font-bold text-[#004ac6] uppercase tracking-wider flex items-center gap-1 leading-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                TIEMPO LOTE
              </div>
              <div className="text-xs sm:text-sm font-mono font-extrabold text-[#004ac6] leading-tight">
                {batch.processTimer.formattedTime}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 font-mono">
            <span className="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
            <span>{timeStr}</span>
          </div>
        )}
      </div>

      {/* Right zone: User Info & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Admin Quick Action Button: Corregir Parámetro */}
        {isAdmin && onOpenCorrectionModal && (
          <button
            onClick={onOpenCorrectionModal}
            className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Abrir modal de corrección justificada de errores"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span className="hidden sm:inline">Corregir (Auditado)</span>
          </button>
        )}

        {/* User Card & Logout Trigger */}
        <div className="flex items-center gap-2 pl-1 border-l border-[#e6decb]">
          <div className="hidden xl:flex flex-col text-right">
            <span className="text-xs font-bold text-gray-900 leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-gray-500 font-medium leading-tight">
              {currentUser.code} · Turno {currentUser.shift}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-gray-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer flex items-center gap-1"
            title="Cerrar Sesión de Planta"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-xs font-bold hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
