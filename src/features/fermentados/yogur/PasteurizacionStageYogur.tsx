import React, { useState } from 'react';
import { PasteurizacionYogurState } from '../../../types/yogur';
import { ProcessTimerState, SplitMilkAllocationInput } from '../../../types';
import { formatHumanDuration, getCurrentTimeString } from '../../../utils/timer';
import { useStageCountdown } from '../../../hooks';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  InputField,
  StageHeader,
  TimerBanner,
} from '../../../components/ui';

interface PasteurizacionStageYogurProps {
  state: PasteurizacionYogurState;
  onChange: (
    updater: (prev: PasteurizacionYogurState) => PasteurizacionYogurState
  ) => void;
  processTimer: ProcessTimerState;
  onStartProcessTimer: () => void;
  onSplitParentBatch?: (input: SplitMilkAllocationInput) => void;
  onNextStage: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const PasteurizacionStageYogur: React.FC<
  PasteurizacionStageYogurProps
> = ({
  state,
  onChange,
  processTimer,
  onStartProcessTimer,
  onSplitParentBatch,
  onNextStage,
  showToast,
}) => {
  // Fórmula de azúcar estándar: 3.2 kg por cada 40 L de leche (80 g/L)
  const azucarSugeridoKg = Number(((state.litrosLeche / 40) * 3.2).toFixed(2));

  // Estado local para la División Divergente del Lote Padre (Yogur Dulce, Natural, Kumis, Griego)
  const [litrosYogurDulce, setLitrosYogurDulce] = useState<number>(
    state.divisionLeche?.litrosYogurConAzucar ?? state.litrosLeche
  );
  const [litrosYogurNatural, setLitrosYogurNatural] = useState<number>(
    state.divisionLeche?.litrosYogurSinAzucar ?? 0
  );
  const [litrosKumis, setLitrosKumis] = useState<number>(
    state.litrosKumisDestinados ?? state.divisionLeche?.litrosKumis ?? 0
  );
  const [litrosGriego, setLitrosGriego] = useState<number>(
    state.divisionLeche?.litrosYogurGriego ?? 0
  );

  // Cronómetros de etapa con useStageCountdown
  const calentamientoTimer = useStageCountdown({
    startTimestamp: state.calentamiento.timestampInicio,
    isRunning: state.calentamiento.iniciado && !state.calentamiento.completado,
    isCompleted: state.calentamiento.completado,
  });

  const sostenimientoTimer = useStageCountdown({
    startTimestamp: state.sostenimiento.timestampInicio,
    isRunning: state.sostenimiento.iniciado && !state.sostenimiento.completado,
    isCompleted: state.sostenimiento.completado,
    targetSeconds: (state.sostenimiento.duracionMinutos || 15) * 60,
    onTargetReached: () => {
      if (state.sostenimiento.completado) return;
      const timeStr = getCurrentTimeString();
      const now = Date.now();
      onChange((prev) => ({
        ...prev,
        sostenimiento: {
          ...prev.sostenimiento,
          completado: true,
          horaFin: timeStr,
          duracionReal: `${prev.sostenimiento.duracionMinutos || 15} min`,
        },
        enfriamiento: {
          ...prev.enfriamiento,
          enfriamientoIniciado: true,
          horaInicio: timeStr,
          timestampInicioEnfriamiento: now,
        },
      }));
      showToast(
        '✓ ¡Listos los 15 minutos entre 85 y 90 °C! Ahora empieza a enfriar la leche a 45 °C.',
        'success'
      );
    },
  });

  const enfriamientoTimer = useStageCountdown({
    startTimestamp: state.enfriamiento.timestampInicioEnfriamiento,
    isRunning:
      state.enfriamiento.enfriamientoIniciado &&
      !state.enfriamiento.enfriamientoCompletado,
    isCompleted: state.enfriamiento.enfriamientoCompletado,
  });

  const trasiegoTimer = useStageCountdown({
    startTimestamp: state.trasiego.timestampInicio,
    isRunning: state.trasiego.iniciado && !state.trasiego.completado,
    isCompleted: state.trasiego.completado,
  });

  const kumis35Timer = useStageCountdown({
    startTimestamp: state.divisionLeche?.kumisTimestampInicio35,
    isRunning: Boolean(
      state.divisionLeche?.kumisEnfriando35 && !state.divisionLeche?.kumisLlego35
    ),
    isCompleted: Boolean(state.divisionLeche?.kumisLlego35),
  });

  // Paso 1: Iniciar calentamiento
  const handleStartCalentamiento = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();

    if (!processTimer.isRunning) {
      onStartProcessTimer();
    }

    onChange((prev) => ({
      ...prev,
      calentamiento: {
        ...prev.calentamiento,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
        timestampInicio: now,
      },
    }));

    showToast(
      `⏱ Empezaste a calentar la leche en el tanque a las ${timeStr}.`,
      'info'
    );
  };

