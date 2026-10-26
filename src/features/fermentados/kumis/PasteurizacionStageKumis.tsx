import React, { useEffect } from 'react';
import { PasteurizacionKumisState } from '../../../types/kumis';
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

interface PasteurizacionStageKumisProps {
  state: PasteurizacionKumisState;
  onChange: (updater: (prev: PasteurizacionKumisState) => PasteurizacionKumisState) => void;
  processTimer: ProcessTimerState;
  onStartProcessTimer: () => void;
  onNextStage: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const PasteurizacionStageKumis: React.FC<PasteurizacionStageKumisProps> = ({
  state,
  onChange,
  processTimer,
  onStartProcessTimer,
  onNextStage,
  showToast,
}) => {
  // Azúcar de Kumis: siempre 3.2 kg por cada 40 L
  const azucarCalculado = Number(((state.litrosLeche / 40) * 3.2).toFixed(2));

  // 1. Reloj de calentamiento
  const calentamientoTimer = useStageCountdown({
    isRunning: state.calentamiento.iniciado && !state.calentamiento.completado,
    isCompleted: state.calentamiento.completado,
    startTimestamp: state.calentamiento.timestampInicio,
    targetMinutes: 25,
    completedDurationText: state.calentamiento.tiempoCalentamiento,
  });

  // 2. Reloj de sostenimiento térmico (15 min)
  const sostenimientoTimer = useStageCountdown({
    isRunning: state.sostenimiento.iniciado && !state.sostenimiento.completado,
    isCompleted: state.sostenimiento.completado,
    startTimestamp: state.sostenimiento.timestampInicio,
    targetMinutes: state.sostenimiento.duracionMinutos || 15,
    completedDurationText: state.sostenimiento.duracionReal,
  });

  // Auto-completar sostenimiento a los 15 min (900 s)
  useEffect(() => {
    if (
      state.sostenimiento.iniciado &&
      !state.sostenimiento.completado &&
      sostenimientoTimer.elapsedSeconds >= 900
    ) {
      const timeStr = getCurrentTimeString();
      const now = Date.now();
      const durRealStr = formatHumanDuration(sostenimientoTimer.elapsedSeconds);

      onChange((prev) => ({
        ...prev,
        sostenimiento: {
          ...prev.sostenimiento,
          completado: true,
          horaFin: timeStr,
          duracionReal: durRealStr,
        },
        enfriamiento: {
          ...prev.enfriamiento,
          enfriamientoIniciado: true,
          horaInicio: timeStr,
          timestampInicioEnfriamiento: now,
        },
      }));
      showToast(
        `✓ Cumplió los 15 min a 85–90 °C (${durRealStr}). Inicia el enfriamiento hasta 35 °C.`,
        'success'
      );
    }
  }, [
    state.sostenimiento.iniciado,
    state.sostenimiento.completado,
    sostenimientoTimer.elapsedSeconds,
    onChange,
    showToast,
  ]);

  // 3. Reloj de enfriamiento hasta 35 °C
  const isEnfriamientoListo35 =
    state.divisionLeche?.kumisLlego35 || state.enfriamiento.enfriamientoCompletado;

  const enfriamientoTimer = useStageCountdown({
    isRunning: state.enfriamiento.enfriamientoIniciado && !isEnfriamientoListo35,
    isCompleted: isEnfriamientoListo35,
    startTimestamp: state.enfriamiento.timestampInicioEnfriamiento,
    targetMinutes: 25,
    completedDurationText:
      state.divisionLeche?.kumisTiempoEnfriamiento35 ||
      state.enfriamiento.tiempoEnfriamiento,
  });

  // 4. Reloj de trasiego a cantinas
  const isTrasegado =
    state.divisionLeche?.kumisTrasegado || state.trasiego.completado;

  const trasiegoTimer = useStageCountdown({
    isRunning:
      (state.divisionLeche?.kumisTrasiegoIniciado || state.trasiego.iniciado) &&
      !isTrasegado,
    isCompleted: isTrasegado,
    startTimestamp:
      state.divisionLeche?.kumisTimestampInicioTrasiego ||
      state.trasiego.timestampInicio,
    targetMinutes: 10,
    completedDurationText:
      state.divisionLeche?.kumisTiempoTrasiego || state.trasiego.tiempoTrasiego,
  });

  // Handlers
  const handleStartCalentamiento = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();

    if (!processTimer.isRunning) {
      onStartProcessTimer();
    }

    onChange((prev) => ({
      ...prev,
      llevaAzucar: true,
      calentamiento: {
        ...prev.calentamiento,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
        timestampInicio: now,
      },
    }));

    showToast(
      `⏱ Calentamiento de Kumis iniciado a las ${timeStr}. Reloj del lote en marcha.`,
      'info'
    );
  };

