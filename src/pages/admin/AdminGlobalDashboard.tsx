import React from 'react';
import { BatchData, ProductDefinition, ProductionLine, UserProfile } from '../../types';

interface AdminGlobalDashboardProps {
  lines: ProductionLine[];
  activeBatch: BatchData;
  products: ProductDefinition[];
  users: UserProfile[];
  adminUser: UserProfile;
  auditLogsCount: number;
  onOpenCreateLineModal: () => void;
  onOpenCreateUserModal: () => void;
  onOpenAuditTrailModal: () => void;
  onOpenCorrectionModal: (batch: BatchData) => void;
  onNavigateToBatch: (batch: BatchData) => void;
  onStartBatchOnLine: (lineId: string) => void;
}

export const AdminGlobalDashboard: React.FC<AdminGlobalDashboardProps> = ({
  lines,
  activeBatch,
  products,
  users,
  adminUser,
  auditLogsCount,
  onOpenCreateLineModal,
  onOpenCreateUserModal,
  onOpenAuditTrailModal,
  onOpenCorrectionModal,
  onNavigateToBatch,
  onStartBatchOnLine,
}) => {
  const activeLinesCount = lines.filter((l) => l.status === 'en_produccion').length;
  const availableLinesCount = lines.filter((l) => l.status === 'disponible').length;
  const operatorsCount = users.filter((u) => u.role === 'operador').length;

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-6 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-12">
      {/* Top Banner / Command Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl shadow-xs border border-[#e6decb]">
        <div>
          <div className="text-xs font-semibold text-[#434655] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            Supervisión Industrial // Módulo Administrador SCADA
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-0.5">
            Dashboard Global de Planta
          </h1>
          <p className="text-xs text-[#434655] mt-1">
            Monitoreo en tiempo real de líneas de producción, trazabilidad de etapas, corrección justificada de errores y gobierno de usuarios.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCreateLineModal}
            className="px-4 py-2.5 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add_box</span>
            <span>Nueva Línea</span>
          </button>

          <button
            onClick={onOpenCreateUserModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Registrar Operador</span>
          </button>

          <button
            onClick={onOpenAuditTrailModal}
            className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-300">history_edu</span>
            <span>Audit Trail ({auditLogsCount})</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-[#e6decb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Lotes Activos</span>
            <span className="material-symbols-outlined text-[#004ac6] text-[20px]">precision_manufacturing</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-[#004ac6]">
              {activeLinesCount}
            </span>
            <span className="text-[10px] text-gray-500 block mt-0.5">
              {availableLinesCount} líneas disponibles
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e6decb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">OEE Planta</span>
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">speed</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
              92.8%
            </span>
            <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
              ✓ Rango óptimo nominal
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e6decb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Operadores Turno</span>
            <span className="material-symbols-outlined text-purple-600 text-[20px]">badge</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-purple-800">
              {operatorsCount}
            </span>
            <span className="text-[10px] text-gray-500 block mt-0.5">
              Turno activo: {adminUser.shift}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e6decb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Audit Trail</span>
            <span className="material-symbols-outlined text-amber-600 text-[20px]">verified</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-700">
              {auditLogsCount}
            </span>
            <span className="text-[10px] text-gray-500 block mt-0.5">
              Rectificaciones justificadas
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Production Lines Status Matrix */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#191c1e] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">table_chart</span>
            <span>Matriz de Líneas de Producción y Procesos en Tiempo Real</span>
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Supervisión continua de etapas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lines.map((line) => {
            const hasBatch = line.status === 'en_produccion' && activeBatch;
            const targetProd = products.find((p) => line.allowedProductIds.includes(p.id));

            return (
              <div
                key={line.id}
                className={`p-5 rounded-2xl border transition-all shadow-xs flex flex-col justify-between gap-4 ${
                  line.status === 'en_produccion'
                    ? 'bg-white border-blue-300 ring-2 ring-blue-50'
                    : line.status === 'disponible'
                    ? 'bg-white border-emerald-200'
                    : 'bg-[#fcfaf7] border-gray-300 opacity-90'
                }`}
              >
                {/* Line Header */}
                <div className="flex items-start justify-between gap-2 border-b border-[#e6decb]/70 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        line.lineType === 'pasta_hilada'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : line.lineType === 'fermentacion'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}>
                        {line.lineTypeName || line.lineType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#004ac6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {line.code}
                      </span>
                      <h3 className="text-base font-bold text-[#191c1e]">{line.name}</h3>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">
                      Capacidad: {line.capacityLiters} L · {line.allowedProductIds.length} producto(s) autorizados
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border shrink-0 ${
                      line.status === 'en_produccion'
                        ? 'bg-blue-100 text-[#004ac6] border-blue-300 animate-pulse'
                        : line.status === 'disponible'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : line.status === 'mantenimiento'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-purple-100 text-purple-800 border-purple-300'
                    }`}
                  >
                    {line.status === 'en_produccion'
                      ? '● En Producción'
                      : line.status === 'disponible'
                      ? '✓ Disponible'
                      : line.status === 'mantenimiento'
                      ? 'En Mantenimiento'
                      : 'Limpieza CIP'}
                  </span>
                </div>

                {/* If In Production: Show Real-Time Batch Data & Sequential Stage Indicator */}
                {hasBatch ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between text-xs bg-[#fcfaf7] p-3 rounded-xl border border-[#e6decb]">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">Lote Activo</span>
                        <span className="font-bold text-[#004ac6] text-sm font-mono">{activeBatch.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">Producto</span>
                        <span className="font-semibold text-gray-800">{activeBatch.productName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">Operador</span>
                        <span className="font-semibold text-gray-800">{activeBatch.operator}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">Cronómetro</span>
                        <span className="font-black text-amber-700 font-mono">{activeBatch.processTimer.formattedTime}</span>
                      </div>
                    </div>

                    {/* Step by step chain indicator */}
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[10px] uppercase font-bold text-gray-500 flex items-center justify-between">
                        <span>Secuencia de Etapas del Proceso</span>
                        <span className="text-[#004ac6] font-bold">
                          Etapa actual: {activeBatch.stageStatuses.desuerar === 'en_proceso' ? 'Desuerar' : 'Proceso Activo'}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-bold">
                        <div className={`p-1.5 rounded-lg border ${activeBatch.stageStatuses.acidificar === 'completada' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-[#004ac6] border-blue-200'}`}>
                          1. Acidificar
                        </div>
                        <div className={`p-1.5 rounded-lg border ${activeBatch.stageStatuses['calentar-y-cuajar'] === 'completada' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-[#004ac6] border-blue-200'}`}>
                          2. Cuajar
                        </div>
                        <div className={`p-1.5 rounded-lg border ${activeBatch.stageStatuses.desuerar === 'completada' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300 ring-1 ring-amber-400'}`}>
                          3. Desuerar
                        </div>
                        <div className={`p-1.5 rounded-lg border ${activeBatch.stageStatuses.hilar === 'completada' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          4. Hilar
                        </div>
                        <div className={`p-1.5 rounded-lg border ${activeBatch.stageStatuses.moldeo === 'completada' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          5. Moldeo
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions on Active Process */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#e6decb]/70">
                      <button
                        onClick={() => onOpenCorrectionModal(activeBatch)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Rectificar parámetro con justificación obligatoria"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                        <span>Corregir Parámetro (Auditado)</span>
                      </button>

                      <button
                        onClick={() => onNavigateToBatch(activeBatch)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>Acceder al Proceso</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 py-2">
                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-1">
                      <span className="font-semibold text-gray-700">Productos autorizados para esta línea:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {line.allowedProductIds.map((pId) => {
                          const p = products.find((prod) => prod.id === pId);
                          return (
                            <span key={pId} className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[10px] text-gray-700 font-medium">
                              {p?.name || pId}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {line.status === 'disponible' && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-emerald-800 font-bold">
                          ✓ Lista para recibir carga de leche
                        </span>
                        <button
                          onClick={() => onStartBatchOnLine(line.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          <span>Iniciar Lote Doble Crema</span>
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Operator Registry & Plant Infrastructure Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Operators List */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#e6decb] shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#e6decb]/70 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-700 text-[20px]">group</span>
              <h3 className="text-sm font-bold text-[#191c1e]">
                Personal Operativo de Planta ({operatorsCount} Operadores)
              </h3>
            </div>
            <button
              onClick={onOpenCreateUserModal}
              className="text-xs text-[#004ac6] font-bold hover:underline cursor-pointer"
            >
              + Agregar
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {users
              .filter((u) => u.role === 'operador')
              .map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-[#fcfaf7] border border-[#e6decb] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-[10px] text-gray-500">ID: {u.code} · Turno: {u.shift}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">
                    Operador
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Right Column: Catalog of Products */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#e6decb] shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#e6decb]/70 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6] text-[20px]">lunch_dining</span>
              <h3 className="text-sm font-bold text-[#191c1e]">
                Catálogo de Fórmulas y Productos ({products.length})
              </h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">NTC-589 / BPM</span>
          </div>

          <div className="flex flex-col gap-2">
            {products.map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  p.isTargetProduct
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-[#fcfaf7] border-[#e6decb]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{p.name}</span>
                    {p.isTargetProduct && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[9px] font-black uppercase">
                        Producto Objetivo
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{p.standards}</div>
                </div>
                <span className="font-mono text-xs font-bold text-[#004ac6]">{p.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