  // Paso 1.B: Ya adicioné el azúcar (cuando la leche va entibiando)
  const handleConfirmAzucar = () => {
    if (!state.azucar.loteAzucar?.trim()) {
      showToast('⚠ Escribe primero el lote del azúcar antes de confirmar.', 'warning');
      return;
    }
    const timeStr = getCurrentTimeString();
    onChange((prev) => ({
      ...prev,
      loteAzucarPastur: prev.azucar.loteAzucar,
      azucar: {
        ...prev.azucar,
        adicionado: true,
        horaAdicion: timeStr,
        cantidadKg: prev.azucar.esManual
          ? prev.azucar.cantidadKg
          : azucarSugeridoKg,
      },
    }));
    showToast(
      `✓ Ya agregaste el azúcar (${
        state.azucar.esManual ? state.azucar.cantidadKg : azucarSugeridoKg
      } kg) a las ${timeStr}.`,
      'success'
    );
  };

  // Paso 2: Llegó a 85–90 °C -> Inicia sostenimiento de 15 min
  const handleLlego85a90 = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const elapsedCal = state.calentamiento.timestampInicio
      ? formatHumanDuration(
          Math.max(
            1,
            Math.floor((now - state.calentamiento.timestampInicio) / 1000)
          )
        )
      : calentamientoTimer.humanElapsed;

    onChange((prev) => ({
      ...prev,
      calentamiento: {
        ...prev.calentamiento,
        completado: true,
        llego85a90: true,
        horaFin: timeStr,
        horaLlegada85a90: timeStr,
        tiempoCalentamiento: elapsedCal,
      },
      sostenimiento: {
        ...prev.sostenimiento,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
        timestampInicio: now,
      },
    }));

