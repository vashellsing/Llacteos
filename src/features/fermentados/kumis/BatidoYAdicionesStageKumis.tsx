import React, { useEffect, useState } from 'react';
import { BatidoYAdicionesKumisState } from '../../../types/kumis';
import { ProcessTimerState } from '../../../types';
import { formatHumanDuration, getCurrentTimeString } from '../../../utils/timer';
import { useStageCountdown } from '../../../hooks/useStageCountdown';
import {
  StageHeader,
  Card,
  InputField,
  ConfirmButton,
  TimerBanner,
  Button,
} from '../../../components/ui';

interface BatidoYAdicionesStageKumisProps {
  state: BatidoYAdicionesKumisState;
  onChange: (
    updater: (prev: BatidoYAdicionesKumisState) => BatidoYAdicionesKumisState
  ) => void;
  litrosLecheBase?: number;
  processTimer: ProcessTimerState;
  onNextStage: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const BatidoYAdicionesStageKumis: React.FC<BatidoYAdicionesStageKumisProps> = ({
  state,
  onChange,
  litrosLecheBase = 100,
  onNextStage,
  showToast,
}) => {
  const [batidoStartTimestamp, setBatidoStartTimestamp] = useState<number | null>(null);

  const batidoTimer = useStageCountdown({
    isRunning: state.batidora.iniciado && !state.batidora.completado,
    isCompleted: state.batidora.completado,
    startTimestamp: batidoStartTimestamp,
    targetMinutes: 12,
    completedDurationText: state.batidora.tiempoBatido,
  });

  useEffect(() => {
    const varAzucar = state.adiciones.variedadAzucar;
    if (!varAzucar || varAzucar.kilosAzucar === undefined) {
      const azucarCalc = Number(((litrosLecheBase / 40) * 3.2).toFixed(2));
      onChange((p) => ({
        ...p,
        adiciones: {
          ...p.adiciones,
          variedadAzucar: {
            litrosBase: litrosLecheBase,
            kilosAzucar: azucarCalc,
            gramosAzucar: azucarCalc * 1000,
            loteAzucar: p.adiciones.variedadAzucar?.loteAzucar || 'AZ-KUM-2026',
          },
        },
      }));
    }
  }, [litrosLecheBase, onChange, state.adiciones.variedadAzucar]);

  const handleStartBatidora = () => {
    const timeStr = getCurrentTimeString();
    setBatidoStartTimestamp(Date.now());
    onChange((prev) => ({
      ...prev,
      batidora: {
        ...prev.batidora,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
      },
    }));
    showToast(
      `✓ Batidora de Kumis encendida a las ${timeStr} (${state.batidora.velocidadRpm} RPM).`,
      'info'
    );
  };

  const handleConfirmFinBatido = () => {
    const timeStr = getCurrentTimeString();
    const durStr = formatHumanDuration(batidoTimer.elapsedSeconds || 12 * 60);

    onChange((prev) => ({
      ...prev,
      batidora: {
        ...prev.batidora,
        completado: true,
        horaFin: timeStr,
        tiempoBatido: durStr,
      },
      preparacionTolva: {
        ...prev.preparacionTolva,
        completado: true,
        horaPreparacion: timeStr,
      },
    }));

    showToast(
      `✓ Batido de Kumis terminado a las ${timeStr} (${durStr}). Listo en tolva para envasar.`,
      'success'
    );
  };

  const variedadAzucar = state.adiciones.variedadAzucar || {
    litrosBase: litrosLecheBase,
    gramosAzucar: Number(((litrosLecheBase / 40) * 3200).toFixed(0)),
    kilosAzucar: Number(((litrosLecheBase / 40) * 3.2).toFixed(2)),
    loteAzucar: 'AZ-KUM-2026',
  };

  const pesoAzucarKg =
    variedadAzucar.kilosAzucar ??
    Number(((variedadAzucar.litrosBase / 40) * 3.2).toFixed(2));

  const handleConfirmFormulacion = () => {
    const timeStr = getCurrentTimeString();
    onChange((prev) => ({
      ...prev,
      adiciones: {
        ...prev.adiciones,
        registrado: true,
        horaRegistro: timeStr,
        variedadAzucar: {
          ...variedadAzucar,
          kilosAzucar: pesoAzucarKg,
        },
      },
    }));

    showToast(
      `✓ Receta de Kumis con azúcar (${pesoAzucarKg} kg) guardada a las ${timeStr}.`,
      'success'
    );
  };

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      <StageHeader
        stageNumber={4}
        totalStages={5}
        lineName="Línea de Fermentados · Kumis"
        title="4. Batido y Ajuste de Dulzor (Kumis)"
        subtitle="Bate suave el Kumis frío para darle su textura cremosa y verifica la receta con azúcar (3.2 kg por cada 40 L)."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'blender',
            label: 'Base de Kumis',
            value: `${variedadAzucar.litrosBase} L`,
            tone: 'emerald',
          },
          {
            icon: 'scale',
            label: 'Azúcar del Lote',
            value: `${pesoAzucarKg.toFixed(2)} kg`,
            tone: 'amber',
          },
        ]}
      />

      {/* PASO 01: BATIDO */}
      <Card
        stepBadge="Paso 01"
        title="Batido Suave del Kumis (30 - 35 RPM)"
        subtitle="Bate durante 10 a 12 minutos a baja velocidad hasta que el Kumis quede fluido, sedoso y sin grumos."
        icon="cyclone"
        tone={
          state.batidora.completado
            ? 'completed'
            : state.batidora.iniciado
              ? 'active'
              : 'default'
        }
        statusBadge={
          state.batidora.completado
            ? { label: `Batido Listo (${state.batidora.horaFin})`, variant: 'success' }
            : state.batidora.iniciado
              ? { label: 'Batidora en Marcha', variant: 'warning', pulse: true }
              : { label: 'Pendiente', variant: 'neutral' }
        }
        headerAction={
          !state.batidora.iniciado ? (
            <Button
              variant="primary"
              icon="play_circle"
              onClick={handleStartBatidora}
            >
              Encender Batidora de Kumis
            </Button>
          ) : (
            <ConfirmButton
              confirmed={state.batidora.completado}
              confirmedLabel={`✓ Batido Listo (${state.batidora.horaFin})`}
              unconfirmedLabel="Confirmar: Ya Quedó Sedoso · Tolva Lista"
              onConfirm={handleConfirmFinBatido}
            />
          )
        }
      >
        {(state.batidora.iniciado || state.batidora.completado) && (
          <TimerBanner
            label="Tiempo de Batido del Kumis"
            sublabel="Tiempo sugerido: 10 a 12 minutos a 32 RPM"
            formattedTime={batidoTimer.formattedElapsed}
            targetLabel="12 min"
            progressPercent={batidoTimer.progressPercent}
            isRunning={state.batidora.iniciado && !state.batidora.completado}
            isCompleted={state.batidora.completado}
            isOvertime={batidoTimer.isOvertime}
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Velocidad de Batido"
            type="number"
            min="10"
            max="60"
            unit="RPM"
            value={state.batidora.velocidadRpm}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 32;
              onChange((p) => ({
                ...p,
                batidora: { ...p.batidora, velocidadRpm: val },
              }));
            }}
            hint="Recomendado para Kumis: 30 a 35 RPM"
          />

          <InputField
            label="Temperatura en Tolva"
            type="number"
            step="0.5"
            unit="°C"
            value={state.preparacionTolva.temperaturaMezcla}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 6.5;
              onChange((p) => ({
                ...p,
                preparacionTolva: {
                  ...p.preparacionTolva,
                  temperaturaMezcla: val,
                },
              }));
            }}
            hint="Rango frío ideal: 6.0 °C a 7.5 °C"
          />

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Tiempo y Horario de Batido
            </span>
            <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
              {state.batidora.tiempoBatido ||
                (state.batidora.iniciado ? batidoTimer.formattedElapsed : '--')}
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Inicio: {state.batidora.horaInicio || '--:--'} · Fin:{' '}
              {state.batidora.horaFin || '--:--'}
            </span>
          </div>
        </div>
      </Card>

      {/* PASO 02: RECETA TRADICIONAL DE KUMIS (SIEMPRE CON AZÚCAR) */}
      <Card
        stepBadge="Paso 02"
        title="Receta Tradicional del Kumis (Siempre Con Azúcar)"
        subtitle="Confirma los litros de Kumis y la cantidad de azúcar del lote (3.2 kg por cada 40 L, sin saborizantes ni colorantes)."
        icon="cookie"
        tone={state.adiciones.registrado ? 'completed' : 'default'}
        statusBadge={
          state.adiciones.registrado
            ? { label: `Guardado (${state.adiciones.horaRegistro})`, variant: 'success' }
            : { label: 'Por confirmar', variant: 'info' }
        }
        headerAction={
          <ConfirmButton
            confirmed={state.adiciones.registrado}
            confirmedLabel={`✓ Receta Confirmada (${state.adiciones.horaRegistro})`}
            unconfirmedLabel="Confirmar Receta de Kumis"
            icon="save"
            onConfirm={handleConfirmFormulacion}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Litros Base de Kumis"
            type="number"
            min="0"
            step="1"
            unit="L"
            value={variedadAzucar.litrosBase}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              const azucarCalc = Number(((val / 40) * 3.2).toFixed(2));
              onChange((p) => ({
                ...p,
                adiciones: {
                  ...p.adiciones,
                  variedadAzucar: {
                    ...variedadAzucar,
                    litrosBase: val,
                    kilosAzucar: azucarCalc,
                    gramosAzucar: azucarCalc * 1000,
                  },
                },
              }));
            }}
            hint="Litros de leche destinados a Kumis"
          />

          <InputField
            label="Azúcar del Lote (3.2 kg / 40 L)"
            type="number"
            step="0.1"
            min="0"
            unit="kg"
            value={pesoAzucarKg}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              onChange((p) => ({
                ...p,
                adiciones: {
                  ...p.adiciones,
                  variedadAzucar: {
                    ...variedadAzucar,
                    kilosAzucar: val,
                    gramosAzucar: val * 1000,
                  },
                },
              }));
            }}
            hint="Calculado automático y editable"
          />

          <InputField
            label="Lote de Azúcar"
            type="text"
            value={variedadAzucar.loteAzucar}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              onChange((p) => ({
                ...p,
                adiciones: {
                  ...p.adiciones,
                  variedadAzucar: {
                    ...variedadAzucar,
                    loteAzucar: val,
                  },
                },
              }));
            }}
            placeholder="AZ-KUM-2026"
            hint="Código de trazabilidad del azúcar"
          />
        </div>
      </Card>

      {/* AVANZAR A ETAPA 5 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#434655]">
          Cuando el Kumis esté listo en la tolva, pasa a{' '}
          <strong className="text-[#1e1b18]">5. Envasado y Rendimiento (Kumis)</strong>.
        </div>
        <Button
          variant="primary"
          size="lg"
          iconRight="arrow_forward"
          onClick={onNextStage}
          className="w-full sm:w-auto"
        >
          Ir a 5. Envasado y Rendimiento
        </Button>
      </div>
    </div>
  );
};
