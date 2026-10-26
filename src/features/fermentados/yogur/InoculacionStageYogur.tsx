import React, { useEffect } from 'react';
import { InoculacionYogurState } from '../../../types/yogur';
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

interface InoculacionStageYogurProps {
  state: InoculacionYogurState;
  onChange: (updater: (prev: InoculacionYogurState) => InoculacionYogurState) => void;
  tempLlegada45?: number;
  horaLlegada45?: string | null;
  litrosLecheBase?: number;
  processTimer: ProcessTimerState;
  onNextStage?: () => void;
  onFinalizeProcess?: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const InoculacionStageYogur: React.FC<InoculacionStageYogurProps> = ({
  state,
  onChange,
  horaLlegada45,
  litrosLecheBase = 100,
  processTimer,
  onNextStage,
  showToast,
}) => {
  // Auto-iniciar el reloj de incubación al entrar a la etapa
  useEffect(() => {
    if (!state.incubacion.iniciada && !state.incubacion.completada) {
      const now = Date.now();
      const startTime = getCurrentTimeString();
      onChange((prev) => ({
        ...prev,
        incubacion: {
          ...prev.incubacion,
          iniciada: true,
          horaInicio: prev.incubacion.horaInicio || startTime,
          timestampInicio:
            prev.incubacion.timestampInicio || processTimer.startTimestamp || now,
          duracionObjetivoHoras: 8,
        },
      }));
    }
  }, [
    state.incubacion.iniciada,
    state.incubacion.completada,
    processTimer.startTimestamp,
    onChange,
  ]);

  // Hook de tiempo para la incubación (8 horas = 480 min)
  const incubacionTimer = useStageCountdown({
    isRunning: state.incubacion.iniciada && !state.incubacion.completada,
    isCompleted: state.incubacion.completada,
    startTimestamp: state.incubacion.timestampInicio || processTimer.startTimestamp,
    targetMinutes: (state.incubacion.duracionObjetivoHoras || 8) * 60,
    completedDurationText: state.incubacion.tiempoTranscurrido,
  });

  // Dosis de cultivo sugerida: 1 cucharada por cada 40 L
  useEffect(() => {
    if (
      state.cantidadCultivoCucharadas === undefined ||
      state.cantidadCultivoCucharadas === 0
    ) {
      const calculadas = Number((litrosLecheBase / 40).toFixed(2));
      onChange((p) => ({
        ...p,
        cantidadCultivoCucharadas: calculadas > 0 ? calculadas : 2.5,
      }));
    }
  }, [litrosLecheBase, state.cantidadCultivoCucharadas, onChange]);

  const handleConfirmInoculacionYMezclado = () => {
    const timeStr = getCurrentTimeString();
    onChange((prev) => ({
      ...prev,
      temperaturaConfirmada: true,
      mezcladoConfirmado: true,
      inoculacionConfirmada: true,
      horaInoculacion: timeStr,
    }));
    showToast(
      `✓ Cultivo agregado y mezclado (${state.cantidadCultivoCucharadas ?? 2.5} cucharadas · Lote ${state.loteCultivo}) a las ${timeStr}.`,
      'success'
    );
  };

  // Paso a Etapa 3 (Cuarto Frío) sin cerrar prematuramente el lote
  const handleConfirmProductoEntroCuartoFrio = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const start = state.incubacion.timestampInicio || processTimer.startTimestamp || now;
    const elapsedSec = Math.max(1, Math.floor((now - start) / 1000));
    const durStr = formatHumanDuration(elapsedSec);

    onChange((prev) => ({
      ...prev,
      incubacion: {
        ...prev.incubacion,
        completada: true,
        productoEntroCuartoFrio: true,
        horaEntradaCuartoFrio: timeStr,
        horaFin: timeStr,
        tiempoTranscurrido: durStr,
      },
    }));

    showToast(
      `✓ Incubación lista a las ${timeStr} (${durStr}). Las cantinas pasan a 3. Cuarto Frío.`,
      'success'
    );
  };

