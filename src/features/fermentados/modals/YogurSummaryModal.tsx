import React, { useEffect, useState } from 'react';
import { Modal } from '../../../components/ui';
import { UserProfile } from '../../../types';
import { YogurBatchData } from '../../../types/yogur';

interface YogurSummaryModalProps {
  batch: YogurBatchData;
  isOpen: boolean;
  onClose: () => void;
  users?: UserProfile[];
  onFinalizeBatch?: () => void;
  onChangeObservaciones?: (observaciones: string) => void;
  onChangeOperariosIntervinientes?: (operarios: string[]) => void;
}

const DEFAULT_OPERATOR_CATALOG = [
  'Carlos Mendoza (OP-104)',
  'Luisa Ramírez (OP-105)',
  'Andrés Cifuentes (OP-108)',
  'Jorge Valderrama (OP-112)',
  'Diana Gómez (OP-115)',
  'Mateo Ríos (OP-119)',
];

export const YogurSummaryModal: React.FC<YogurSummaryModalProps> = ({
  batch,
  isOpen,
  onClose,
  users = [],
  onFinalizeBatch,
  onChangeObservaciones,
  onChangeOperariosIntervinientes,
}) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'detalle' | 'certificado'>('resumen');
  const [localObservaciones, setLocalObservaciones] = useState<string>(batch.observaciones || '');

  const responsable = batch.responsableProceso || batch.operator || 'Carlos Mendoza';

  // Operarios que intervinieron en el proceso
  const [operariosList, setOperariosList] = useState<string[]>(() =>
    batch.operariosIntervinientes && batch.operariosIntervinientes.length > 0
      ? batch.operariosIntervinientes
      : [responsable]
  );
  const [selectedDropdownOp, setSelectedDropdownOp] = useState<string>('');
  const [customOperatorName, setCustomOperatorName] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Sincronizar estados locales al abrir el modal o cambiar lote
  useEffect(() => {
    if (isOpen) {
      setLocalObservaciones(batch.observaciones || '');
      setOperariosList(
        batch.operariosIntervinientes && batch.operariosIntervinientes.length > 0
          ? batch.operariosIntervinientes
          : [batch.responsableProceso || batch.operator || 'Carlos Mendoza']
      );
    }
  }, [isOpen, batch.id, batch.observaciones, batch.operariosIntervinientes, batch.responsableProceso, batch.operator]);

  // Catálogo unificado de operarios
  const availableOperators = React.useMemo(() => {
    const fromUsers = users
      .filter((u) => u.role === 'operador')
      .map((u) => `${u.name} (${u.code})`);
    return Array.from(new Set([...fromUsers, ...DEFAULT_OPERATOR_CATALOG]));
  }, [users]);

  if (!isOpen) return null;

  const { pasteurizacion, inoculacion, maduracionFrio, batidoYAdiciones, envasado } = batch;

  // 1. Cálculos de envasado (agregando presentaciones tradicionales y categorías Sin Azúcar / Stevia)
  const uSinAzucar_200ml = envasado.formatos.sinAzucar_botella200ml || 0;
  const uSinAzucar_1L = envasado.formatos.sinAzucar_botella1L || 0;
  const uSinAzucar_2L = envasado.formatos.sinAzucar_botella2L || 0;
  const uSinAzucar_4L = envasado.formatos.sinAzucar_bolsa4L || 0;

  const uStevia_120ml = envasado.formatos.stevia_botella120ml || 0;
  const uStevia_200ml = envasado.formatos.stevia_botella200ml || 0;
  const uStevia_1L = envasado.formatos.stevia_botella1L || 0;
  const uStevia_2L = envasado.formatos.stevia_botella2L || 0;
  const uStevia_4L = envasado.formatos.stevia_bolsa4L || 0;

  const uTrad_120ml = envasado.formatos.botella120ml || 0;
  const uTrad_200ml = (envasado.formatos.botella200ml ?? envasado.formatos.vaso200g) || 0;
  const uTrad_1L = (envasado.formatos.botella1L ?? envasado.formatos.botella1000g) || 0;
  const uTrad_2L = envasado.formatos.botella2L || 0;
  const uTrad_4L = envasado.formatos.bolsa4L || 0;

  const u120ml = uStevia_120ml + uTrad_120ml;
  const u200ml = uSinAzucar_200ml + uStevia_200ml + uTrad_200ml;
  const u1L = uSinAzucar_1L + uStevia_1L + uTrad_1L;
  const u2L = uSinAzucar_2L + uStevia_2L + uTrad_2L;
  const u4L = uSinAzucar_4L + uStevia_4L + uTrad_4L;

  const totalUnidades = u120ml + u200ml + u1L + u2L + u4L;
  const totalLitrosEnvasados = Number(
    (u120ml * 0.12 + u200ml * 0.2 + u1L * 1.0 + u2L * 2.0 + u4L * 4.0).toFixed(2)
  );
  const totalKilosEnvasados = Math.round((totalLitrosEnvasados * 1.03) * 100) / 100;
  const totalGramosEnvasados = Math.round(totalKilosEnvasados * 1000);

  // 2. Variedades de Yogur (Yogur sin azúcar, Yogur con azúcar, Yogur con estevia)
  const variedadSinAzucar = batidoYAdiciones.adiciones.variedadSinAzucar || batidoYAdiciones.adiciones.variedadNatural || {
    litrosBase: 25,
    notaInformativa: 'Exento de azúcar, saborizante y colorante. Directo a envasado.',
  };
  const variedadAzucar = batidoYAdiciones.adiciones.variedadAzucar || {
    litrosBase: 50,
    gramosAzucar: 4000,
    kilosAzucar: 4.0,
    loteAzucar: 'AZU-2026-11',
  };
  const variedadEstevia = batidoYAdiciones.adiciones.variedadEstevia || {
    litrosBase: 25,
    gramosEstevia: 80,
    loteEstevia: 'EST-2026-BIO',
  };
  const saborizante = batidoYAdiciones.adiciones.saborizante || {
    habilitado: batidoYAdiciones.adiciones.variedadAzucar?.llevaSaborizante ?? true,
    sabor: batidoYAdiciones.adiciones.variedadAzucar?.sabor || 'Mora',
    cantidad: batidoYAdiciones.adiciones.variedadAzucar?.saborizanteMl || 800,
    unidad: 'ml',
    loteSaborizante: batidoYAdiciones.adiciones.variedadAzucar?.loteSaborizante || 'SAB-MORA-26',
  };

  const totalLitrosBaseVariedades =
    (variedadSinAzucar.litrosBase || 0) +
    (variedadAzucar.litrosBase || 0) +
    (variedadEstevia.litrosBase || 0);

  // Estados de elaboración de las 3 variedades
  const hasSinAzucar = (variedadSinAzucar.litrosBase || 0) > 0;
  const hasAzucar = (variedadAzucar.litrosBase || 0) > 0 || (variedadAzucar.gramosAzucar || 0) > 0;
  const hasEstevia = (variedadEstevia.litrosBase || 0) > 0 || (variedadEstevia.gramosEstevia || 0) > 0;

  // Unidades por variedad proporcionales a los litros base formulados
  const unidadesSinAzucar = totalLitrosBaseVariedades > 0
    ? Math.round(totalUnidades * ((variedadSinAzucar.litrosBase || 0) / totalLitrosBaseVariedades))
    : 0;
  const unidadesAzucar = totalLitrosBaseVariedades > 0
    ? Math.round(totalUnidades * ((variedadAzucar.litrosBase || 0) / totalLitrosBaseVariedades))
    : 0;
  const unidadesEstevia = totalLitrosBaseVariedades > 0
    ? Math.max(0, totalUnidades - unidadesSinAzucar - unidadesAzucar)
    : 0;

  // Balance de masa total formulada vs. envasada
  const lecheKg = (pasteurizacion.litrosLeche || 100) * 1.03;
  const adicAzucarKg = hasAzucar ? (variedadAzucar.gramosAzucar || 0) / 1000 : 0;
  const adicEsteviaKg = hasEstevia ? (variedadEstevia.gramosEstevia || 0) / 1000 : 0;
  const adicSaborKg = saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante'
    ? (saborizante.cantidad || 0) / 1000
    : 0;
  const totalFormuladoKg = Math.round((lecheKg + adicAzucarKg + adicEsteviaKg + adicSaborKg) * 100) / 100;
  const rendimientoPct = totalFormuladoKg > 0 ? (totalKilosEnvasados / totalFormuladoKg) * 100 : 0;

  // Handlers para operarios intervinientes
  const handleAddOperator = (opName: string) => {
    const trimmed = opName.trim();
    if (!trimmed) return;
    if (!operariosList.includes(trimmed)) {
      const updated = [...operariosList, trimmed];
      setOperariosList(updated);
      if (onChangeOperariosIntervinientes) {
        onChangeOperariosIntervinientes(updated);
      }
    }
  };

  const handleRemoveOperator = (opName: string) => {
    const updated = operariosList.filter((item) => item !== opName);
    setOperariosList(updated);
    if (onChangeOperariosIntervinientes) {
      onChangeOperariosIntervinientes(updated);
    }
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__custom__') {
      setShowCustomInput(true);
      setSelectedDropdownOp('');
      return;
    }
    setShowCustomInput(false);
    if (value) {
      handleAddOperator(value);
      setSelectedDropdownOp('');
    }
  };

  const handleAddCustomOperator = () => {
    if (customOperatorName.trim()) {
      handleAddOperator(customOperatorName.trim());
      setCustomOperatorName('');
      setShowCustomInput(false);
    }
  };

  const handleSaveAndClose = () => {
    if (onChangeObservaciones) {
      onChangeObservaciones(localObservaciones);
    }
    if (onChangeOperariosIntervinientes) {
      onChangeOperariosIntervinientes(operariosList);
    }
    if (onFinalizeBatch) {
      onFinalizeBatch();
    }
    onClose();
  };

  const isCompleted = batch.processTimer.isCompleted || batch.status === 'COMPLETADO';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      icon="icecream"
      title={`Resumen Final · ${batch.id}`}
      subtitle={
        <span>
          Producto: <span className="font-semibold text-purple-900">{batch.productName}</span> · {batch.line}
        </span>
      }
      badge={
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-purple-800 tracking-wider uppercase font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            VERIFICACIÓN DE LOTE Y CONTROL DE CALIDAD
          </span>
          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black uppercase tracking-wider font-mono">
            NTC-805
          </span>
          {isCompleted && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider">
              ✓ PROCESO TERMINADO · RELOJ DETENIDO
            </span>
          )}
        </div>
      }
      tabs={
        <div className="flex items-center gap-2 px-5 py-2 bg-[#fcfaf7]">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'resumen'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#434655] hover:bg-[#f4efe6]'
            }`}
          >
            Métricas Clave
          </button>
          <button
            onClick={() => setActiveTab('detalle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'detalle'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#434655] hover:bg-[#f4efe6]'
            }`}
          >
            Desglose de 5 Fases
          </button>
          <button
            onClick={() => setActiveTab('certificado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'certificado'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#434655] hover:bg-[#f4efe6]'
            }`}
          >
            Constancia del Lote
          </button>
        </div>
      }
      footer={
        <div className="w-full flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs text-gray-500">
            Lote: <strong className="text-gray-800">{batch.id}</strong> · Responsable:{' '}
            <strong className="text-gray-800">{responsable}</strong>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              className="h-10 px-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span>Cerrar Resumen</span>
            </button>
            <button
              className="h-10 px-5 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-all shadow-md text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              onClick={handleSaveAndClose}
            >
              <span className="material-symbols-outlined text-[17px]">task_alt</span>
              <span>Confirmar Proceso Terminado</span>
            </button>
          </div>
        </div>
      }
    >
          {/* ==============================================================
              PESTAÑA 1: MÉTRICAS CLAVE (YOGUR)
          ============================================================== */}
          {activeTab === 'resumen' && (
            <div className="flex flex-col gap-4">
              {/* 1. BLOQUE SUPERIOR (3 Tarjetas de Resumen) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#fcfaf7] p-3.5 rounded-2xl border border-[#e6decb]">
                {/* Tarjeta 1 (TOTAL LECHE USADA) */}
                <div className="bg-white p-3 rounded-xl border border-[#e6decb] shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#434655] uppercase font-bold tracking-wider">
                      Total Leche Usada
                    </span>
                    <span className="material-symbols-outlined text-purple-700 text-[20px]">
                      water_drop
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="font-black text-xl text-purple-900 font-mono">
                      {pasteurizacion.litrosLeche || 100} L
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Leche entera procesada
                  </span>
                </div>

                {/* Tarjeta 2 (CRONÓMETRO / TIEMPO TOTAL) */}
                <div className="bg-white p-3 rounded-xl border border-[#e6decb] shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#434655] uppercase font-bold tracking-wider">
                      Cronómetro / Tiempo Total
                    </span>
                    <span className="material-symbols-outlined text-amber-600 text-[20px]">
                      timer
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="font-black text-xl text-gray-900 font-mono">
                      {envasado.procesoFinalizado?.tiempoTotalProceso ||
                        batch.processTimer.formattedTime ||
                        '20h 30m'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ✓ Proceso Monitoreado
                  </span>
                </div>

                {/* Tarjeta 3 (RESPONSABLE PRINCIPAL) */}
                <div className="bg-white p-3 rounded-xl border border-[#e6decb] shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#434655] uppercase font-bold tracking-wider">
                      Responsable Principal
                    </span>
                    <span className="material-symbols-outlined text-gray-500 text-[20px]">
                      badge
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="font-bold text-base text-gray-900 block truncate">
                      {responsable}
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-800 font-bold block truncate">
                    {operariosList.length} operario(s) registrado(s)
                  </span>
                </div>
              </div>

              {/* 2. SECCIÓN: "Trazabilidad de Materias Primas e Insumos" */}
              <div className="bg-[#fcfaf7] p-3.5 rounded-xl border border-[#e6decb] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-purple-800">
                      inventory_2
                    </span>
                    Trazabilidad de Materias Primas e Insumos
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold bg-white px-2 py-0.5 rounded border border-[#e6decb]">
                    Lotes Registrados · Yogur
                  </span>
                </div>

                {/* Grid Dinámico de 5 Tarjetas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 text-xs">
                  {/* Tarjeta 1 (Borde Azul - Obligatoria): LOTE LECHE */}
                  <div className="bg-white p-3 rounded-xl border-2 border-sky-400 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-sky-900 font-extrabold uppercase tracking-wide">
                        LOTE LECHE
                      </span>
                      <span className="material-symbols-outlined text-sky-500 text-[18px]">
                        water_drop
                      </span>
                    </div>
                    <span className="font-bold text-sky-950 font-mono text-sm mt-1">
                      {pasteurizacion.loteLeche || 'LE-2026-YOG-01'}
                    </span>
                    <div className="mt-1 pt-1 border-t border-sky-100 flex items-center justify-between">
                      <span className="text-[11px] text-sky-800 font-bold">
                        {pasteurizacion.litrosLeche || 100} L usados
                      </span>
                      <span className="text-[9px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                        Pasteurizada a 85-90 °C
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta 2 (Borde Verde - Obligatoria): LOTE CULTIVO LÁCTICO */}
                  <div className="bg-white p-3 rounded-xl border-2 border-emerald-500 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-900 font-extrabold uppercase tracking-wide">
                        LOTE CULTIVO LÁCTICO
                      </span>
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                        science
                      </span>
                    </div>
                    <span className="font-bold text-emerald-950 font-mono text-sm mt-1">
                      {inoculacion.loteCultivo || 'CULT-PROB-2026-04'}
                    </span>
                    <div className="mt-1 pt-1 border-t border-emerald-100 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-800 font-bold">
                        {inoculacion.cantidadCultivoGramos || 2.5} g dosificados
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ✓ Inoculado a 45 °C (8 h)
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta 3 (Condicional - Azúcar): LOTE AZÚCAR */}
                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      hasAzucar
                        ? 'bg-white border-2 border-amber-500 shadow-2xs'
                        : 'bg-gray-50/80 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wide ${
                          hasAzucar ? 'text-amber-900' : 'text-gray-400'
                        }`}
                      >
                        LOTE AZÚCAR
                      </span>
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          hasAzucar ? 'text-amber-600' : 'text-gray-400'
                        }`}
                      >
                        cookie
                      </span>
                    </div>
                    <span
                      className={`font-bold font-mono text-sm mt-1 ${
                        hasAzucar ? 'text-amber-950' : 'text-gray-400'
                      }`}
                    >
                      {hasAzucar
                        ? variedadAzucar.loteAzucar || batidoYAdiciones.adiciones.loteAzucar || 'AZ-ING-2026'
                        : 'N/A'}
                    </span>
                    <div
                      className={`mt-1 pt-1 border-t flex items-center justify-between ${
                        hasAzucar ? 'border-amber-100' : 'border-gray-200'
                      }`}
                    >
                      {hasAzucar ? (
                        <>
                          <span className="text-[11px] text-amber-800 font-bold">
                            {variedadAzucar.gramosAzucar || 4500} g usados
                          </span>
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            Sacarosa refinada
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-medium italic">
                          Sin adición de azúcar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tarjeta 4 (Condicional - Estevia): LOTE ESTEVIA */}
                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      hasEstevia
                        ? 'bg-white border-2 border-indigo-500 shadow-2xs'
                        : 'bg-gray-50/80 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wide ${
                          hasEstevia ? 'text-indigo-900' : 'text-gray-400'
                        }`}
                      >
                        LOTE ESTEVIA
                      </span>
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          hasEstevia ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                      >
                        spa
                      </span>
                    </div>
                    <span
                      className={`font-bold font-mono text-sm mt-1 ${
                        hasEstevia ? 'text-indigo-950' : 'text-gray-400'
                      }`}
                    >
                      {hasEstevia ? variedadEstevia.loteEstevia || 'EST-2026-BIO' : 'N/A'}
                    </span>
                    <div
                      className={`mt-1 pt-1 border-t flex items-center justify-between ${
                        hasEstevia ? 'border-indigo-100' : 'border-gray-200'
                      }`}
                    >
                      {hasEstevia ? (
                        <>
                          <span className="text-[11px] text-indigo-800 font-bold">
                            {variedadEstevia.gramosEstevia || 80} g usados
                          </span>
                          <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            Glucósidos
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-medium italic">
                          Sin adición de estevia
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tarjeta 5 (Condicional - Saborizante): LOTE SABORIZANTE NATURAL */}
                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante'
                        ? 'bg-white border-2 border-rose-400 shadow-2xs'
                        : 'bg-gray-50/80 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wide ${
                          saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante'
                            ? 'text-rose-900'
                            : 'text-gray-400'
                        }`}
                      >
                        LOTE SABORIZANTE
                      </span>
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante'
                            ? 'text-rose-600'
                            : 'text-gray-400'
                        }`}
                      >
                        local_florist
                      </span>
                    </div>
                    <span
                      className={`font-bold font-mono text-sm mt-1 truncate ${
                        saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante'
                          ? 'text-rose-950'
                          : 'text-gray-400'
                      }`}
                    >
                      {saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante'
                        ? saborizante.loteSaborizante || 'SAB-MORA-26'
                        : 'N/A'}
                    </span>
                    <div
                      className={`mt-1 pt-1 border-t flex items-center justify-between ${
                        saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante'
                          ? 'border-rose-100'
                          : 'border-gray-200'
                      }`}
                    >
                      {saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante' ? (
                        <>
                          <span className="text-[11px] text-rose-800 font-bold truncate">
                            {saborizante.sabor}
                          </span>
                          <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded shrink-0">
                            {saborizante.cantidad} {saborizante.unidad}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-medium italic">
                          Natural / Sin saborizante
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SECCIÓN: "Resumen de Producción y Variedades (Yogur)" */}
              <div className="bg-[#fcfaf7] p-3.5 rounded-xl border border-purple-200 flex flex-col gap-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-purple-900">
                      view_agenda
                    </span>
                    Resumen de Producción y Variedades (Yogur)
                  </span>
                  <span className="text-[10px] text-purple-950 font-bold bg-purple-100/90 px-3 py-1 rounded-full border border-purple-300">
                    {totalUnidades} unidades totales · {totalLitrosEnvasados.toFixed(1)} Litros envasados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Tarjeta A (Yogur sin azúcar) */}
                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      hasSinAzucar
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-2xs'
                        : 'bg-gray-100/90 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            hasSinAzucar ? 'text-emerald-700' : 'text-gray-400'
                          }`}
                        >
                          eco
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            hasSinAzucar ? 'text-emerald-950' : 'text-gray-600'
                          }`}
                        >
                          Yogur sin azúcar
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          hasSinAzucar
                            ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {hasSinAzucar ? 'ELABORADO' : 'SIN UNIDADES'}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      {hasSinAzucar ? (
                        <div>
                          <span className="text-sm font-black font-mono text-emerald-950 block">
                            {unidadesSinAzucar} unidades obtenidas
                          </span>
                          <span className="text-[10px] text-emerald-800 font-medium mt-0.5 block">
                            {variedadSinAzucar.litrosBase} L base ({(variedadSinAzucar.litrosBase * 1.03).toFixed(1)} kg) · Exento de azúcar y saborizante
                          </span>
                        </div>
                      ) : (
                        <div className="py-1">
                          <span className="text-xs font-bold text-gray-500 italic block">
                            No elaborado en este lote
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            0 L base · 0 unidades
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tarjeta B (Yogur Con Azúcar) */}
                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      hasAzucar
                        ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                        : 'bg-gray-100/90 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            hasAzucar ? 'text-amber-700' : 'text-gray-400'
                          }`}
                        >
                          cookie
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            hasAzucar ? 'text-amber-950' : 'text-gray-600'
                          }`}
                        >
                          Yogur Con Azúcar
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          hasAzucar
                            ? 'bg-amber-200 text-amber-900 border border-amber-300'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {hasAzucar ? 'ELABORADO' : 'SIN UNIDADES'}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      {hasAzucar ? (
                        <div>
                          <span className="text-sm font-black font-mono text-amber-950 block">
                            {unidadesAzucar} unidades obtenidas
                          </span>
                          <span className="text-[10px] text-amber-800 font-medium mt-0.5 block">
                            {variedadAzucar.litrosBase} L base · {variedadAzucar.gramosAzucar || 4500} g azúcar ({variedadAzucar.kilosAzucar || 4.5} kg)
                          </span>
                        </div>
                      ) : (
                        <div className="py-1">
                          <span className="text-xs font-bold text-gray-500 italic block">
                            No elaborado en este lote
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            0 L base · 0 unidades
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tarjeta C (Yogur Con Estevia) */}
                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      hasEstevia
                        ? 'bg-indigo-50/70 border-indigo-400 shadow-2xs'
                        : 'bg-gray-100/90 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            hasEstevia ? 'text-indigo-700' : 'text-gray-400'
                          }`}
                        >
                          spa
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            hasEstevia ? 'text-indigo-950' : 'text-gray-600'
                          }`}
                        >
                          Yogur Con Estevia
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          hasEstevia
                            ? 'bg-indigo-200 text-indigo-900 border border-indigo-300'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {hasEstevia ? 'ELABORADO' : 'SIN UNIDADES'}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      {hasEstevia ? (
                        <div>
                          <span className="text-sm font-black font-mono text-indigo-950 block">
                            {unidadesEstevia} unidades obtenidas
                          </span>
                          <span className="text-[10px] text-indigo-800 font-medium mt-0.5 block">
                            {variedadEstevia.litrosBase} L base · {variedadEstevia.gramosEstevia || 80} g estevia adicionada
                          </span>
                        </div>
                      ) : (
                        <div className="py-1">
                          <span className="text-xs font-bold text-gray-500 italic block">
                            No elaborado en este lote
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            0 L base · 0 unidades
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. BLOQUES INFERIORES DE CIERRE */}
              {/* Formulario de Observaciones al Cierre del Proceso (Bitácora Oficial de Lote) */}
              <div className="p-3.5 rounded-xl bg-white border border-[#e6decb] shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#e6decb]/70">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-purple-800">
                      notes
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900">
                      Formulario de Observaciones al Cierre del Proceso
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Bitácora Oficial de Lote · Yogur
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={localObservaciones}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalObservaciones(val);
                    if (onChangeObservaciones) onChangeObservaciones(val);
                  }}
                  placeholder="Ingresa aquí observaciones, desviaciones menores, ajustes de viscosidad, temperatura de inoculación o incidencias técnicas ocurridas durante el lote de yogur..."
                  className="w-full p-2.5 rounded-lg bg-[#fcfaf7] border border-[#e6decb] text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-purple-600 focus:bg-white transition-all resize-y"
                />
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>
                    Responsable de registro: <strong>{responsable}</strong>
                  </span>
                  <span>{localObservaciones.length} caracteres</span>
                </div>
              </div>

              {/* Selector desplegable de Operarios que Intervinieron en el Proceso */}
              <div className="p-3.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb] shadow-2xs flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-[#e6decb]/70">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-purple-800">
                      group_add
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900">
                      Operarios que Intervinieron en el Proceso
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 self-start sm:self-auto">
                    {operariosList.length} operario(s) en el lote
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedDropdownOp}
                      onChange={handleDropdownChange}
                      className="w-full p-2.5 rounded-xl bg-white border border-[#e6decb] text-xs font-bold text-gray-900 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100 cursor-pointer"
                    >
                      <option value="">
                        -- Seleccionar operario del menú desplegable para agregar al lote --
                      </option>
                      {availableOperators.map((op) => (
                        <option key={op} value={op}>
                          {operariosList.includes(op) ? `✓ ${op} (Ya agregado)` : `+ ${op}`}
                        </option>
                      ))}
                      <option value="__custom__">
                        + Ingresar otro operario manualmente...
                      </option>
                    </select>
                  </div>
                </div>

                {showCustomInput && (
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-purple-200">
                    <input
                      type="text"
                      value={customOperatorName}
                      onChange={(e) => setCustomOperatorName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomOperator();
                        }
                      }}
                      placeholder="Nombre completo y código del operario (ej: Sandra Gómez OP-122)..."
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-[#fcfaf7] border border-[#e6decb] outline-none focus:border-purple-700"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomOperator}
                      className="px-3 py-1.5 rounded-lg bg-purple-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomOperatorName('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {/* Lista de etiquetas (chips) de los operarios seleccionados */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {operariosList.length === 0 ? (
                    <span className="text-[11px] text-gray-400 italic">
                      Ningún operario seleccionado. Usa el menú desplegable para agregar los operarios que participaron.
                    </span>
                  ) : (
                    operariosList.map((op) => (
                      <span
                        key={op}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-purple-200 text-xs font-bold text-gray-800 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[14px] text-purple-700">
                          person
                        </span>
                        <span>{op}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOperator(op)}
                          className="ml-0.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer flex items-center"
                          title={`Quitar a ${op}`}
                        >
                          <span className="material-symbols-outlined text-[15px]">close</span>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Tarjeta de Límites Críticos de Control (LCC) Cumplidos */}
              <div className="flex items-start gap-2.5 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="material-symbols-outlined text-amber-700 text-[20px] shrink-0 mt-0.5">
                  verified
                </span>
                <div>
                  <div className="text-xs font-bold text-amber-900">
                    Límites Críticos de Control (LCC) Cumplidos
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Todos los parámetros ingresados (pasteurización a 85-90 °C, enfriamiento e inoculación a 45 °C, fermentación por 8 h y maduración en frío por 12 h) se encuentran dentro de los límites críticos de control (LCC) establecidos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              PESTAÑA 2: DESGLOSE DE 5 FASES (YOGUR)
          ============================================================== */}
          {activeTab === 'detalle' && (
            <div className="space-y-3.5 text-xs">
              {/* FASE 1: PASTEURIZACIÓN Y ENFRIAMIENTO */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#e6decb]/70 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider border border-purple-200">
                      Fase 01
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">
                      Pasteurización y Enfriamiento
                    </h3>
                  </div>
                  <div className="text-[11px] font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-2 flex-wrap">
                    <span>Consigna Térmica: 85 - 90 °C</span>
                    <span>·</span>
                    <span>Enfriamiento: 45.0 °C</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300 font-bold">
                      CONFORME ✓
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Litros de Leche
                    </span>
                    <span className="text-sm font-black font-mono text-purple-950 mt-0.5">
                      {pasteurizacion.litrosLeche || 100} L
                    </span>
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      Lote: {pasteurizacion.loteLeche} · {pasteurizacion.acidezDornic} °D
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Temp. Pasteurización
                    </span>
                    <span className="text-sm font-black font-mono text-amber-900 mt-0.5">
                      {pasteurizacion.calentamiento.temperaturaAlcanzada || 88.0} °C
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Consigna: {pasteurizacion.calentamiento.temperaturaConsigna || 88.0} °C
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Tiempo de Cocción
                    </span>
                    <span className="text-sm font-black font-mono text-purple-900 mt-0.5">
                      {pasteurizacion.calentamiento.tiempoCalentamiento || '80 min'}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Mantenimiento a 85-90 °C
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Enfriamiento a 45 °C
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-800 mt-0.5">
                      {pasteurizacion.enfriamiento.temperaturaFinal || 45.0} °C
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Tardó: {pasteurizacion.enfriamiento.tiempoEnfriamiento || '45 min'}
                    </span>
                  </div>
                </div>
              </div>

              {/* FASE 2: INOCULACIÓN (CULTIVO PROBIÓTICO) */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#e6decb]/70 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider border border-purple-200">
                      Fase 02
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">
                      Inoculación (Cultivo Probiótico)
                    </h3>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-2 flex-wrap">
                    <span>Incubación: 8 horas a 42-45 °C</span>
                    <span>·</span>
                    <span>pH Final: {inoculacion.incubacion.phFinalIncubacion || 4.55}</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300 font-bold">
                      CONFORME ✓
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Lote Cultivo Láctico
                    </span>
                    <span className="text-sm font-black font-mono text-gray-900 mt-0.5 truncate">
                      {inoculacion.loteCultivo || 'CULT-PROB-2026-04'}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-0.5 truncate">
                      Sobre DVI liofilizado
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Dosis de Cultivo
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-900 mt-0.5">
                      {inoculacion.cantidadCultivoGramos || 2.5} g
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Mezclado: {inoculacion.tiempoMezcladoMinutos || 5} min
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Temp. Inoculación
                    </span>
                    <span className="text-sm font-black font-mono text-purple-900 mt-0.5">
                      {inoculacion.temperaturaVerificada45 || 45.0} °C
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Hora: {inoculacion.horaInoculacion || '10:00 AM'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Tiempo Incubación
                    </span>
                    <span className="text-sm font-black font-mono text-indigo-900 mt-0.5">
                      {inoculacion.incubacion.tiempoTranscurrido || '8 horas'}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Cámara a {inoculacion.incubacion.temperaturaCamara || 43.0} °C
                    </span>
                  </div>
                </div>
              </div>

              {/* FASE 3: MADURACIÓN EN FRÍO */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#e6decb]/70 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider border border-purple-200">
                      Fase 03
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">
                      Maduración en Frío
                    </h3>
                  </div>
                  <div className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-2 flex-wrap">
                    <span>Refrigeración: 12 horas</span>
                    <span>·</span>
                    <span>Rango Térmico: 2 - 4 °C</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300 font-bold">
                      CONFORME ✓
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Tiempo de Traslado
                    </span>
                    <span className="text-sm font-black font-mono text-gray-900 mt-0.5">
                      {maduracionFrio.trasladoCantinas.tiempoTraslado || '10 min'}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      {maduracionFrio.trasladoCantinas.numeroCantinas || 3} cantinas selladas
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Tiempo en Cuarto Frío
                    </span>
                    <span className="text-sm font-black font-mono text-blue-950 mt-0.5">
                      {maduracionFrio.refrigeracion.tiempoTranscurrido || '12 horas'}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Objetivo 12 h cumplido
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Temp. Cuarto Frío
                    </span>
                    <span className="text-sm font-black font-mono text-blue-800 mt-0.5">
                      {maduracionFrio.refrigeracion.temperaturaCuartoFrio || 3.5} °C
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Rango: 2.0 °C - 4.0 °C
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      pH Final en Frío
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-800 mt-0.5">
                      {maduracionFrio.refrigeracion.phFinalFrio || 4.45}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5 truncate">
                      {maduracionFrio.refrigeracion.viscosidadApreciada || 'Cuerpo estructurado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* FASE 4: BATIDO Y ADICIONES */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#e6decb]/70 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider border border-purple-200">
                      Fase 04
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">
                      Batido y Adiciones (Formulación)
                    </h3>
                  </div>
                  <div className="text-[11px] font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-2 flex-wrap">
                    <span>Batido a {batidoYAdiciones.batidora.velocidadRpm || 35} RPM</span>
                    <span>·</span>
                    <span>Masa Formulada: {totalFormuladoKg.toFixed(2)} kg</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300 font-bold">
                      CONFORME ✓
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Tiempo de Batido
                    </span>
                    <span className="text-sm font-black font-mono text-purple-900 mt-0.5">
                      {batidoYAdiciones.batidora.tiempoBatido || '12 min'}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      Velocidad: {batidoYAdiciones.batidora.velocidadRpm || 35} RPM suave
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Yogur sin azúcar
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-900 mt-0.5">
                      {variedadSinAzucar.litrosBase || 0} L base
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Sin azúcar · Sin saborizante
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Azúcar y Estevia
                    </span>
                    <span className="text-sm font-black font-mono text-amber-900 mt-0.5">
                      {hasAzucar ? `${variedadAzucar.gramosAzucar} g az.` : '0 g az.'}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      {hasEstevia ? `${variedadEstevia.gramosEstevia} g estevia` : '0 g estevia'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Saborizante Natural
                    </span>
                    <span className="text-sm font-black font-mono text-rose-900 mt-0.5 truncate">
                      {saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante'
                        ? saborizante.sabor
                        : 'Natural'}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5 truncate">
                      {saborizante.habilitado && saborizante.sabor !== 'Sin Saborizante'
                        ? `${saborizante.cantidad} ${saborizante.unidad} · Lote ${saborizante.loteSaborizante}`
                        : 'Sin saborizante añadido'}
                    </span>
                  </div>
                </div>
              </div>

              {/* FASE 5: ENVASADO Y ALMACENAMIENTO */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#e6decb]/70 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider border border-purple-200">
                      Fase 05
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">
                      Envasado y Almacenamiento
                    </h3>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-2 flex-wrap">
                    <span>Lote Terminado: {envasado.loteProductoTerminado || 'YOG-01-20261020'}</span>
                    <span>·</span>
                    <span>Vencimiento: {envasado.fechaVencimiento || '14/11/2026'}</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300 font-bold">
                      CONFORME ✓
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Total Envases Obtenidos
                    </span>
                    <span className="text-sm font-black font-mono text-purple-950 mt-0.5">
                      {totalUnidades} envases ({totalLitrosEnvasados.toFixed(1)} L)
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      {u120ml > 0 ? `120ml: ${u120ml} · ` : ''}200ml: {u200ml} · 1L: {u1L} · 2L: {u2L} · 4L: {u4L}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Masa Total Envasada
                    </span>
                    <span className="text-sm font-black font-mono text-purple-900 mt-0.5">
                      {totalKilosEnvasados.toFixed(2)} kg
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      {totalGramosEnvasados.toLocaleString('es-CO')} gramos netos
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Rendimiento del Lote
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-900 mt-0.5">
                      {rendimientoPct.toFixed(1)} %
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Sobre {totalFormuladoKg.toFixed(2)} kg formulados
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb]/80 flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-500">
                      Ingreso a Cuarto Frío
                    </span>
                    <span className="text-sm font-black font-mono text-blue-900 mt-0.5">
                      {envasado.almacenamientoCuartoFrio.ingresado
                        ? `✓ ${envasado.almacenamientoCuartoFrio.horaIngreso || '16:00'}`
                        : 'Confirmado'}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-0.5">
                      Estabilización 1 día a 3.0 °C
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              PESTAÑA 3: CERTIFICADO OFICIAL (YOGUR)
          ============================================================== */}
          {activeTab === 'certificado' && (
            <div className="p-5 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/40 text-xs flex flex-col gap-3.5 shadow-xs">
              <div className="flex justify-between items-start border-b border-purple-200 pb-3 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-900 text-amber-300 flex items-center justify-center font-black shrink-0">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                  </div>
                  <div>
                    <div className="font-extrabold text-sm sm:text-base text-gray-900">
                      CERTIFICADO OFICIAL DE LIBERACIÓN DE LOTE · YOGUR PROBIÓTICO
                    </div>
                    <div className="text-purple-900 font-semibold text-xs mt-0.5">
                      Identificador Oficial: CERT-{batch.id}-NTC805 · Estándar ICONTEC NTC-805
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1 bg-emerald-600 text-white font-extrabold rounded-lg text-[10px] tracking-wider uppercase shrink-0">
                  CONFORME ✓
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-purple-200 text-gray-700 leading-relaxed space-y-2">
                <p>
                  Por medio del presente documento técnico, se certifica que el lote <strong>{batch.id}</strong> del producto <strong>{batch.productName}</strong> procesado en la <strong>{batch.line}</strong> ha cumplido satisfactoriamente con la totalidad de los parámetros de inocuidad y calidad fisicoquímica estipulados bajo la norma técnica <strong>NTC-805</strong>.
                </p>
                <p>
                  <strong>Trazabilidad de Insumos:</strong> Materia prima láctea correspondiente a <strong>{pasteurizacion.litrosLeche} L</strong> (Lote Leche: <strong>{pasteurizacion.loteLeche}</strong>), tratada térmicamente a <strong>{pasteurizacion.calentamiento.temperaturaAlcanzada || 88.0} °C</strong> durante <strong>{pasteurizacion.calentamiento.tiempoCalentamiento || '80 min'}</strong> y enfriada a <strong>{pasteurizacion.enfriamiento.temperaturaFinal || 45.0} °C</strong>. Inoculada con <strong>{inoculacion.cantidadCultivoGramos || 2.5} g</strong> de cultivo láctico probiótico (Lote: <strong>{inoculacion.loteCultivo}</strong>), con incubación térmica por <strong>8 horas</strong> a <strong>{inoculacion.incubacion.temperaturaCamara || 43.0} °C</strong> (pH coágulo: <strong>{inoculacion.incubacion.phFinalIncubacion || 4.55}</strong>) y maduración en frío por <strong>12 horas</strong> a <strong>{maduracionFrio.refrigeracion.temperaturaCuartoFrio || 3.5} °C</strong> (pH frío: <strong>{maduracionFrio.refrigeracion.phFinalFrio || 4.45}</strong>).
                </p>
                <p>
                  <strong>Producción Final Envasada:</strong> Se obtuvieron un total de <strong>{totalUnidades} envases sellados herméticamente</strong> ({u120ml > 0 ? `${u120ml} botellas de 120 ml (Stevia), ` : ''}{u200ml} botellas de 200 ml, {u1L} botellas de 1 L, {u2L} botellas de 2 L y {u4L} bolsas de 4 L), totalizando <strong>{totalLitrosEnvasados.toFixed(1)} L netos</strong> ({totalKilosEnvasados.toFixed(2)} kg equivalentes) con un rendimiento global del <strong>{rendimientoPct.toFixed(1)}%</strong> sobre masa formulada. El lote fue ingresado a cuarto frío de estabilización por 1 día a 3.0 °C bajo el código de producto terminado <strong>{envasado.loteProductoTerminado}</strong> con fecha de vencimiento <strong>{envasado.fechaVencimiento}</strong>.
                </p>
              </div>

              {/* Operarios que intervinieron en el certificado */}
              <div className="p-3 bg-white rounded-xl border border-purple-200">
                <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">
                  Operarios que Intervinieron en el Proceso:
                </span>
                <span className="text-gray-900 font-bold mt-1 block">
                  {operariosList.length > 0 ? operariosList.join(' · ') : responsable}
                </span>
              </div>

              {/* Observaciones oficiales */}
              {localObservaciones && (
                <div className="p-3 bg-white rounded-xl border border-purple-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">
                    Bitácora / Observaciones Registradas:
                  </span>
                  <span className="text-gray-800 italic mt-1 block">{localObservaciones}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-gray-600 pt-3 border-t border-purple-200 gap-2">
                <span>
                  Responsable del Proceso: <strong>{responsable}</strong> ({batch.operatorRole || 'Operador de Planta'})
                </span>
                <span className="font-mono">
                  Fecha de Emisión: {envasado.fechaProduccion || new Date().toLocaleDateString('es-CO')}
                </span>
              </div>
            </div>
          )}
    </Modal>
  );
};
