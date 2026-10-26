import React, { useState } from 'react';
import {
  ParentMilkBatch,
  SplitMilkAllocationInput,
  SubBatchTabInfo,
} from '../../types';
import { Button, InputField } from '../ui';

export interface SubBatchSwitcherBarProps {
  tabs: SubBatchTabInfo[];
  activeProductId: string;
  onSelectSubBatch: (productId: string) => void;
  isFermentacionLine: boolean;
  parentBatch: ParentMilkBatch;
  onSplitParentBatch: (input: SplitMilkAllocationInput) => void;
}

export const SubBatchSwitcherBar: React.FC<SubBatchSwitcherBarProps> = ({
  tabs,
  activeProductId,
  onSelectSubBatch,
  isFermentacionLine,
  parentBatch,
  onSplitParentBatch,
}) => {
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);

  const defaultYogurLiters =
    tabs.find((t) => t.productId === 'prod-yogur')?.allocatedLiters ?? 120;
  const defaultKumisLiters =
    tabs.find((t) => t.productId === 'prod-kumis')?.allocatedLiters ?? 30;
  const defaultGriegoLiters =
    tabs.find((t) => t.productId === 'prod-yogur-griego')?.allocatedLiters ??
    100;

  const [totalLitersInput, setTotalLitersInput] = useState<number>(
    parentBatch.totalMilkLiters
  );
  const [yogurDulceInput, setYogurDulceInput] =
    useState<number>(defaultYogurLiters);
  const [kumisInput, setKumisInput] = useState<number>(defaultKumisLiters);
  const [griegoInput, setGriegoInput] = useState<number>(defaultGriegoLiters);
  const [loteLecheInput, setLoteLecheInput] = useState<string>(
    parentBatch.loteLecheProveedor
  );

  const sumAllocated =
    (Number(yogurDulceInput) || 0) +
    (Number(kumisInput) || 0) +
    (Number(griegoInput) || 0);
  const remainingFromTotal = Math.max(
    0,
    (Number(totalLitersInput) || 0) - sumAllocated
  );

  const handleConfirmSplit = () => {
    onSplitParentBatch({
      totalParentLiters: Math.max(Number(totalLitersInput) || 0, sumAllocated),
      litrosYogurConAzucar: Number(yogurDulceInput) || 0,
      litrosKumis: Number(kumisInput) || 0,
      litrosYogurGriego: Number(griegoInput) || 0,
      loteLeche: loteLecheInput,
    });
    setSplitPanelOpen(false);
  };

  return (
    <div className="bg-[#f4efe6] border-b border-[#e6decb] px-4 lg:px-6 py-3 flex flex-col gap-3">
      {/* Fila superior: Resumen de Lote Padre (en Fermentados) + Pestañas de Sub-Lotes con Relojes en Vivo */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Pestañas de Sub-Lotes Activos */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#737686] shrink-0 mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#004ac6]">
              call_split
            </span>
            {isFermentacionLine ? 'Sub-Lotes Activos:' : 'Lotes de Queso:'}
          </span>

          {tabs.map((tab) => {
            const isActive = tab.productId === activeProductId;
            const isRunning = tab.timer.isRunning && !tab.timer.isCompleted;
            const isDone =
              tab.status === 'COMPLETADO' || tab.timer.isCompleted;

            return (
              <button
                key={tab.productId}
                type="button"
                onClick={() => onSelectSubBatch(tab.productId)}
                className={`group flex items-center gap-3 px-3.5 py-2 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white border-2 border-[#004ac6] shadow-sm ring-2 ring-[#004ac6]/10'
                    : 'bg-[#fcfaf7] hover:bg-white border-[#e6decb] opacity-85 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-[#004ac6] text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-[#f4efe6] text-[#434655]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tab.icon}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-extrabold truncate ${
                        isActive ? 'text-[#004ac6]' : 'text-[#191c1e]'
                      }`}
                    >
                      {tab.shortName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#f4efe6] border border-[#e6decb] text-[10px] font-mono font-bold text-[#434655]">
                      {tab.allocatedLiters} L
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold text-[#737686]">
                      Etapa {tab.currentStageNumber}/5
                    </span>
                    <span className="text-[#d4ccb8]">•</span>
                    <span
                      className={`text-[11px] font-mono font-bold flex items-center gap-1 ${
                        isDone
                          ? 'text-emerald-700'
                          : isRunning
                          ? 'text-[#004ac6]'
                          : 'text-[#737686]'
                      }`}
                    >
                      {isRunning && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      )}
                      {isDone ? '✓ Listo' : tab.timer.formattedTime}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Resumen del Lote Padre y Botón para Dividir Leche (Línea de Fermentación) */}
        {isFermentacionLine && (
          <div className="flex flex-wrap items-center justify-between xl:justify-end gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-[#e6decb]">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#004ac6] font-mono font-bold border border-blue-200">
                Lote Padre: {parentBatch.codigoLotePadre}
              </span>
              <span className="text-[#434655] font-semibold">
                Total:{' '}
                <strong className="font-mono text-[#191c1e]">
                  {parentBatch.totalMilkLiters} L
                </strong>
              </span>
              <span className="text-[#d4ccb8]">|</span>
              <span className="text-emerald-800 font-semibold">
                Repartidos:{' '}
                <strong className="font-mono">
                  {parentBatch.allocatedLiters} L
                </strong>
              </span>
              {parentBatch.remainingLiters > 0 && (
                <>
                  <span className="text-[#d4ccb8]">|</span>
                  <span className="text-amber-800 font-semibold">
                    Sin asignar:{' '}
                    <strong className="font-mono">
                      {parentBatch.remainingLiters} L
                    </strong>
                  </span>
                </>
              )}
            </div>

            <Button
              variant={splitPanelOpen ? 'secondary' : 'outline'}
              size="sm"
              icon={splitPanelOpen ? 'expand_less' : 'call_split'}
              onClick={() => setSplitPanelOpen((prev) => !prev)}
            >
              {splitPanelOpen ? 'Cerrar División' : 'Repartir Leche del Lote Padre'}
            </Button>
          </div>
        )}
      </div>

      {/* Panel Desplegable para Dividir el Lote Padre en Lotes Hijos */}
      {isFermentacionLine && splitPanelOpen && (
        <div className="bg-white rounded-2xl border-2 border-[#004ac6]/30 p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e6decb]">
            <div>
              <h4 className="text-sm font-extrabold text-[#191c1e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004ac6] text-[20px]">
                  call_split
                </span>
                Dividir Lote Padre en Lotes Hijos (Producción Divergente)
              </h4>
              <p className="text-xs text-[#5f6374] mt-0.5">
                Reparte los litros de leche del Lote Padre entre Yogur, Kumis y Yogur Griego. Cada sub-lote quedará con sus litros y su reloj independiente.
              </p>
            </div>
            <div className="text-right font-mono text-xs bg-[#fcfaf7] px-3 py-1.5 rounded-xl border border-[#e6decb]">
              <span className="text-[#737686]">Suma asignada: </span>
              <strong className="text-[#004ac6]">{sumAllocated} L</strong>
              {remainingFromTotal > 0 && (
                <span className="text-amber-700 ml-2">
                  (Restan {remainingFromTotal} L)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <InputField
              label="Leche Total Lote Padre"
              type="number"
              unit="L"
              inputSize="sm"
              value={totalLitersInput}
              onChange={(e) => setTotalLitersInput(Number(e.target.value))}
            />

            <InputField
              label="Lote Leche Proveedor"
              type="text"
              inputSize="sm"
              value={loteLecheInput}
              onChange={(e) => setLoteLecheInput(e.target.value)}
            />

            <InputField
              label="Para Yogur (Hijo 1)"
              type="number"
              unit="L"
              inputSize="sm"
              targetHint="42–45 °C"
              value={yogurDulceInput}
              onChange={(e) => setYogurDulceInput(Number(e.target.value))}
            />

            <InputField
              label="Para Kumis (Hijo 2)"
              type="number"
              unit="L"
              inputSize="sm"
              targetHint="30–35 °C"
              value={kumisInput}
              onChange={(e) => setKumisInput(Number(e.target.value))}
            />

            <InputField
              label="Para Griego (Hijo 3)"
              type="number"
              unit="L"
              inputSize="sm"
              targetHint="Sin azúcar"
              value={griegoInput}
              onChange={(e) => setGriegoInput(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSplitPanelOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              size="md"
              icon="check_circle"
              onClick={handleConfirmSplit}
            >
              Confirmar División y Actualizar Sub-Lotes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