    showToast(
      `✓ La leche llegó a ${state.calentamiento.temperaturaAlcanzada} °C. Arrancó el reloj de 15 minutos.`,
      'success'
    );
  };

  // Completar sostenimiento manualmente
  const handleCompletarSostenimiento = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const realMin = Math.max(1, Math.round(sostenimientoTimer.elapsedSeconds / 60));

    onChange((prev) => ({
      ...prev,
      sostenimiento: {
        ...prev.sostenimiento,
        completado: true,
        horaFin: timeStr,
        duracionReal: `${realMin} min`,
      },
      enfriamiento: {
        ...prev.enfriamiento,
        enfriamientoIniciado: true,
        horaInicio: timeStr,
        timestampInicioEnfriamiento: now,
      },
    }));

    showToast(
      '✓ Sostenimiento completado. Ahora enfría la leche hasta 45 °C.',
      'info'
    );
  };

  // Paso 3: Llegó a 45 °C -> Inicia trasiego a cantinas
  const handleLlego45 = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const elapsedEnf = state.enfriamiento.timestampInicioEnfriamiento
      ? formatHumanDuration(
          Math.max(
            1,
            Math.floor(
              (now - state.enfriamiento.timestampInicioEnfriamiento) / 1000
            )
          )
        )
      : enfriamientoTimer.humanElapsed;

    onChange((prev) => ({
      ...prev,
      enfriamiento: {
        ...prev.enfriamiento,
        enfriamientoCompletado: true,
        horaFinEnfriamiento: timeStr,
        tiempoEnfriamiento: elapsedEnf,
      },
      trasiego: {
        ...prev.trasiego,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
        timestampInicio: now,
      },
    }));

    showToast(
      `✓ La leche ya bajó a 45 °C (${timeStr}). Pásala a las cantinas o divide el lote si vas a sacar Kumis o Griego.`,
      'success'
    );
  };

  // Paso 4: Ya trasegué a cantinas
  const handleYaTrasegue = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const elapsedTras = state.trasiego.timestampInicio
      ? formatHumanDuration(
          Math.max(1, Math.floor((now - state.trasiego.timestampInicio) / 1000))
        )
      : trasiegoTimer.humanElapsed;

    onChange((prev) => ({
      ...prev,
      trasiego: {
        ...prev.trasiego,
        completado: true,
        horaFin: timeStr,
        tiempoTrasiego: elapsedTras,
      },
    }));

    showToast(
      `✓ Leche trasegada a cantinas a las ${timeStr} (${elapsedTras}). Lista para agregar el cultivo.`,
      'success'
    );
  };

  // Confirmar División Divergente del Lote Padre hacia Lotes Hijos (Yogur, Kumis, Griego)
  const handleConfirmarDivisionLote = () => {
    const now = Date.now();
    const yDulce = Math.max(0, Number(litrosYogurDulce) || 0);
    const yNat = Math.max(0, Number(litrosYogurNatural) || 0);
    const kum = Math.max(0, Number(litrosKumis) || 0);
    const gri = Math.max(0, Number(litrosGriego) || 0);

    onChange((prev) => ({
      ...prev,
      incluyeKumis: kum > 0,
      litrosKumisDestinados: kum,
      divisionLeche: {
        ...prev.divisionLeche,
        litrosYogurConAzucar: yDulce,
        litrosYogurSinAzucar: yNat,
        litrosKumis: kum,
        litrosYogurGriego: gri,
        kumisDivisionConfirmada: true,
        kumisEnfriando35: kum > 0,
        kumisTimestampInicio35: kum > 0 ? now : null,
      },
    }));

    if (onSplitParentBatch) {
      onSplitParentBatch({
        totalParentLiters: Math.max(
          state.litrosLeche,
          yDulce + yNat + kum + gri
        ),
        litrosYogurConAzucar: yDulce,
        litrosYogurSinAzucar: yNat,
        litrosKumis: kum,
        litrosYogurGriego: gri,
        loteLeche: state.loteLeche,
      });
    } else {
      showToast(
        '✓ División de leche guardada. Los sub-lotes ya tienen sus litros asignados.',
        'success'
      );
    }
  };

  const handleKumisLlego35 = () => {
    const timeStr = getCurrentTimeString();
    const durStr = kumis35Timer.humanElapsed;
    onChange((prev) => ({
      ...prev,
      divisionLeche: {
        ...prev.divisionLeche,
        kumisEnfriando35: false,
        kumisLlego35: true,
        kumisHora35: timeStr,
        kumisTiempoEnfriamiento35: durStr,
      },
    }));
    showToast(
      `✓ La leche separada para Kumis ya bajó a 35 °C a las ${timeStr} (${durStr}).`,
      'success'
    );
  };

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-6 bg-[#fcfaf7] min-h-[calc(100vh-4rem)]">
      <StageHeader
        stageNumber={1}
        totalStages={5}
        title="Pasteurización y División de la Leche"
        subtitle="Calienta la leche a 85–90 °C por 15 minutos, enfríala a 45 °C, pásala a cantinas y reparte los litros si hoy también sacas Kumis o Griego."
        productName="Yogur Probiótico"
        icon="local_fire_department"
        isCompleted={state.trasiego.completado}
        startTime={state.calentamiento.horaInicio || undefined}
        endTime={state.trasiego.horaFin || undefined}
        rightContent={
          <div className="px-4 py-2 rounded-xl bg-[#fcfaf7] border border-[#e6decb] text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#737686]">
              Leche en Tanque
            </span>
            <span className="text-2xl font-mono font-black text-[#004ac6]">
              {state.litrosLeche} L
            </span>
          </div>
        }
      />

      {/* PASO 00: Recepción de Leche y Azúcar */}
      <Card
        stepBadge="PASO 00"
        title="Recepción de Leche y Azúcar para el Tanque"
        subtitle="Anota cuántos litros entraron al tanque, el lote del proveedor y si este lote lleva azúcar desde la pasteurización."
        icon="inventory_2"
        headerRight={
          <Badge variant="primary" size="sm">
            {state.llevaAzucar ? 'Con Azúcar (3.2 kg / 40 L)' : 'Natural Sin Azúcar'}
          </Badge>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField
              label="Litros de Leche en Tanque"
              type="number"
              unit="L"
              icon="water_drop"
              value={state.litrosLeche}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value) || 0);
                onChange((prev) => ({
                  ...prev,
                  litrosLeche: val,
                  azucar: {
                    ...prev.azucar,
                    cantidadKg: prev.azucar.esManual
                      ? prev.azucar.cantidadKg
                      : Number(((val / 40) * 3.2).toFixed(2)),
                  },
                }));
              }}
            />

            <InputField
              label="Lote de la Leche (Proveedor)"
              type="text"
              icon="local_shipping"
              value={state.loteLeche}
              onChange={(e) => {
                const val = e.target.value;
                onChange((prev) => ({ ...prev, loteLeche: val }));
              }}
            />

            <InputField
              label="Temperatura al Recibir"
              type="number"
              step="0.1"
              unit="°C"
              targetHint="≤ 6.0 °C"
              value={state.temperaturaRecepcion}
              status={state.temperaturaRecepcion <= 6.0 ? 'valid' : 'warning'}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChange((prev) => ({ ...prev, temperaturaRecepcion: val }));
              }}
            />
          </div>

          {/* Selector coloquial: ¿Lleva azúcar? */}
          <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#e6decb] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-[#191c1e]">
                  ¿Este lote de leche se pasteuriza con azúcar?
                </h4>
                <p className="text-xs text-[#5f6374]">
                  Fórmula de planta: <strong>3.2 kg de azúcar por cada 40 L de leche</strong> (Para {state.litrosLeche} L corresponden <strong>{azucarSugeridoKg} kg</strong>).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant={state.llevaAzucar ? 'primary' : 'secondary'}
                  size="sm"
                  icon="check"
                  onClick={() =>
                    onChange((prev) => ({ ...prev, llevaAzucar: true }))
                  }
                >
                  Sí, con azúcar
                </Button>
                <Button
                  variant={!state.llevaAzucar ? 'primary' : 'secondary'}
                  size="sm"
                  icon="block"
                  onClick={() =>
                    onChange((prev) => ({ ...prev, llevaAzucar: false }))
                  }
                >
                  No (Sin azúcar)
                </Button>
              </div>
            </div>

            {state.llevaAzucar && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#e6decb]">
                <InputField
                  label="Cantidad de Azúcar a Agregar"
                  type="number"
                  step="0.1"
                  unit="kg"
                  targetHint={`Sugerido: ${azucarSugeridoKg} kg`}
                  value={
                    state.azucar.esManual
                      ? state.azucar.cantidadKg
                      : azucarSugeridoKg
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChange((prev) => ({
                      ...prev,
                      azucar: {
                        ...prev.azucar,
                        cantidadKg: val,
                        esManual: true,
                      },
                    }));
                  }}
                />

                <InputField
                  label="Número de Lote del Azúcar *"
                  type="text"
                  icon="qr_code"
                  placeholder="Ej: AZU-2026-09"
                  value={state.azucar.loteAzucar}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange((prev) => ({
                      ...prev,
                      loteAzucarPastur: val,
                      azucar: { ...prev.azucar, loteAzucar: val },
                    }));
                  }}
                />

                <div className="flex items-end">
                  <ConfirmButton
                    confirmed={state.azucar.adicionado}
                    onConfirm={handleConfirmAzucar}
                    labelPending="¡Ya adicioné el azúcar!"
                    labelConfirmed={`Azúcar agregada (${
                      state.azucar.esManual
                        ? state.azucar.cantidadKg
                        : azucarSugeridoKg
                    } kg)`}
                    timestamp={state.azucar.horaAdicion || undefined}
                    variantPending="amber"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* PASO 01: Calentamiento hasta 85–90 °C */}
      <Card
        stepBadge="PASO 01"
        title="Calentar la Leche hasta 85–90 °C"
        subtitle="Prende el calentamiento del tanque y avisa cuando el termómetro llegue al rango de 85 a 90 °C."
        icon="thermostat"
        variant={
          state.calentamiento.completado
            ? 'completed'
            : state.calentamiento.iniciado
            ? 'active'
            : 'default'
        }
        headerRight={
          state.calentamiento.completado ? (
            <Badge variant="success" icon="check_circle">
              Llegó a {state.calentamiento.temperaturaAlcanzada} °C
            </Badge>
          ) : state.calentamiento.iniciado ? (
            <Badge variant="primary" pulse>
              Calentando...
            </Badge>
          ) : (
            <Badge variant="default">Pendiente</Badge>
          )
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#e6decb]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737686] block mb-1">
                Meta de Pasteurización
              </span>
              <span className="text-2xl font-mono font-black text-[#191c1e]">
                85.0 – 90.0 °C
              </span>
            </div>

            <InputField
              label="Temperatura alcanzada"
              type="number"
              step="0.1"
              unit="°C"
              inputSize="lg"
              value={state.calentamiento.temperaturaAlcanzada}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChange((prev) => ({
                  ...prev,
                  calentamiento: {
                    ...prev.calentamiento,
                    temperaturaAlcanzada: val,
                    esManual: true,
                  },
                }));
              }}
            />

            <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#e6decb]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737686] block mb-1">
                Tiempo Calentando
              </span>
              <span className="text-2xl font-mono font-black text-[#004ac6]">
                {state.calentamiento.completado
                  ? state.calentamiento.tiempoCalentamiento || 'Listo'
                  : state.calentamiento.iniciado
                  ? calentamientoTimer.humanElapsed
                  : '00:00'}
              </span>
            </div>
          </div>

          {!state.calentamiento.iniciado ? (
            <Button
              variant="primary"
              size="lg"
              icon="play_circle"
              onClick={handleStartCalentamiento}
            >
              Empezar a calentar la leche
            </Button>
          ) : (
            <ConfirmButton
              confirmed={state.calentamiento.completado}
              onConfirm={handleLlego85a90}
              labelPending="¡La leche ya llegó a 85–90 °C!"
              subtitlePending="Al confirmar, arranca solo el reloj de 15 minutos de sostenimiento"
              labelConfirmed={`Llegó a ${state.calentamiento.temperaturaAlcanzada} °C (${state.calentamiento.tiempoCalentamiento || 'listo'})`}
              subtitleConfirmed={`Inició a las ${state.calentamiento.horaInicio}`}
              timestamp={state.calentamiento.horaFin || undefined}
              variantPending="emerald"
              iconPending="local_fire_department"
            />
          )}
        </div>
      </Card>

      {/* PASO 02: Sostenimiento Térmico (15 minutos) */}
      <Card
        stepBadge="PASO 02"
        title="Mantener entre 85 y 90 °C durante 15 Minutos"
        subtitle="Mantén la leche caliente en ese rango hasta que el reloj termine los 15 minutos."
        icon="timer"
        variant={
          state.sostenimiento.completado
            ? 'completed'
            : state.sostenimiento.iniciado
            ? 'active'
            : 'locked'
        }
      >
        <TimerBanner
          title="Sostenimiento Térmico (15 Minutos)"
          subtitle="Cuando se cumplan los 15 minutos se habilitará el enfriamiento a 45 °C."
          elapsedSeconds={
            state.sostenimiento.completado
              ? 900
              : sostenimientoTimer.elapsedSeconds
          }
          targetSeconds={900}
          isRunning={
            state.sostenimiento.iniciado && !state.sostenimiento.completado
          }
          isCompleted={state.sostenimiento.completado}
          actionButton={
            state.sostenimiento.iniciado && !state.sostenimiento.completado ? (
              <Button
                variant="secondary"
                size="sm"
                icon="done_all"
                onClick={handleCompletarSostenimiento}
              >
                Ya cumplió los 15 min
              </Button>
            ) : undefined
          }
        />
      </Card>

      {/* PASO 03: Enfriamiento a 45 °C */}
      <Card
        stepBadge="PASO 03"
        title="Enfriar la Leche hasta 45 °C"
        subtitle="Haz circular agua fría hasta que la leche baje a 45 °C para poder agregar el cultivo o separar sub-lotes."
        icon="ac_unit"
        variant={
          state.enfriamiento.enfriamientoCompletado
            ? 'completed'
            : state.enfriamiento.enfriamientoIniciado
            ? 'active'
            : 'locked'
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#e6decb]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737686] block mb-1">
                Temperatura Meta
              </span>
              <span className="text-2xl font-mono font-black text-[#191c1e]">
                45.0 °C
              </span>
            </div>

            <InputField
              label="Temperatura medida"
              type="number"
              step="0.1"
              unit="°C"
              inputSize="lg"
              disabled={!state.enfriamiento.enfriamientoIniciado}
              value={state.enfriamiento.temperaturaFinal}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChange((prev) => ({
                  ...prev,
                  enfriamiento: {
                    ...prev.enfriamiento,
                    temperaturaFinal: val,
                    esManual: true,
                  },
                }));
              }}
            />

            <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#e6decb]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737686] block mb-1">
                Tiempo Enfriando
              </span>
              <span className="text-2xl font-mono font-black text-[#004ac6]">
                {state.enfriamiento.enfriamientoCompletado
                  ? state.enfriamiento.tiempoEnfriamiento || 'Listo'
                  : state.enfriamiento.enfriamientoIniciado
                  ? enfriamientoTimer.humanElapsed
                  : '00:00'}
              </span>
            </div>
          </div>

          <ConfirmButton
            confirmed={state.enfriamiento.enfriamientoCompletado}
            onConfirm={handleLlego45}
            disabled={!state.enfriamiento.enfriamientoIniciado}
            disabledReason="Primero debe terminar el sostenimiento de 15 minutos."
            labelPending="¡La leche ya bajó a 45 °C!"
            subtitlePending="Toca aquí para iniciar el paso a cantinas y habilitar la división del lote"
            labelConfirmed={`Enfriada a ${state.enfriamiento.temperaturaFinal} °C (${state.enfriamiento.tiempoEnfriamiento || 'listo'})`}
            timestamp={state.enfriamiento.horaFinEnfriamiento || undefined}
            iconPending="ac_unit"
          />
        </div>
      </Card>

      {/* PASO 04: División Divergente del Lote Padre (Yogur / Kumis / Griego) */}
      <Card
        stepBadge="PASO 04 · PRODUCCIÓN DIVERGENTE"
        title="Dividir Leche del Lote Padre (Yogur, Kumis y Griego)"
        subtitle="Si de esta misma leche vas a sacar Kumis o Yogur Griego, anota aquí cuántos litros van para cada producto. Esto actualizará sus sub-lotes automáticamente."
        icon="call_split"
        variant={
          state.divisionLeche?.kumisDivisionConfirmada
            ? 'completed'
            : state.enfriamiento.enfriamientoCompletado
            ? 'active'
            : 'default'
        }
        headerRight={
          state.divisionLeche?.kumisDivisionConfirmada ? (
            <Badge variant="success" icon="check_circle">
              Lotes Hijos Actualizados
            </Badge>
          ) : (
            <Badge variant="info" icon="call_split">
              Opcional / Bifurcación
            </Badge>
          )
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField
              label="Litros para Yogur con Azúcar"
              type="number"
              unit="L"
              targetHint="Inocula a 42–45 °C"
              value={litrosYogurDulce}
              onChange={(e) => setLitrosYogurDulce(Number(e.target.value))}
            />

            <InputField
              label="Litros para Yogur Sin Azúcar"
              type="number"
              unit="L"
              targetHint="Natural"
              value={litrosYogurNatural}
              onChange={(e) => setLitrosYogurNatural(Number(e.target.value))}
            />

            <InputField
              label="Litros para Kumis"
              type="number"
              unit="L"
              targetHint="Enfriar a 30–35 °C"
              value={litrosKumis}
              onChange={(e) => setLitrosKumis(Number(e.target.value))}
            />

            <InputField
              label="Litros para Yogur Griego"
              type="number"
              unit="L"
              targetHint="Pasa a mallas"
              value={litrosGriego}
              onChange={(e) => setLitrosGriego(Number(e.target.value))}
            />
          </div>

          <ConfirmButton
            confirmed={Boolean(state.divisionLeche?.kumisDivisionConfirmada)}
            onConfirm={handleConfirmarDivisionLote}
            labelPending="Confirmar División hacia Lotes Hijos (Yogur, Kumis, Griego)"
            subtitlePending="Actualiza los litros en cada sub-lote y prende sus relojes independientes"
            labelConfirmed={`Lote dividido: Yogur (${
              (Number(litrosYogurDulce) || 0) +
              (Number(litrosYogurNatural) || 0)
            } L) · Kumis (${Number(litrosKumis) || 0} L) · Griego (${
              Number(litrosGriego) || 0
            } L)`}
            variantPending="primary"
            iconPending="call_split"
          />

          {/* Si se separó leche para Kumis, mostrar su enfriamiento adicional a 35 °C */}
          {(Number(litrosKumis) > 0 || state.incluyeKumis) &&
            state.divisionLeche?.kumisDivisionConfirmada && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-3">
                <TimerBanner
                  title={`Enfriando los ${litrosKumis} L de Kumis hasta 35 °C`}
                  subtitle="El Kumis necesita estar más fresco (30–35 °C) antes de ponerle su cultivo."
                  elapsedSeconds={kumis35Timer.elapsedSeconds}
                  isRunning={Boolean(
                    state.divisionLeche?.kumisEnfriando35 &&
                      !state.divisionLeche?.kumisLlego35
                  )}
                  isCompleted={Boolean(state.divisionLeche?.kumisLlego35)}
                />
                <ConfirmButton
                  confirmed={Boolean(state.divisionLeche?.kumisLlego35)}
                  onConfirm={handleKumisLlego35}
                  labelPending="¡La leche del Kumis ya llegó a 35 °C!"
                  labelConfirmed={`Leche de Kumis lista a 35 °C (${
                    state.divisionLeche?.kumisTiempoEnfriamiento35 || 'listo'
                  })`}
                  timestamp={state.divisionLeche?.kumisHora35 || undefined}
                  variantPending="amber"
                />
              </div>
            )}
        </div>
      </Card>

      {/* PASO 05: Trasiego a Cantinas */}
      <Card
        stepBadge="PASO 05"
        title="Pasar la Leche a Cantinas (Trasiego)"
        subtitle="Pasa la leche a 45 °C hacia las cantinas limpias donde vas a sembrar el cultivo de Yogur."
        icon="move_down"
        variant={
          state.trasiego.completado
            ? 'completed'
            : state.trasiego.iniciado
            ? 'active'
            : 'locked'
        }
      >
        <div className="space-y-4">
          <TimerBanner
            title="Tiempo de Trasiego a Cantinas"
            subtitle="Cantinas de acero inoxidable limpias y desinfectadas"
            elapsedSeconds={trasiegoTimer.elapsedSeconds}
            isRunning={state.trasiego.iniciado && !state.trasiego.completado}
            isCompleted={state.trasiego.completado}
          />

          <ConfirmButton
            confirmed={state.trasiego.completado}
            onConfirm={handleYaTrasegue}
            disabled={!state.trasiego.iniciado}
            disabledReason="Primero confirma en el Paso 03 que la leche bajó a 45 °C."
            labelPending="¡Ya trasegué la leche a las cantinas!"
            labelConfirmed={`Leche en cantinas (${
              state.trasiego.tiempoTrasiego || 'listo'
            })`}
            timestamp={state.trasiego.horaFin || undefined}
            variantPending="emerald"
          />
        </div>
      </Card>

      {/* Botón para avanzar a Etapa 2 */}
      <div className="flex justify-end pt-2">
        <Button
          variant="primary"
          size="xl"
          iconRight="arrow_forward"
          onClick={onNextStage}
        >
          Pasar a Etapa 2: Agregar Cultivo e Incubar
        </Button>
      </div>
    </div>
  );
};
