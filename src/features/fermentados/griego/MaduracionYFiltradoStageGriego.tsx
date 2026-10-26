import React, { useEffect } from 'react';
import { MaduracionYFiltradoYogurGriegoState } from '../../../types/yogur_griego';
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

interface MaduracionYFiltradoStageGriegoProps {
  state: MaduracionYFiltradoYogurGriegoState;
  onChange: (
    updater: (
      prev: MaduracionYFiltradoYogurGriegoState
    ) => MaduracionYFiltradoYogurGriegoState
  ) => void;
  litrosLecheBase?: number;
  processTimer: ProcessTimerState;
  onNextStage: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const MaduracionYFiltradoStageGriego: React.FC<
  MaduracionYFiltradoStageGriegoProps
> = ({ state, onChange, litrosLecheBase = 100, onNextStage, showToast }) => {
  const masaEstimada = Number((litrosLecheBase * 0.35).toFixed(1));
  const sueroEstimado = Number((litrosLecheBase * 0.65).toFixed(1));

  // 1. Reloj de Cuarto Frío (24 h = 1440 min)
  const cuartoFrioTimer = useStageCountdown({
    isRunning: state.cuartoFrio.iniciado && !state.cuartoFrio.completado,
    isCompleted: state.cuartoFrio.completado,
    startTimestamp: state.cuartoFrio.timestampInicio,
    targetMinutes: 24 * 60,
    completedDurationText: state.cuartoFrio.tiempoTranscurrido,
  });

  useEffect(() => {
    if (
      state.cuartoFrio.iniciado &&
      !state.cuartoFrio.completado &&
      cuartoFrioTimer.elapsedSeconds >= 86400 &&
      !state.cuartoFrio.cumplio24h
    ) {
      onChange((prev) => ({
        ...prev,
        cuartoFrio: { ...prev.cuartoFrio, cumplio24h: true },
      }));
      showToast(
        '🔔 Ya cumplió 24 horas en cuarto frío. Ya puedes pasar la masa a colar en los lienzos.',
        'info'
      );
    }
  }, [
    state.cuartoFrio.iniciado,
    state.cuartoFrio.completado,
    state.cuartoFrio.cumplio24h,
    cuartoFrioTimer.elapsedSeconds,
    onChange,
    showToast,
  ]);

  // 2. Reloj de Filtrado en Telas (48 h = 2880 min)
  const filtradoTimer = useStageCountdown({
    isRunning: state.filtradoTelas.iniciado && !state.filtradoTelas.completado,
    isCompleted: state.filtradoTelas.completado,
    startTimestamp: state.filtradoTelas.timestampInicio,
    targetMinutes: 48 * 60,
    completedDurationText: state.filtradoTelas.tiempoTranscurrido,
  });

  const handleEntroCuartoFrio = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();

    onChange((prev) => ({
      ...prev,
      cuartoFrio: {
        ...prev.cuartoFrio,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
        timestampInicio: now,
      },
    }));

    showToast(
      `✓ Cantinas en cuarto frío (0–4 °C) desde las ${timeStr}. Reloj de 24 a 48 horas en marcha.`,
      'success'
    );
  };

  const handleFinalizarCuartoFrio = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const start = state.cuartoFrio.timestampInicio || now;
    const elapsedSec = Math.max(1, Math.floor((now - start) / 1000));
    const durStr = formatHumanDuration(elapsedSec);

    onChange((prev) => ({
      ...prev,
      cuartoFrio: {
        ...prev.cuartoFrio,
        completado: true,
        cumplio24h: true,
        horaFin: timeStr,
        tiempoTranscurrido: durStr,
      },
    }));