  const isInoculado = state.inoculacionConfirmada || state.mezcladoConfirmado;
  const isIncubacionCompletada =
    state.incubacion.completada || state.incubacion.productoEntroCuartoFrio;

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      <StageHeader
        stageNumber={2}
        totalStages={5}
        lineName="Línea de Fermentados · Yogur"
        title="2. Inoculación e Incubación"
        subtitle="Ponle el cultivo a la leche a 45 °C, revuelve suave durante 5 minutos y deja reposar el lote hasta que cuaje parejo."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'thermostat',
            label: 'Temp. de Siembra',
            value: '45.0 °C',
            tone: 'emerald',
          },
          {
            icon: 'timer',
            label: 'Tiempo Incubando',
            value: incubacionTimer.formattedElapsed,
            tone: isIncubacionCompletada ? 'emerald' : 'amber',
          },
        ]}
      />

      {/* PASO 01: VERIFICACIÓN DE TEMPERATURA */}
      <Card
        stepBadge="Paso 01"
        title="Temperatura de la Leche antes de Sembrar"
        subtitle={
          horaLlegada45
            ? `La leche llegó a 45.0 °C a las ${horaLlegada45}. Verifica que esté tibiecita antes de poner el cultivo.`
            : 'Referencia de planta: la leche debe estar alrededor de 45.0 °C para que el cultivo trabaje bien.'
        }
        icon="device_thermostat"
        tone="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb]">
            <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
              Temperatura Ideal
            </span>
            <div className="text-2xl font-black text-[#1e1b18] font-mono mt-1">
              45.0 °C
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Punto exacto para el cultivo de yogur
            </span>
          </div>

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb]">
            <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
              Estado de la Leche
            </span>
            <div className="text-base font-black text-emerald-800 mt-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                check_circle
              </span>
              <span>Lista para agregar cultivo</span>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              En cantinas limpias de fermentación
            </span>
          </div>

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb]">
            <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
              Leche en este Lote
            </span>
            <div className="text-xl font-black text-[#1e1b18] font-mono mt-1">
              {litrosLecheBase} L
            </div>
            <span className="text-[11px] text-amber-800 font-semibold mt-1 block">
              Medida de planta: 1 cucharada por cada 40 L
            </span>
          </div>
        </div>
      </Card>

      {/* PASO 02: SIEMBRA Y MEZCLA DEL CULTIVO */}
      <Card
        stepBadge="Paso 02"
        title="Agregar el Cultivo y Revolver"
        subtitle="Pon las cucharadas de cultivo correspondientes y revuelve parejo durante 5 minutos para que quede bien repartido."
        icon="biotech"
        tone={isInoculado ? 'completed' : 'active'}
        statusBadge={
          isInoculado
            ? { label: `Sembrado (${state.horaInoculacion})`, variant: 'success' }
            : { label: 'Por registrar', variant: 'info' }
        }
        headerAction={
          <ConfirmButton
            confirmed={isInoculado}
            confirmedLabel={`✓ Cultivo Agregado (${state.horaInoculacion || 'Listo'})`}
            unconfirmedLabel="Confirmar: Ya Puse el Cultivo y Mezclé"
            onConfirm={handleConfirmInoculacionYMezclado}
          />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Lote del Cultivo Láctico"
            type="text"
            value={state.loteCultivo}
            onChange={(e) => {
              const val = e.target.value;
              onChange((p) => ({ ...p, loteCultivo: val }));
            }}
            placeholder="Ej: CULT-PROB-2026-04"
            hint="Anota el código del sobre de cultivo"
          />

          <InputField
            label="Cucharadas de Cultivo"
            type="number"
            step="0.1"
            min="0.1"
            unit="cucharadas"
            value={
              state.cantidadCultivoCucharadas ??
              Number((litrosLecheBase / 40).toFixed(2))
            }
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              onChange((p) => ({
                ...p,
                cantidadCultivoCucharadas: val,
                cantidadCultivoGramos: val,
              }));
            }}
            hint="Calculado a 1 cucharada por cada 40 L"
          />

          <InputField
            label="Tiempo Revolviendo"
            type="number"
            min="1"
            unit="min"
            value={state.tiempoMezcladoMinutos}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 5;
              onChange((p) => ({ ...p, tiempoMezcladoMinutos: val }));
            }}
            hint={`Hora de siembra: ${state.horaInoculacion || '--:--'}`}
          />
        </div>
      </Card>

      {/* PASO 03: INCUBACIÓN Y REPOSO */}
      <Card
        stepBadge="Paso 03"
        title="Reposo e Incubación (Mínimo 8 Horas)"
        subtitle="Deja las cantinas abrigadas entre 42 °C y 45 °C hasta que el yogur cuaje firme. Cuando esté listo, pásalo al cuarto frío."
        icon="hourglass_top"
        tone={isIncubacionCompletada ? 'completed' : 'active'}
        statusBadge={
          isIncubacionCompletada
            ? { label: 'Incubación Lista ✓', variant: 'success' }
            : { label: 'Incubando...', variant: 'warning', pulse: true }
        }
        headerAction={
          <ConfirmButton
            confirmed={isIncubacionCompletada}
            confirmedLabel={`✓ Pasó a Cuarto Frío (${state.incubacion.horaEntradaCuartoFrio || state.incubacion.horaFin})`}
            unconfirmedLabel="Confirmar: Ya Cuajó · Pasar a Cuarto Frío"
            icon="ac_unit"
            onConfirm={handleConfirmProductoEntroCuartoFrio}
          />
        }
      >
        <TimerBanner
          label="Tiempo de Incubación Acumulado"
          sublabel="Meta recomendada: 8 horas de reposo a 42 - 45 °C"
          formattedTime={incubacionTimer.formattedElapsed}
          targetLabel="8 Horas"
          progressPercent={incubacionTimer.progressPercent}
          isRunning={!isIncubacionCompletada}
          isCompleted={isIncubacionCompletada}
          isOvertime={incubacionTimer.isOvertime}
          className="mb-4"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Temperatura de Abrigo / Cámara"
            type="number"
            step="0.5"
            unit="°C"
            value={state.incubacion.temperaturaCamara}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 43.0;
              onChange((p) => ({
                ...p,
                incubacion: { ...p.incubacion, temperaturaCamara: val },
              }));
            }}
            hint="Rango ideal: 42.0 °C a 45.0 °C"
          />

          <InputField
            label="pH al Terminar de Cuajar"
            type="number"
            step="0.05"
            unit="pH"
            value={state.incubacion.phFinalIncubacion}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 4.55;
              onChange((p) => ({
                ...p,
                incubacion: { ...p.incubacion, phFinalIncubacion: val },
              }));
            }}
            hint="Punto ideal NTC-805: 4.50 a 4.60"
          />

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Horarios de Incubación
            </span>
            <div className="mt-1.5 text-xs text-[#434655] space-y-1">
              <div>
                Inicio:{' '}
                <strong className="font-mono text-[#1e1b18]">
                  {state.incubacion.horaInicio || '--:--'}
                </strong>
              </div>
              <div>
                Paso a frío:{' '}
                <strong className="font-mono text-emerald-800">
                  {state.incubacion.horaEntradaCuartoFrio ||
                    state.incubacion.horaFin ||
                    'En reposo'}
                </strong>
              </div>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Cuajada firme y pareja sin soltar suero
            </span>
          </div>
        </div>
      </Card>

      {/* AVANZAR A ETAPA 3 (CUARTO FRÍO) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#434655]">
          Cuando el yogur esté bien cuajado y lleves las cantinas a enfriar, pasa a{' '}
          <strong className="text-[#1e1b18]">3. Cuarto Frío (Maduración)</strong>.
        </div>
        {onNextStage && (
          <Button
            variant="primary"
            size="lg"
            iconRight="arrow_forward"
            onClick={onNextStage}
            className="w-full sm:w-auto"
          >
            Ir a 3. Cuarto Frío (Maduración)
          </Button>
        )}
      </div>
    </div>
  );
};
