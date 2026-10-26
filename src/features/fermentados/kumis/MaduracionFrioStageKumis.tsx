import React from 'react';
import { MaduracionFrioKumisState } from '../../../types/kumis';
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

interface MaduracionFrioStageKumisProps {
  state: MaduracionFrioKumisState;
  onChange: (
    updater: (prev: MaduracionFrioKumisState) => MaduracionFrioKumisState
  ) => void;
  processTimer: ProcessTimerState;
  onNextStage: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const MaduracionFrioStageKumis: React.FC<MaduracionFrioStageKumisProps> = ({
  state,
  onChange,
  onNextStage,
  showToast,
}) => {
  // Reloj de reposo en cuarto frío (12 horas = 720 min)
  const refrigeracionTimer = useStageCountdown({
    isRunning: state.refrigeracion.iniciada && !state.refrigeracion.completada,
    isCompleted: state.refrigeracion.completada,
    startTimestamp: state.refrigeracion.timestampInicio,
    targetMinutes: (state.refrigeracion.duracionObjetivoHoras || 12) * 60,
    completedDurationText: state.refrigeracion.tiempoTranscurrido,
  });

  const handleConfirmTraslado = () => {
    const timeStr = getCurrentTimeString();
    onChange((prev) => ({
      ...prev,
      trasladoCantinas: {
        ...prev.trasladoCantinas,
        iniciado: true,
        completado: true,
        horaInicio: prev.trasladoCantinas.horaInicio || timeStr,
        horaFin: timeStr,
        tiempoTraslado: '10 min',
      },
    }));
    showToast(
      `✓ Cantinas de Kumis acomodadas con cuidado (${state.trasladoCantinas.numeroCantinas} cantinas) a las ${timeStr}.`,
      'success'
    );
  };

  const handleStartRefrigeracion = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    onChange((prev) => ({
      ...prev,
      refrigeracion: {
        ...prev.refrigeracion,
        iniciada: true,
        completada: false,
        horaInicio: timeStr,
        timestampInicio: now,
      },
    }));
    showToast(
      `✓ Entrada de Kumis a cuarto frío registrada a las ${timeStr} (${state.refrigeracion.temperaturaCuartoFrio} °C). Reloj de 12 horas en marcha.`,
      'info'
    );
  };

  const handleConfirmFinRefrigeracion = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const start = state.refrigeracion.timestampInicio || now;
    const elapsedSec = Math.max(1, Math.floor((now - start) / 1000));
    const durStr = formatHumanDuration(elapsedSec);

    onChange((prev) => ({
      ...prev,
      refrigeracion: {
        ...prev.refrigeracion,
        completada: true,
        horaFin: timeStr,
        tiempoTranscurrido: durStr,
      },
    }));