    showToast(
      `✓ Frío completado a las ${timeStr} (${durStr}). Ahora pasa la cuajada a escurrir en los lienzos.`,
      'success'
    );
  };

  const handleInicioFiltradoTelas = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();

    onChange((prev) => ({
      ...prev,
      filtradoTelas: {
        ...prev.filtradoTelas,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
        timestampInicio: now,
        masaFiltradaKg: prev.filtradoTelas.masaFiltradaKg || masaEstimada,
        sueroEliminadoEstimadoLitros:
          prev.filtradoTelas.sueroEliminadoEstimadoLitros || sueroEstimado,
      },
    }));

    showToast(
      `✓ Empezó el escurrido en lienzos a las ${timeStr}. Reloj de 48 horas corriendo.`,
      'info'
    );
  };

  const handleFiltradoTerminado = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const start = state.filtradoTelas.timestampInicio || now;
    const elapsedSec = Math.max(1, Math.floor((now - start) / 1000));
    const durStr = formatHumanDuration(elapsedSec);

    onChange((prev) => ({
      ...prev,
      filtradoTelas: {
        ...prev.filtradoTelas,
        completado: true,
        horaFin: timeStr,
        tiempoTranscurrido: durStr,
      },
    }));

    showToast(
      `✓ Escurrido terminado. Masa espesa obtenida: ${
        state.filtradoTelas.masaFiltradaKg || masaEstimada
      } kg. Ya puedes pasar a batir.`,
      'success'
    );
  };

  const isDesbloqueadoBatido = state.filtradoTelas.completado;

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      <StageHeader
        stageNumber={3}
        totalStages={5}
        lineName="Línea de Fermentados · Yogur Griego"
        title="3. Cuarto Frío y Escurrido en Lienzos"
        subtitle="Enfría primero la cuajada entre 24 y 48 horas, y luego escúrrela en canastillas con lienzos por 2 días para sacarle el suero y dejar el Griego espeso."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'water_drop',
            label: 'Leche Base',
            value: `${litrosLecheBase} L`,
            tone: 'amber',
          },
          {
            icon: 'scale',
            label: 'Masa Estimada',
            value: `${state.filtradoTelas.masaFiltradaKg || masaEstimada} kg`,
            tone: 'emerald',
          },
        ]}
      />

      {/* PASO 01: CUARTO FRÍO ANTES DE COLAR */}
      <Card
        stepBadge="Paso 01"
        title="Reposo en Cuarto Frío (24 a 48 Horas a 0–4 °C)"
        subtitle="Deja enfriar las cantinas mínimo 1 día (24 h) y máximo 2 días (48 h) antes de volcarlas en los lienzos."
        icon="ac_unit"
        tone={
          state.cuartoFrio.completado
            ? 'completed'
            : state.cuartoFrio.iniciado
              ? 'active'
              : 'default'
        }
        statusBadge={
          state.cuartoFrio.completado
            ? { label: `Frío Listo (${state.cuartoFrio.horaFin})`, variant: 'success' }
            : state.cuartoFrio.iniciado
              ? { label: 'En Cuarto Frío', variant: 'info', pulse: true }
              : { label: 'Pendiente', variant: 'neutral' }
        }
        headerAction={
          !state.cuartoFrio.iniciado ? (
            <Button
              variant="primary"
              icon="kitchen"
              onClick={handleEntroCuartoFrio}
            >
              Confirmar: Entró al Cuarto Frío (0–4 °C)
            </Button>
          ) : (
            <ConfirmButton
              confirmed={state.cuartoFrio.completado}
              confirmedLabel={`✓ Tiempo en Frío Cumplido (${state.cuartoFrio.horaFin})`}
              unconfirmedLabel="Confirmar: Ya Cumplió el Tiempo en Frío"
              onConfirm={handleFinalizarCuartoFrio}
            />
          )
        }
      >
        {(state.cuartoFrio.iniciado || state.cuartoFrio.completado) && (
          <TimerBanner
            label="Tiempo en Cuarto Frío"
            sublabel="Mínimo 24 horas (1 día), máximo 48 horas (2 días) entre 0 °C y 4 °C"
            formattedTime={cuartoFrioTimer.formattedElapsed}
            targetLabel="24 - 48 h"
            progressPercent={cuartoFrioTimer.progressPercent}
            isRunning={state.cuartoFrio.iniciado && !state.cuartoFrio.completado}
            isCompleted={state.cuartoFrio.completado}
            isOvertime={cuartoFrioTimer.isOvertime}
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Temperatura del Cuarto Frío"
            type="number"
            step="0.5"
            unit="°C"
            value={state.cuartoFrio.temperatura}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange((prev) => ({
                ...prev,
                cuartoFrio: { ...prev.cuartoFrio, temperatura: val },
              }));
            }}
            hint="Rango requerido: 0.0 °C a 4.0 °C"
          />

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
              Tiempo Mínimo / Máximo
            </span>
            <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
              24 h a 48 h
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              El reloj avisa al cumplir 24 horas
            </span>
          </div>

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
              Horarios de Cuarto Frío
            </span>
            <div className="mt-1 text-xs text-[#434655] space-y-1">
              <div>
                Entrada:{' '}
                <strong className="font-mono text-[#1e1b18]">
                  {state.cuartoFrio.horaInicio || '--:--'}
                </strong>
              </div>
              <div>
                Salida:{' '}
                <strong className="font-mono text-emerald-800">
                  {state.cuartoFrio.horaFin || 'En cuarto frío'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* PASO 02: ESCURRIDO EN LIENZOS (48 HORAS) */}
      <Card
        stepBadge="Paso 02"
        title="Filtrado y Escurrido en Lienzos (2 Días / 48 Horas)"
        subtitle="La masa se escurre en canastillas con lienzos dentro del cuarto frío para sacarle el suero y espesar el yogur de forma natural."
        icon="filter_alt"
        tone={
          state.filtradoTelas.completado
            ? 'completed'
            : state.filtradoTelas.iniciado
              ? 'active'
              : 'default'
        }
        statusBadge={
          state.filtradoTelas.completado
            ? { label: 'Escurrido Terminado ✓', variant: 'success' }
            : state.filtradoTelas.iniciado
              ? { label: 'Escurriendo en Lienzos (48 h)', variant: 'warning', pulse: true }
              : { label: 'Pendiente', variant: 'neutral' }
        }
        headerAction={
          !state.filtradoTelas.iniciado ? (
            <Button
              variant="primary"
              icon="play_circle"
              disabled={!state.cuartoFrio.completado}
              onClick={handleInicioFiltradoTelas}
            >
              Iniciar Escurrido en Lienzos (48 h)
            </Button>
          ) : (
            <ConfirmButton
              confirmed={state.filtradoTelas.completado}
              confirmedLabel={`✓ Escurrido Terminado (${state.filtradoTelas.horaFin})`}
              unconfirmedLabel="Confirmar: Ya Escurrió · Pesar Masa"
              onConfirm={handleFiltradoTerminado}
            />
          )
        }
      >
        {(state.filtradoTelas.iniciado || state.filtradoTelas.completado) && (
          <TimerBanner
            label="Tiempo de Escurrido en Lienzos"
            sublabel="Tiempo objetivo: 48 horas (2 días) en canastillas con tela"
            formattedTime={filtradoTimer.formattedElapsed}
            targetLabel="48 Horas"
            progressPercent={filtradoTimer.progressPercent}
            isRunning={state.filtradoTelas.iniciado && !state.filtradoTelas.completado}
            isCompleted={state.filtradoTelas.completado}
            isOvertime={filtradoTimer.isOvertime}
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Masa Espesa Obtenida"
            type="number"
            step="0.1"
            unit="kg"
            value={state.filtradoTelas.masaFiltradaKg || masaEstimada}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange((prev) => ({
                ...prev,
                filtradoTelas: {
                  ...prev.filtradoTelas,
                  masaFiltradaKg: val,
                  esManual: true,
                },
              }));
            }}
            hint={`Estimado (~35%): ${masaEstimada} kg`}
          />

          <InputField
            label="Suero Escurrido Estimado"
            type="number"
            step="0.1"
            unit="L"
            value={
              state.filtradoTelas.sueroEliminadoEstimadoLitros || sueroEstimado
            }
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange((prev) => ({
                ...prev,
                filtradoTelas: {
                  ...prev.filtradoTelas,
                  sueroEliminadoEstimadoLitros: val,
                  esManual: true,
                },
              }));
            }}
            hint={`Estimado (~65%): ${sueroEstimado} L`}
          />

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
              Horarios de Escurrido
            </span>
            <div className="mt-1 text-xs text-[#434655] space-y-1">
              <div>
                Inicio:{' '}
                <strong className="font-mono text-[#1e1b18]">
                  {state.filtradoTelas.horaInicio || '--:--'}
                </strong>
              </div>
              <div>
                Fin:{' '}
                <strong className="font-mono text-emerald-800">
                  {state.filtradoTelas.horaFin || 'Escurriendo'}
                </strong>
              </div>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Sin espesantes ni crema adicionada
            </span>
          </div>
        </div>
      </Card>

      {/* AVANZAR A ETAPA 4 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#434655]">
          Cuando termines de escurrir y peses la masa de Griego, pasa a{' '}
          <strong className="text-[#1e1b18]">4. Batido y Reparto (Sin/Con Stevia)</strong>.
        </div>
        <Button
          variant="primary"
          size="lg"
          iconRight="arrow_forward"
          disabled={!isDesbloqueadoBatido}
          onClick={onNextStage}
          className="w-full sm:w-auto"
        >
          Ir a 4. Batido y Reparto
        </Button>
      </div>
    </div>
  );
};