  const handleYaAdicioneAzucar = () => {
    const timeStr = getCurrentTimeString();
    const cantidadFinal = state.azucar.esManual
      ? state.azucar.cantidadKg
      : azucarCalculado;

    onChange((prev) => ({
      ...prev,
      llevaAzucar: true,
      azucar: {
        ...prev.azucar,
        adicionado: true,
        horaAdicion: timeStr,
        cantidadKg: cantidadFinal,
      },
      calentamiento: {
        ...prev.calentamiento,
        temperatura60Alcanzada: true,
      },
    }));

    showToast(
      `✓ Azúcar agregada al Kumis: ${cantidadFinal} kg a las ${timeStr} (Lote: ${state.azucar.loteAzucar}).`,
      'success'
    );
  };

  const handleLlego85a90 = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const startCal = state.calentamiento.timestampInicio || now;
    const durCalSec = Math.max(1, Math.floor((now - startCal) / 1000));
    const durCalStr = formatHumanDuration(durCalSec);

    onChange((prev) => ({
      ...prev,
      calentamiento: {
        ...prev.calentamiento,
        completado: true,
        horaFin: timeStr,
        tiempoCalentamiento: durCalStr,
        llego85a90: true,
        horaLlegada85a90: timeStr,
      },
      sostenimiento: {
        ...prev.sostenimiento,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
        timestampInicio: now,
        duracionMinutos: 15,
      },
    }));

