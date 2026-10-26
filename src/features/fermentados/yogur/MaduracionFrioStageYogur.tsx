import React from 'react';
import { MaduracionFrioYogurState } from '../../../types/yogur';
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

interface MaduracionFrioStageYogurProps {
  state: MaduracionFrioYogurState;
  onChange: (updater: (prev: MaduracionFrioYogurState) => MaduracionFrioYogurState) => void;
  processTimer: ProcessTimerState;
  onNextStage: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const MaduracionFrioStageYogur: React.FC<MaduracionFrioStageYogurProps> = ({
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
      `✓ Cantinas acomodadas con cuidado (${state.trasladoCantinas.numeroCantinas} cantinas) a las ${timeStr}.`,
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
      `✓ Entrada a cuarto frío registrada a las ${timeStr} (${state.refrigeracion.temperaturaCuartoFrio} °C). Reloj de 12 horas en marcha.`,
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
      `✓ Frío de 12 horas completado a las ${timeStr} (${durStr}). El yogur ya tiene cuerpo para batir.`,
      'success'
    );
  };

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      <StageHeader
        stageNumber={3}
        totalStages={5}
        lineName="Línea de Fermentados · Yogur"
        title="3. Cuarto Frío (Maduración)"
        subtitle="Acomoda las cantinas sin golpearlas y déjalas enfriar durante 12 horas (2 °C a 4 °C) para que el yogur coja buen cuerpo antes de batir."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'ac_unit',
            label: 'Temp. Cuarto Frío',
            value: '2.0 - 4.0 °C',
            tone: 'blue',
          },
          {
            icon: 'timer',
            label: 'Reposo en Frío',
            value: state.refrigeracion.iniciada
              ? refrigeracionTimer.formattedElapsed
              : '12 Horas',
            tone: state.refrigeracion.completada ? 'emerald' : 'amber',
          },
        ]}
      />

      {/* PASO 01: ACOMODO DE CANTINAS */}
      <Card
        stepBadge="Paso 01"
        title="Acomodo en Cantinas de Frío (10 min)"
        subtitle="Lleva las cantinas despacio sin agitarlas brusco para no cortar la cuajada antes de enfriar."
        icon="inventory"
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
            label="Cantidad de Cantinas Usadas"
            type="number"
            min="1"
            max="20"
            unit="cantinas"
            value={state.trasladoCantinas.numeroCantinas}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 3;
              onChange((p) => ({
                ...p,
                trasladoCantinas: { ...p.trasladoCantinas, numeroCantinas: val },
              }));
            }}
            hint="Cantinas limpias de 40 L cada una"
          />

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Tiempo de Traslado
            </span>
            <div className="text-2xl font-black font-mono text-[#1e1b18] mt-1">
              {state.trasladoCantinas.tiempoTraslado || '10 min'}
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Hora fin: {state.trasladoCantinas.horaFin || '--:--'}
            </span>
          </div>

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Estado de la Cuajada
            </span>
            <div className="text-sm font-black text-emerald-800 mt-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">
                verified
              </span>
              <span>Firme y sin partirse</span>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Lista para reposar en frío
            </span>
          </div>
        </div>
      </Card>

      {/* PASO 02: REPOSO EN CUARTO FRÍO (12 HORAS) */}
      <Card
        stepBadge="Paso 02"
        title="Enfriamiento en Cuarto Frío (12 Horas)"
        subtitle="El frío frena la acidez y hace que el yogur quede espeso y cremoso antes de meterlo a la batidora."
        icon="kitchen"
        tone={
          state.refrigeracion.completada
            ? 'completed'
            : state.refrigeracion.iniciada
              ? 'active'
              : 'default'
        }
        statusBadge={
          state.refrigeracion.completada
            ? { label: 'Frío Completado (12 h) ✓', variant: 'success' }
            : state.refrigeracion.iniciada
              ? { label: 'Enfriando en Cuarto Frío', variant: 'info', pulse: true }
              : { label: 'Pendiente', variant: 'neutral' }
        }
        headerAction={
          !state.refrigeracion.iniciada ? (
            <Button
              variant="primary"
              icon="play_circle"
              disabled={!state.trasladoCantinas.completado}
              onClick={handleStartRefrigeracion}
            >
              Iniciar Reloj de Cuarto Frío (12 h)
            </Button>
          ) : (
            <ConfirmButton
              confirmed={state.refrigeracion.completada}
              confirmedLabel={`✓ Frío de 12 h Completado (${state.refrigeracion.horaFin})`}
              unconfirmedLabel="Confirmar: Ya Cumplió las 12 Horas de Frío"
              onConfirm={handleConfirmFinRefrigeracion}
            />
          )
        }
      >
        {(state.refrigeracion.iniciada || state.refrigeracion.completada) && (
          <TimerBanner
            label="Tiempo en Cuarto Frío"
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
            step="0.1"
            unit="°C"
            value={state.refrigeracion.temperaturaCuartoFrio}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 3.5;
              onChange((p) => ({
                ...p,
                refrigeracion: { ...p.refrigeracion, temperaturaCuartoFrio: val },
              }));
            }}
            hint="Rango ideal: 2.0 °C a 4.0 °C"
          />

          <InputField
            label="pH del Yogur Frío"
            type="number"
            step="0.05"
            unit="pH"
            value={state.refrigeracion.phFinalFrio}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 4.45;
              onChange((p) => ({
                ...p,
                refrigeracion: { ...p.refrigeracion, phFinalFrio: val },
              }));
            }}
            hint="Punto estable: 4.40 a 4.50"
          />

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
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
              Textura firme lista para pasar a batidora
            </span>
          </div>
        </div>
      </Card>

      {/* AVANZAR A ETAPA 4 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#434655]">
          Cuando el yogur cumpla sus 12 horas de frío, pasa a{' '}
          <strong className="text-[#1e1b18]">4. Batido y Saborizado</strong>.
        </div>
        <Button
          variant="primary"
          size="lg"
          iconRight="arrow_forward"
          onClick={onNextStage}
          className="w-full sm:w-auto"
        >
          Ir a 4. Batido y Saborizado
        </Button>
      </div>
    </div>
  );
};