    showToast(
      `✓ Frío de 12 horas de Kumis completado a las ${timeStr} (${durStr}). Listo para batir.`,
      'success'
    );
  };

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      <StageHeader
        stageNumber={3}
        totalStages={5}
        lineName="Línea de Fermentados · Kumis"
        title="3. Cuarto Frío (Maduración del Kumis)"
        subtitle="Acomoda las cantinas en el cuarto frío sin sacudirlas y déjalas enfriar durante 12 horas (2 °C a 4 °C) para que el Kumis coja buen cuerpo."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'kitchen',
            label: 'Temp. Cuarto Frío',
            value: '2.0 - 4.0 °C',
            tone: 'blue',
          },
          {
            icon: 'schedule',
            label: 'Tiempo en Frío',
            value: state.refrigeracion.iniciada
              ? refrigeracionTimer.formattedElapsed
              : '12 Horas',
            tone: state.refrigeracion.completada ? 'emerald' : 'amber',
          },
        ]}
      />

      {/* PASO 01: ACOMODO EN CANTINAS */}
      <Card
        stepBadge="Paso 01"
        title="Acomodo Cuidadoso en Cantinas (10 min)"
        subtitle="Mueve las cantinas despacio sin golpearlas para que la cuajada no suelte suero antes de enfriar."
        icon="swap_horiz"
        tone={state.trasladoCantinas.completado ? 'completed' : 'default'}
        statusBadge={
          state.trasladoCantinas.completado
            ? { label: `Listo (${state.trasladoCantinas.horaFin})`, variant: 'success' }
            : { label: 'Por confirmar', variant: 'neutral' }
        }
        headerAction={
          <ConfirmButton
            confirmed={state.trasladoCantinas.completado}
            confirmedLabel="✓ Cantinas Acomodadas"
            unconfirmedLabel="Confirmar: Ya Acomodé las Cantinas"
            onConfirm={handleConfirmTraslado}
          />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Cantinas Usadas"
            type="number"
            min="1"
            max="15"
            unit="cantinas"
            value={state.trasladoCantinas.numeroCantinas}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 3;
              onChange((prev) => ({
                ...prev,
                trasladoCantinas: {
                  ...prev.trasladoCantinas,
                  numeroCantinas: val,
                },
              }));
            }}
            hint="Capacidad aprox: 35 a 40 L por cantina"
          />

          <div className="p-3.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-[#5d564a] block">
              Hora de Acomodo
            </span>
            <div className="text-xl font-mono font-black text-[#1e1b18] mt-1">
              {state.trasladoCantinas.horaFin || '--:--'}
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Duración estimada: 10 min
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-[#5d564a] block">
              Estado de la Cuajada
            </span>
            <div className="text-sm font-black text-emerald-800 mt-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">
                verified
              </span>
              <span>Pareja y sin cortarse</span>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Manipulación suave sin agitar
            </span>
          </div>
        </div>
      </Card>

      {/* PASO 02: REPOSO EN CUARTO FRÍO (12 HORAS) */}
      <Card
        stepBadge="Paso 02"
        title="Enfriamiento en Cuarto Frío (12 Horas)"
        subtitle="Deja las cantinas entre 2 °C y 4 °C durante 12 horas seguidas antes de pasar a la batidora."
        icon="ac_unit"
        tone={
          state.refrigeracion.completada
            ? 'completed'
            : state.refrigeracion.iniciada
              ? 'active'
              : 'default'
        }
        statusBadge={
          state.refrigeracion.completada
            ? { label: 'Frío de 12 h Completado ✓', variant: 'success' }
            : state.refrigeracion.iniciada
              ? { label: 'Enfriando (12 h)', variant: 'info', pulse: true }
              : { label: 'Pendiente', variant: 'neutral' }
        }
        headerAction={
          !state.refrigeracion.iniciada ? (
            <Button
              variant="primary"
              icon="play_circle"
              onClick={handleStartRefrigeracion}
            >
              Iniciar Reloj de Cuarto Frío (12 h)
            </Button>
          ) : (
            <ConfirmButton
              confirmed={state.refrigeracion.completada}
              confirmedLabel={`✓ Frío Terminado (${state.refrigeracion.horaFin})`}
              unconfirmedLabel="Confirmar: Ya Cumplió las 12 Horas de Frío"
              onConfirm={handleConfirmFinRefrigeracion}
            />
          )
        }
      >
        {(state.refrigeracion.iniciada || state.refrigeracion.completada) && (
          <TimerBanner
            label="Tiempo de Kumis en Cuarto Frío"
            sublabel="Meta de reposo en frío: 12 horas entre 2.0 °C y 4.0 °C"
            formattedTime={refrigeracionTimer.formattedElapsed}
            targetLabel="12 Horas"
            progressPercent={refrigeracionTimer.progressPercent}
            isRunning={state.refrigeracion.iniciada && !state.refrigeracion.completada}
            isCompleted={state.refrigeracion.completada}
            isOvertime={refrigeracionTimer.isOvertime}
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Temperatura del Cuarto Frío"
            type="number"
            step="0.5"
            unit="°C"
            value={state.refrigeracion.temperaturaCuartoFrio}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 3.0;
              onChange((prev) => ({
                ...prev,
                refrigeracion: {
                  ...prev.refrigeracion,
                  temperaturaCuartoFrio: val,
                },
              }));
            }}
            hint="Rango requerido: 2.0 °C a 4.0 °C"
          />

          <InputField
            label="pH del Kumis Frío"
            type="number"
            step="0.05"
            unit="pH"
            value={state.refrigeracion.phFinalFrio}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 4.45;
              onChange((prev) => ({
                ...prev,
                refrigeracion: { ...prev.refrigeracion, phFinalFrio: val },
              }));
            }}
            hint="Punto ideal: 4.40 a 4.50"
          />

          <div className="p-3.5 rounded-xl bg-[#fcfaf7] border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-[#5d564a] block">
              Horarios de Cuarto Frío
            </span>
            <div className="mt-1.5 text-xs text-[#434655] space-y-1">
              <div>
                Entrada:{' '}
                <strong className="font-mono text-[#1e1b18]">
                  {state.refrigeracion.horaInicio || '--:--'}
                </strong>
              </div>
              <div>
                Salida:{' '}
                <strong className="font-mono text-emerald-800">
                  {state.refrigeracion.horaFin || 'En cuarto frío'}
                </strong>
              </div>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Cuerpo sedoso listo para batir
            </span>
          </div>
        </div>
      </Card>

      {/* AVANZAR A ETAPA 4 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#434655]">
          Cuando el Kumis cumpla sus 12 horas de frío, pasa a{' '}
          <strong className="text-[#1e1b18]">4. Batido y Ajuste de Dulzor</strong>.
        </div>
        <Button
          variant="primary"
          size="lg"
          iconRight="arrow_forward"
          onClick={onNextStage}
          className="w-full sm:w-auto"
        >
          Ir a 4. Batido y Ajuste de Dulzor
        </Button>
      </div>
    </div>
  );
};