    showToast(
      `✓ Llegó a 85–90 °C a las ${timeStr}. Corriendo los 15 minutos de sostenimiento.`,
      'success'
    );
  };

  const handleFinalizarSostenimiento = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const startSost = state.sostenimiento.timestampInicio || now;
    const durSec = Math.max(1, Math.floor((now - startSost) / 1000));
    const durStr = formatHumanDuration(durSec);

    onChange((prev) => ({
      ...prev,
      sostenimiento: {
        ...prev.sostenimiento,
        completado: true,
        horaFin: timeStr,
        duracionReal: durStr,
      },
      enfriamiento: {
        ...prev.enfriamiento,
        enfriamientoIniciado: true,
        horaInicio: timeStr,
        timestampInicioEnfriamiento: now,
      },
    }));

    showToast(
      `✓ Sostenimiento terminado (${durStr}). Ahora baja la temperatura hasta 35 °C.`,
      'success'
    );
  };

  const handleLlego35 = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const startEnf = state.enfriamiento.timestampInicioEnfriamiento || now;
    const durEnfSec = Math.max(1, Math.floor((now - startEnf) / 1000));
    const durEnfStr = formatHumanDuration(durEnfSec);

    onChange((prev) => ({
      ...prev,
      enfriamiento: {
        ...prev.enfriamiento,
        enfriamientoCompletado: true,
        horaFinEnfriamiento: timeStr,
        tiempoEnfriamiento: durEnfStr,
        temperaturaFinal: 35.0,
      },
      trasiego: {
        ...prev.trasiego,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
        timestampInicio: now,
      },
      divisionLeche: {
        ...prev.divisionLeche,
        litrosKumis: prev.litrosLeche,
        kumisEnfriando35: false,
        kumisLlego35: true,
        kumisHora35: timeStr,
        kumisTiempoEnfriamiento35: durEnfStr,
        kumisTrasiegoIniciado: true,
        kumisTimestampInicioTrasiego: now,
      },
    }));

    showToast(
      `✓ Leche de Kumis a 35.0 °C a las ${timeStr} (${durEnfStr}). Lista para pasar a cantinas.`,
      'success'
    );
  };

  const handleYaTrasegue = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const startTras =
      state.divisionLeche?.kumisTimestampInicioTrasiego ||
      state.trasiego.timestampInicio ||
      now;
    const durTrasSec = Math.max(1, Math.floor((now - startTras) / 1000));
    const durTrasStr = formatHumanDuration(durTrasSec);

    onChange((prev) => ({
      ...prev,
      trasiego: {
        ...prev.trasiego,
        completado: true,
        horaFin: timeStr,
        tiempoTrasiego: durTrasStr,
      },
      divisionLeche: {
        ...prev.divisionLeche,
        kumisTrasegado: true,
        kumisHoraTrasegado: timeStr,
        kumisTiempoTrasiego: durTrasStr,
      },
    }));

    showToast(
      `✓ Leche de Kumis pasada a cantinas a las ${timeStr} (${durTrasStr}).`,
      'success'
    );
  };

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      <StageHeader
        stageNumber={1}
        totalStages={5}
        lineName="Línea de Fermentados · Kumis"
        title="1. Pasteurización y Enfriamiento (Kumis)"
        subtitle="Calienta la leche con azúcar hasta 85–90 °C por 15 minutos, enfríala hasta 35 °C y pásala a las cantinas."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'water_drop',
            label: 'Leche de Kumis',
            value: `${state.litrosLeche} L`,
            tone: 'amber',
          },
          {
            icon: 'thermostat',
            label: 'Meta Siembra',
            value: '35.0 °C',
            tone: 'emerald',
          },
        ]}
      />

      {/* PASO 01: LECHE BASE Y AZÚCAR DEL KUMIS */}
      <Card
        stepBadge="Paso 01"
        title="Leche Base y Azúcar del Kumis"
        subtitle="El Kumis siempre lleva azúcar (3.2 kg por cada 40 L). Agrégala cuando la leche vaya subiendo por 60 °C para que se disuelva bien."
        icon="science"
        tone={state.azucar.adicionado ? 'completed' : 'default'}
        statusBadge={
          state.azucar.adicionado
            ? { label: `Azúcar agregada (${state.azucar.horaAdicion})`, variant: 'success' }
            : { label: 'Siempre con azúcar', variant: 'warning' }
        }
        headerAction={
          <ConfirmButton
            confirmed={state.azucar.adicionado}
            confirmedLabel={`✓ Azúcar Agregada (${state.azucar.horaAdicion})`}
            unconfirmedLabel="Confirmar: Ya Puse el Azúcar (60 °C)"
            onConfirm={handleYaAdicioneAzucar}
          />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <InputField
            label="Litros de Leche para Kumis"
            type="number"
            min="10"
            step="5"
            unit="L"
            value={state.litrosLeche}
            onChange={(e) => {
              const val = Math.max(0, parseFloat(e.target.value) || 0);
              const nuevoAzucar = Number(((val / 40) * 3.2).toFixed(2));
              onChange((p) => ({
                ...p,
                litrosLeche: val,
                azucar: {
                  ...p.azucar,
                  cantidadKg: p.azucar.esManual ? p.azucar.cantidadKg : nuevoAzucar,
                },
                divisionLeche: {
                  ...p.divisionLeche,
                  litrosKumis: val,
                },
              }));
            }}
          />

          <InputField
            label="Lote de la Leche"
            type="text"
            value={state.loteLeche}
            onChange={(e) => {
              const val = e.target.value;
              onChange((p) => ({ ...p, loteLeche: val }));
            }}
          />

          <InputField
            label="Azúcar (3.2 kg / 40 L)"
            type="number"
            step="0.1"
            min="0"
            unit="kg"
            value={state.azucar.esManual ? state.azucar.cantidadKg : azucarCalculado}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              onChange((p) => ({
                ...p,
                azucar: {
                  ...p.azucar,
                  cantidadKg: val,
                  esManual: true,
                },
              }));
            }}
            hint="Calculado automático según litros"
          />

          <InputField
            label="Lote de Azúcar"
            type="text"
            value={state.azucar.loteAzucar}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              onChange((p) => ({
                ...p,
                azucar: { ...p.azucar, loteAzucar: val },
              }));
            }}
          />
        </div>
      </Card>

      {/* PASO 02: CALENTAMIENTO Y SOSTENIMIENTO */}
      <Card
        stepBadge="Paso 02"
        title="Calentamiento (85–90 °C) y Sostenimiento (15 min)"
        subtitle="Prende el tanque, avisa cuando llegue entre 85 y 90 °C y mantén esa temperatura por 15 minutos."
        icon="local_fire_department"
        tone={
          state.sostenimiento.completado
            ? 'completed'
            : state.calentamiento.iniciado
              ? 'active'
              : 'default'
        }
        statusBadge={
          state.sostenimiento.completado
            ? { label: `Pasteurizado (${state.sostenimiento.horaFin})`, variant: 'success' }
            : state.sostenimiento.iniciado
              ? { label: 'Sosteniendo 15 min', variant: 'warning', pulse: true }
              : state.calentamiento.iniciado
                ? { label: 'Calentando tanque', variant: 'info', pulse: true }
                : { label: 'Sin iniciar', variant: 'neutral' }
        }
        headerAction={
          !state.calentamiento.iniciado ? (
            <Button
              variant="primary"
              icon="play_circle"
              onClick={handleStartCalentamiento}
            >
              Prender Calentamiento
            </Button>
          ) : !state.calentamiento.completado ? (
            <ConfirmButton
              confirmed={false}
              confirmedLabel="✓ Llegó a 85–90 °C"
              unconfirmedLabel="Confirmar: Ya Llegó a 85–90 °C"
              onConfirm={handleLlego85a90}
            />
          ) : (
            <ConfirmButton
              confirmed={state.sostenimiento.completado}
              confirmedLabel={`✓ Sostenimiento Listo (${state.sostenimiento.horaFin})`}
              unconfirmedLabel="Confirmar Fin de los 15 Minutos"
              onConfirm={handleFinalizarSostenimiento}
            />
          )
        }
      >
        <div className="space-y-4">
          {state.calentamiento.iniciado && !state.calentamiento.completado && (
            <TimerBanner
              label="Tiempo Subiendo Temperatura"
              sublabel="Meta: llegar entre 85.0 °C y 90.0 °C"
              formattedTime={calentamientoTimer.formattedElapsed}
              targetLabel="85–90 °C"
              progressPercent={calentamientoTimer.progressPercent}
              isRunning
            />
          )}

          {(state.sostenimiento.iniciado || state.sostenimiento.completado) && (
            <TimerBanner
              label="Sostenimiento Térmico a 85–90 °C"
              sublabel="Tiempo reglamentario: 15 minutos continuos"
              formattedTime={sostenimientoTimer.formattedElapsed}
              targetLabel="15 min"
              progressPercent={sostenimientoTimer.progressPercent}
              isRunning={state.sostenimiento.iniciado && !state.sostenimiento.completado}
              isCompleted={state.sostenimiento.completado}
              isOvertime={sostenimientoTimer.isOvertime}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField
              label="Temperatura Alcanzada"
              type="number"
              step="0.5"
              unit="°C"
              value={state.calentamiento.temperaturaConsigna}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 88.0;
                onChange((p) => ({
                  ...p,
                  calentamiento: { ...p.calentamiento, temperaturaConsigna: val },
                }));
              }}
              hint="Rango requerido: 85.0 °C a 90.0 °C"
            />

            <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
              <span className="text-[11px] uppercase font-bold text-[#5d564a]">
                Tiempo Calentando
              </span>
              <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
                {state.calentamiento.tiempoCalentamiento ||
                  (state.calentamiento.iniciado
                    ? calentamientoTimer.formattedElapsed
                    : '--')}
              </div>
              <span className="text-[11px] text-[#7a7164] mt-1 block">
                Inicio: {state.calentamiento.horaInicio || '--:--'} · 85°C:{' '}
                {state.calentamiento.horaLlegada85a90 || '--:--'}
              </span>
            </div>

            <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
              <span className="text-[11px] uppercase font-bold text-[#5d564a]">
                Sostenimiento (15 min)
              </span>
              <div className="text-xl font-black font-mono text-emerald-800 mt-1">
                {state.sostenimiento.duracionReal ||
                  (state.sostenimiento.iniciado
                    ? sostenimientoTimer.formattedElapsed
                    : '15 min')}
              </div>
              <span className="text-[11px] text-[#7a7164] mt-1 block">
                Hora fin: {state.sostenimiento.horaFin || 'En espera'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* PASO 03: ENFRIAMIENTO HASTA 35 °C Y TRASIEGO */}
      <Card
        stepBadge="Paso 03"
        title="Enfriamiento hasta 35.0 °C y Paso a Cantinas"
        subtitle="A diferencia del yogur (45 °C), la leche del Kumis debe bajar hasta 35.0 °C antes de pasarla a las cantinas y ponerle el cultivo."
        icon="ac_unit"
        tone={
          isTrasegado
            ? 'completed'
            : state.enfriamiento.enfriamientoIniciado
              ? 'active'
              : 'default'
        }
        statusBadge={
          isTrasegado
            ? { label: 'En Cantinas a 35 °C ✓', variant: 'success' }
            : isEnfriamientoListo35
              ? { label: 'Pasando a cantinas', variant: 'warning', pulse: true }
              : state.enfriamiento.enfriamientoIniciado
                ? { label: 'Enfriando a 35 °C', variant: 'info', pulse: true }
                : { label: 'Pendiente', variant: 'neutral' }
        }
        headerAction={
          !isEnfriamientoListo35 ? (
            <ConfirmButton
              confirmed={false}
              disabled={!state.sostenimiento.completado}
              confirmedLabel="✓ Llegó a 35 °C"
              unconfirmedLabel="Confirmar: Ya Bajó a 35.0 °C"
              icon="ac_unit"
              onConfirm={handleLlego35}
            />
          ) : (
            <ConfirmButton
              confirmed={isTrasegado}
              confirmedLabel={`✓ Ya Puse el Kumis en Cantinas (${
                state.divisionLeche?.kumisHoraTrasegado || state.trasiego.horaFin
              })`}
              unconfirmedLabel="Confirmar: Ya Pasé la Leche a Cantinas"
              icon="move_down"
              onConfirm={handleYaTrasegue}
            />
          )
        }
      >
        <div className="space-y-4">
          {state.enfriamiento.enfriamientoIniciado && !isEnfriamientoListo35 && (
            <TimerBanner
              label="Tiempo Enfriando hasta 35.0 °C"
              sublabel="Baja la temperatura con agua fría hasta llegar a 35.0 °C"
              formattedTime={enfriamientoTimer.formattedElapsed}
              targetLabel="35.0 °C"
              progressPercent={enfriamientoTimer.progressPercent}
              isRunning
            />
          )}

          {isEnfriamientoListo35 && (
            <TimerBanner
              label="Tiempo Pasando a Cantinas"
              sublabel="Trasegando la leche a 35.0 °C hacia las cantinas de incubación"
              formattedTime={trasiegoTimer.formattedElapsed}
              targetLabel="10 min"
              progressPercent={trasiegoTimer.progressPercent}
              isRunning={!isTrasegado}
              isCompleted={isTrasegado}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb]">
              <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
                Temperatura Final para Kumis
              </span>
              <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
                35.0 °C
              </div>
              <span className="text-[11px] text-[#7a7164] mt-1 block">
                Llegada a 35 °C:{' '}
                {state.divisionLeche?.kumisHora35 ||
                  state.enfriamiento.horaFinEnfriamiento ||
                  '--:--'}
              </span>
            </div>

            <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb]">
              <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
                Tiempo de Enfriamiento
              </span>
              <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
                {state.divisionLeche?.kumisTiempoEnfriamiento35 ||
                  state.enfriamiento.tiempoEnfriamiento ||
                  (state.enfriamiento.enfriamientoIniciado
                    ? enfriamientoTimer.formattedElapsed
                    : '--')}
              </div>
              <span className="text-[11px] text-[#7a7164] mt-1 block">
                Desde 88 °C hasta 35 °C
              </span>
            </div>

            <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb]">
              <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
                Paso a Cantinas
              </span>
              <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
                {state.divisionLeche?.kumisTiempoTrasiego ||
                  state.trasiego.tiempoTrasiego ||
                  (isEnfriamientoListo35 ? trasiegoTimer.formattedElapsed : '--')}
              </div>
              <span className="text-[11px] text-[#7a7164] mt-1 block">
                Fin trasiego:{' '}
                {state.divisionLeche?.kumisHoraTrasegado ||
                  state.trasiego.horaFin ||
                  '--:--'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* AVANZAR A ETAPA 2 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#434655]">
          Con la leche a 35 °C ya servida en las cantinas, pasa a{' '}
          <strong className="text-[#1e1b18]">2. Inoculación e Incubación (Kumis)</strong>.
        </div>
        <Button
          variant="primary"
          size="lg"
          iconRight="arrow_forward"
          onClick={onNextStage}
          className="w-full sm:w-auto"
        >
          Ir a 2. Inoculación e Incubación
        </Button>
      </div>
    </div>
  );
};
