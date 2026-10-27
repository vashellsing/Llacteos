import React, { useState, useEffect, useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  InputField,
  SelectField,
  SelectOption,
  StageHeader,
  TimerBanner,
  PopoverTimePicker,
} from '../../../components/ui';
import { ProcessTimerState, SplitMilkAllocationInput } from '../../../types';
import {
  computeDurationBetweenTimes,
  formatHumanDuration,
  formatTimeFromStep1,
  getCurrentTimeString,
} from '../../../utils/timer';
import { useStageCountdown } from '../../../hooks/useStageCountdown';

export const LOTES_LECHE_OPTIONS: SelectOption[] = [
  { value: 'LE-2026-04A', label: 'LE-2026-04A (Hato El Porvenir - 1,200 L)' },
  { value: 'LE-2026-04B', label: 'LE-2026-04B (Hato La Pradera - 800 L)' },
  { value: 'LE-2026-YOG-01', label: 'LE-2026-YOG-01 (Hato San Martín - 500 L)' },
  { value: 'LE-2026-KUM-01', label: 'LE-2026-KUM-01 (Hato El Recuerdo - 400 L)' },
];

export const LOTES_CULTIVO_OPTIONS: SelectOption[] = [
  { value: 'CUL-2026-09A', label: 'CUL-2026-09A (Yogur Probiótico YF-L903)' },
  { value: 'CUL-2026-10B', label: 'CUL-2026-10B (Kumis Tradicional CH-N19)' },
  {
    value: 'CUL-2026-11C',
    label: 'CUL-2026-11C (Lactobacillus bulgaricus / S. thermophilus)',
  },
  {
    value: 'CUL-2026-12D',
    label: 'CUL-2026-12D (Lactococcus lactis / diacetylactis)',
  },
];

export const LOTES_AZUCAR_OPTIONS: SelectOption[] = [
  { value: 'AZU-2026-09', label: 'AZU-2026-09 (Ingenio Riopaila - Bulto 50 kg)' },
  { value: 'AZU-2026-10A', label: 'AZU-2026-10A (Ingenio Manuelita - Bulto 50 kg)' },
  { value: 'AZU-2026-11', label: 'AZU-2026-11 (Ingenio Providencia - Bulto 50 kg)' },
];

const ensureOption = (
  options: SelectOption[],
  val?: string | null
): SelectOption[] => {
  if (!val || !val.trim()) return options;
  if (options.some((o) => (typeof o === 'string' ? o === val : o.value === val))) {
    return options;
  }
  return [{ value: val, label: val }, ...options];
};

export interface PasteurizacionStageCommonProps {
  productName: string;
  defaultCultivoLote?: string;
  state: any;
  onChange: (updater: (prev: any) => any) => void;
  processTimer: ProcessTimerState;
  onStartProcessTimer: () => void;
  onNextStage: () => void;
  onOpenReviewModal?: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  onSplitParentBatch?: (input: SplitMilkAllocationInput) => void;
}

export const PasteurizacionStageCommon: React.FC<
  PasteurizacionStageCommonProps
> = ({
  productName,
  defaultCultivoLote = 'CUL-2026-09A',
  state,
  onChange,
  processTimer,
  onStartProcessTimer,
  onNextStage,
  showToast,
  onSplitParentBatch,
}) => {
  // Fórmula de planta: 3.2 kg por cada 40 L de leche fresca (80 g / L)
  const azucarSugeridoKg =
    state.litrosLeche > 0
      ? Number(((state.litrosLeche / 40) * 3.2).toFixed(2))
      : 0;

  // Estados de edición manual para cada paso
  const [manualAzucar, setManualAzucar] = useState<boolean>(false);
  const [manualPaso2, setManualPaso2] = useState<boolean>(false);
  const [manualPaso3, setManualPaso3] = useState<boolean>(false);
  const [manualPaso4, setManualPaso4] = useState<boolean>(false);
  const [manualPaso5, setManualPaso5] = useState<boolean>(false);

  // Estados temporales de hora para PopoverTimePicker
  const [horaManualAzucar, setHoraManualAzucar] = useState<string>(
    state.azucar?.horaAdicion || getCurrentTimeString()
  );
  const [horaManualPaso2, setHoraManualPaso2] = useState<string>(
    state.calentamiento?.horaFin ||
      state.calentamiento?.horaLlegada85a90 ||
      getCurrentTimeString()
  );
  const [horaManualPaso3, setHoraManualPaso3] = useState<string>(
    state.sostenimiento?.horaFin || getCurrentTimeString()
  );
  const [horaManualPaso4, setHoraManualPaso4] = useState<string>(
    state.enfriamiento?.horaFinEnfriamiento || getCurrentTimeString()
  );
  const [horaManualPaso5, setHoraManualPaso5] = useState<string>(
    state.trasiego?.horaFin || getCurrentTimeString()
  );

  // Sincronizaciones automáticas cuando no se está en modo manual
  useEffect(() => {
    if (!manualAzucar) {
      setHoraManualAzucar(state.azucar?.horaAdicion || getCurrentTimeString());
    }
  }, [manualAzucar, state.azucar?.horaAdicion]);

  useEffect(() => {
    if (!manualPaso2) {
      setHoraManualPaso2(
        state.calentamiento?.horaFin ||
          state.calentamiento?.horaLlegada85a90 ||
          getCurrentTimeString()
      );
    }
  }, [
    manualPaso2,
    state.calentamiento?.horaFin,
    state.calentamiento?.horaLlegada85a90,
  ]);

  useEffect(() => {
    if (!manualPaso3) {
      setHoraManualPaso3(state.sostenimiento?.horaFin || getCurrentTimeString());
    }
  }, [manualPaso3, state.sostenimiento?.horaFin]);

  useEffect(() => {
    if (!manualPaso4) {
      setHoraManualPaso4(
        state.enfriamiento?.horaFinEnfriamiento || getCurrentTimeString()
      );
    }
  }, [manualPaso4, state.enfriamiento?.horaFinEnfriamiento]);

  useEffect(() => {
    if (!manualPaso5) {
      setHoraManualPaso5(state.trasiego?.horaFin || getCurrentTimeString());
    }
  }, [manualPaso5, state.trasiego?.horaFin]);

  // Cronómetros en vivo
  const calentamientoTimer = useStageCountdown({
    startTimestamp: state.calentamiento?.timestampInicio,
    isRunning: Boolean(
      state.calentamiento?.iniciado && !state.calentamiento?.completado
    ),
    isCompleted: Boolean(state.calentamiento?.completado),
    completedDurationText: state.calentamiento?.tiempoCalentamiento,
  });

  const sostenimientoTimer = useStageCountdown({
    startTimestamp: state.sostenimiento?.timestampInicio,
    isRunning: Boolean(
      state.sostenimiento?.iniciado && !state.sostenimiento?.completado
    ),
    isCompleted: Boolean(state.sostenimiento?.completado),
    targetSeconds: (state.sostenimiento?.duracionMinutos || 15) * 60,
    completedDurationText: state.sostenimiento?.duracionReal,
  });

  const enfriamientoTimer = useStageCountdown({
    startTimestamp: state.enfriamiento?.timestampInicioEnfriamiento,
    isRunning: Boolean(
      state.enfriamiento?.enfriamientoIniciado &&
        !state.enfriamiento?.enfriamientoCompletado
    ),
    isCompleted: Boolean(state.enfriamiento?.enfriamientoCompletado),
    completedDurationText: state.enfriamiento?.tiempoEnfriamiento,
  });

  const trasiegoTimer = useStageCountdown({
    startTimestamp: state.trasiego?.timestampInicio,
    isRunning: Boolean(state.trasiego?.iniciado && !state.trasiego?.completado),
    isCompleted: Boolean(state.trasiego?.completado),
    completedDurationText: state.trasiego?.tiempoTrasiego,
  });

  // Duraciones recalculadas en tiempo real para modo manual
  const duracionCalentamientoRecalculada = useMemo(() => {
    if (!state.calentamiento?.horaInicio || !horaManualPaso2) {
      return state.calentamiento?.tiempoCalentamiento || '0 s';
    }
    return computeDurationBetweenTimes(
      state.calentamiento.horaInicio,
      horaManualPaso2
    ).human;
  }, [
    state.calentamiento?.horaInicio,
    horaManualPaso2,
    state.calentamiento?.tiempoCalentamiento,
  ]);

  const duracionRetencionRecalculada = useMemo(() => {
    const inicio =
      state.sostenimiento?.horaInicio || state.calentamiento?.horaFin;
    if (!inicio || !horaManualPaso3) {
      return state.sostenimiento?.duracionReal || '0 s';
    }
    return computeDurationBetweenTimes(inicio, horaManualPaso3).human;
  }, [
    state.sostenimiento?.horaInicio,
    state.calentamiento?.horaFin,
    horaManualPaso3,
    state.sostenimiento?.duracionReal,
  ]);

  const duracionEnfriamientoRecalculada = useMemo(() => {
    const inicio =
      state.enfriamiento?.horaInicio || state.sostenimiento?.horaFin;
    if (!inicio || !horaManualPaso4) {
      return state.enfriamiento?.tiempoEnfriamiento || '0 s';
    }
    return computeDurationBetweenTimes(inicio, horaManualPaso4).human;
  }, [
    state.enfriamiento?.horaInicio,
    state.sostenimiento?.horaFin,
    horaManualPaso4,
    state.enfriamiento?.tiempoEnfriamiento,
  ]);

  const duracionTrasiegoRecalculada = useMemo(() => {
    const inicio =
      state.trasiego?.horaInicio || state.enfriamiento?.horaFinEnfriamiento;
    if (!inicio || !horaManualPaso5) {
      return state.trasiego?.tiempoTrasiego || '0 s';
    }
    return computeDurationBetweenTimes(inicio, horaManualPaso5).human;
  }, [
    state.trasiego?.horaInicio,
    state.enfriamiento?.horaFinEnfriamiento,
    horaManualPaso5,
    state.trasiego?.tiempoTrasiego,
  ]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  // Paso 1: Iniciar calentamiento
  const handleStartCalentamiento = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();

    if (!processTimer.isRunning) {
      onStartProcessTimer();
    }

    onChange((prev: any) => ({
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
      `⏱ Calentamiento iniciado a las ${timeStr}. Cronómetro general del lote en marcha.`,
      'info'
    );
  };

  // Paso Condicional: Azúcar a 60 °C
  const handleConfirmAzucar = () => {
    const timeStr = getCurrentTimeString();
    const cantidadFinal = state.azucar?.esManual
      ? state.azucar.cantidadKg
      : azucarSugeridoKg;

    onChange((prev: any) => ({
      ...prev,
      loteAzucarPastur: prev.azucar?.loteAzucar || prev.loteAzucarPastur,
      azucar: {
        ...prev.azucar,
        adicionado: true,
        horaAdicion: timeStr,
        cantidadKg: cantidadFinal,
      },
    }));

    showToast(
      `✓ Azúcar agregada (${cantidadFinal} kg) a las ${timeStr}.`,
      'success'
    );
  };

  const handleSaveManualAzucar = () => {
    const timeStr = formatTimeFromStep1(horaManualAzucar);
    onChange((prev: any) => ({
      ...prev,
      azucar: {
        ...prev.azucar,
        adicionado: true,
        horaAdicion: timeStr,
      },
    }));
    setManualAzucar(false);
    showToast(
      `✓ Hora de adición de azúcar actualizada a las ${timeStr}.`,
      'success'
    );
  };

  // Paso 2: Llegó a 85 - 90 °C
  const handleLlego85a90 = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const durCalStr = state.calentamiento?.horaInicio
      ? computeDurationBetweenTimes(state.calentamiento.horaInicio, timeStr).human
      : formatHumanDuration(
          Math.max(
            1,
            Math.floor((now - (state.calentamiento?.timestampInicio || now)) / 1000)
          )
        );

    onChange((prev: any) => ({
      ...prev,
      calentamiento: {
        ...prev.calentamiento,
        completado: true,
        horaFin: timeStr,
        horaLlegada85a90: timeStr,
        tiempoCalentamiento: durCalStr,
        llego85a90: true,
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

    setHoraManualPaso2(timeStr);
    showToast(
      `✓ La leche llegó a 85–90 °C a las ${timeStr} (${durCalStr}). Inicia retención de 15 min.`,
      'success'
    );
  };

  const handleSaveManualPaso2 = () => {
    const timeStr = formatTimeFromStep1(horaManualPaso2);
    const durCalStr = state.calentamiento?.horaInicio
      ? computeDurationBetweenTimes(state.calentamiento.horaInicio, timeStr).human
      : state.calentamiento?.tiempoCalentamiento || '0 s';

    onChange((prev: any) => {
      const nuevoSostenimiento = {
        ...prev.sostenimiento,
        horaInicio: timeStr,
      };
      if (prev.sostenimiento?.completado && prev.sostenimiento?.horaFin) {
        nuevoSostenimiento.duracionReal = computeDurationBetweenTimes(
          timeStr,
          prev.sostenimiento.horaFin
        ).human;
      }
      return {
        ...prev,
        calentamiento: {
          ...prev.calentamiento,
          completado: true,
          horaFin: timeStr,
          horaLlegada85a90: timeStr,
          tiempoCalentamiento: durCalStr,
          llego85a90: true,
          esManual: true,
        },
        sostenimiento: nuevoSostenimiento,
      };
    });

    setManualPaso2(false);
    showToast(
      `✓ Hora de llegada a 85–90 °C actualizada a las ${timeStr} (${durCalStr}). Sincronizado.`,
      'success'
    );
  };

  // Paso 3: Fin de Retención (Min. 15 min)
  const handleTerminarRetencion = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const startSost =
      state.sostenimiento?.horaInicio || state.calentamiento?.horaFin;
    const durSostStr = startSost
      ? computeDurationBetweenTimes(startSost, timeStr).human
      : formatHumanDuration(
          Math.max(
            1,
            Math.floor((now - (state.sostenimiento?.timestampInicio || now)) / 1000)
          )
        );

    onChange((prev: any) => ({
      ...prev,
      sostenimiento: {
        ...prev.sostenimiento,
        completado: true,
        horaFin: timeStr,
        duracionReal: durSostStr,
      },
      enfriamiento: {
        ...prev.enfriamiento,
        enfriamientoIniciado: true,
        enfriamientoCompletado: false,
        horaInicio: timeStr,
        timestampInicioEnfriamiento: now,
      },
    }));

    setHoraManualPaso3(timeStr);
    showToast(
      `✓ Retención completada a las ${timeStr} (${durSostStr}). Inicia enfriamiento a 45 °C.`,
      'success'
    );
  };

  const handleSaveManualPaso3 = () => {
    const timeStr = formatTimeFromStep1(horaManualPaso3);
    const startSost =
      state.sostenimiento?.horaInicio || state.calentamiento?.horaFin;
    const durSostStr = startSost
      ? computeDurationBetweenTimes(startSost, timeStr).human
      : state.sostenimiento?.duracionReal || '0 s';

    onChange((prev: any) => {
      const nuevoEnfriamiento = {
        ...prev.enfriamiento,
        horaInicio: timeStr,
      };
      if (
        prev.enfriamiento?.enfriamientoCompletado &&
        prev.enfriamiento?.horaFinEnfriamiento
      ) {
        nuevoEnfriamiento.tiempoEnfriamiento = computeDurationBetweenTimes(
          timeStr,
          prev.enfriamiento.horaFinEnfriamiento
        ).human;
      }
      return {
        ...prev,
        sostenimiento: {
          ...prev.sostenimiento,
          completado: true,
          horaFin: timeStr,
          duracionReal: durSostStr,
        },
        enfriamiento: nuevoEnfriamiento,
      };
    });

    setManualPaso3(false);
    showToast(
      `✓ Fin de retención actualizado a las ${timeStr} (${durSostStr}). Sincronizado.`,
      'success'
    );
  };

  // Paso 4: Enfriamiento a 45 °C
  const handleLlego45 = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const startEnf =
      state.enfriamiento?.horaInicio || state.sostenimiento?.horaFin;
    const durEnfStr = startEnf
      ? computeDurationBetweenTimes(startEnf, timeStr).human
      : formatHumanDuration(
          Math.max(
            1,
            Math.floor(
              (now -
                (state.enfriamiento?.timestampInicioEnfriamiento || now)) /
                1000
            )
          )
        );

    onChange((prev: any) => ({
      ...prev,
      enfriamiento: {
        ...prev.enfriamiento,
        enfriamientoCompletado: true,
        horaFinEnfriamiento: timeStr,
        tiempoEnfriamiento: durEnfStr,
        temperaturaFinal: 45.0,
      },
      trasiego: {
        ...prev.trasiego,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
        timestampInicio: now,
      },
    }));

    setHoraManualPaso4(timeStr);
    showToast(
      `✓ Leche enfriada a 45 °C a las ${timeStr} (${durEnfStr}). Inicia traslado a cantinas.`,
      'success'
    );
  };

  const handleSaveManualPaso4 = () => {
    const timeStr = formatTimeFromStep1(horaManualPaso4);
    const startEnf =
      state.enfriamiento?.horaInicio || state.sostenimiento?.horaFin;
    const durEnfStr = startEnf
      ? computeDurationBetweenTimes(startEnf, timeStr).human
      : state.enfriamiento?.tiempoEnfriamiento || '0 s';

    onChange((prev: any) => {
      const nuevoTrasiego = {
        ...prev.trasiego,
        horaInicio: timeStr,
      };
      if (prev.trasiego?.completado && prev.trasiego?.horaFin) {
        nuevoTrasiego.tiempoTrasiego = computeDurationBetweenTimes(
          timeStr,
          prev.trasiego.horaFin
        ).human;
      }
      return {
        ...prev,
        enfriamiento: {
          ...prev.enfriamiento,
          enfriamientoCompletado: true,
          horaFinEnfriamiento: timeStr,
          tiempoEnfriamiento: durEnfStr,
          temperaturaFinal: 45.0,
          esManual: true,
        },
        trasiego: nuevoTrasiego,
      };
    });

    setManualPaso4(false);
    showToast(
      `✓ Hora de enfriamiento a 45 °C actualizada a las ${timeStr} (${durEnfStr}). Sincronizado.`,
      'success'
    );
  };

  // Paso 5: Traslado a cantinas
  const handleYaTrasegue = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const startTras =
      state.trasiego?.horaInicio || state.enfriamiento?.horaFinEnfriamiento;
    const durTrasStr = startTras
      ? computeDurationBetweenTimes(startTras, timeStr).human
      : formatHumanDuration(
          Math.max(
            1,
            Math.floor((now - (state.trasiego?.timestampInicio || now)) / 1000)
          )
        );

    onChange((prev: any) => ({
      ...prev,
      trasiego: {
        ...prev.trasiego,
        completado: true,
        horaFin: timeStr,
        tiempoTrasiego: durTrasStr,
      },
    }));

    setHoraManualPaso5(timeStr);
    showToast(
      `✓ Leche trasladada a cantinas a las ${timeStr} (${durTrasStr}). Pasteurización finalizada.`,
      'success'
    );
  };

  const handleSaveManualPaso5 = () => {
    const timeStr = formatTimeFromStep1(horaManualPaso5);
    const startTras =
      state.trasiego?.horaInicio || state.enfriamiento?.horaFinEnfriamiento;
    const durTrasStr = startTras
      ? computeDurationBetweenTimes(startTras, timeStr).human
      : state.trasiego?.tiempoTrasiego || '0 s';

    onChange((prev: any) => ({
      ...prev,
      trasiego: {
        ...prev.trasiego,
        completado: true,
        horaFin: timeStr,
        tiempoTrasiego: durTrasStr,
      },
    }));

    setManualPaso5(false);
    showToast(
      `✓ Hora de traslado actualizada a las ${timeStr} (${durTrasStr}).`,
      'success'
    );
  };

  const isCompletedStage = Boolean(state.trasiego?.completado);

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-6 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-12">
      <StageHeader
        stageNumber={1}
        totalStages={4}
        title={`Pasteurización (${productName})`}
        subtitle="Control térmico inquebrantable: Calentamiento a 85–90 °C, retención de 15 min, enfriamiento a 45 °C y traslado a cantinas."
        productName={productName}
        icon="local_fire_department"
        isCompleted={isCompletedStage}
        startTime={state.calentamiento?.horaInicio || undefined}
        endTime={state.trasiego?.horaFin || undefined}
        rightContent={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 min-h-[48px]">
              <span className="material-symbols-outlined text-blue-700 text-[22px]">
                water_drop
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase text-blue-800">
                  LECHE EN TANQUE
                </div>
                <div className="text-xs font-black font-mono text-blue-950">
                  {state.litrosLeche || 0} L
                </div>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 min-h-[48px]">
              <span className="material-symbols-outlined text-amber-700 text-[22px]">
                cookie
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase text-amber-800">
                  FORMULACIÓN
                </div>
                <div className="text-xs font-black font-mono text-amber-950">
                  {state.llevaAzucar ? 'Con Azúcar' : 'Sin Azúcar'}
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* =========================================================================
          1. INSUMOS INICIALES
      ========================================================================= */}
      <Card
        title="Insumos Iniciales de Pasteurización"
        subtitle="Registra los litros de leche fresca, los lotes de materia prima y selecciona si este lote lleva azúcar."
        icon="inventory_2"
        badge={
          state.llevaAzucar
            ? 'Formulación: Con Azúcar (3.2 kg / 40 L)'
            : 'Formulación: Sin Azúcar (Natural)'
        }
        variant="default"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Litros de leche fresca */}
            <InputField
              label="Litros de Leche Fresca"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              unit="L"
              icon="water_drop"
              placeholder="Ej: 100"
              showZero={false}
              value={state.litrosLeche > 0 ? state.litrosLeche : ''}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                const nuevoAzucarKg = Number(((val / 40) * 3.2).toFixed(2));
                onChange((prev: any) => ({
                  ...prev,
                  litrosLeche: val,
                  azucar: {
                    ...prev.azucar,
                    cantidadKg: prev.azucar?.esManual
                      ? prev.azucar.cantidadKg
                      : nuevoAzucarKg,
                  },
                }));
              }}
            />

            {/* Lote de leche fresca */}
            <SelectField
              label="Lote de Leche Fresca"
              icon="local_shipping"
              options={ensureOption(LOTES_LECHE_OPTIONS, state.loteLeche)}
              value={state.loteLeche || ''}
              onChange={(e) => {
                const val = e.target.value;
                onChange((prev: any) => ({ ...prev, loteLeche: val }));
              }}
            />

            {/* Lote de Cultivo Láctico */}
            <SelectField
              label="Lote de Cultivo Láctico"
              icon="biotech"
              options={ensureOption(
                LOTES_CULTIVO_OPTIONS,
                state.loteCultivoLacticoPastur || defaultCultivoLote
              )}
              value={state.loteCultivoLacticoPastur || defaultCultivoLote}
              onChange={(e) => {
                const val = e.target.value;
                onChange((prev: any) => ({
                  ...prev,
                  loteCultivoLacticoPastur: val,
                  loteCultivoLactico: val,
                }));
              }}
            />
          </div>

          {/* Selector condicional: ¿Lleva azúcar? */}
          <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#e6decb] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-extrabold text-gray-900">
                ¿Este lote de leche se pasteuriza con azúcar?
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                Fórmula de planta:{' '}
                <strong>3.2 kg de azúcar por cada 40 L de leche fresca</strong>{' '}
                (Para {state.litrosLeche || 0} L corresponden{' '}
                <strong className="text-amber-900 font-mono">
                  {azucarSugeridoKg} kg
                </strong>
                ).
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant={state.llevaAzucar ? 'primary' : 'outline'}
                size="md"
                icon="check"
                onClick={() =>
                  onChange((prev: any) => ({ ...prev, llevaAzucar: true }))
                }
              >
                Sí, con azúcar
              </Button>
              <Button
                variant={!state.llevaAzucar ? 'primary' : 'outline'}
                size="md"
                icon="close"
                onClick={() =>
                  onChange((prev: any) => ({ ...prev, llevaAzucar: false }))
                }
              >
                No (Sin azúcar)
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* =========================================================================
          2. PASO 1: CALENTAMIENTO DE LA LECHE (CRONÓMETRO GENERAL DEL LOTE)
      ========================================================================= */}
      <Card
        title="Calentando la leche (Objetivo: 85 - 90 °C)"
        subtitle="Prende la caldera o tina. Este paso marca el arranque del cronómetro general del lote."
        icon="local_fire_department"
        badge={
          state.calentamiento?.completado
            ? `✓ Calentamiento: ${
                state.calentamiento?.tiempoCalentamiento || 'Finalizado'
              }`
            : state.calentamiento?.iniciado
            ? 'En calentamiento...'
            : 'Pendiente inicio'
        }
        variant={
          state.calentamiento?.completado
            ? 'success'
            : state.calentamiento?.iniciado
            ? 'warning'
            : 'default'
        }
      >
        <div className="space-y-4">
          {!state.calentamiento?.iniciado ? (
            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-extrabold text-gray-900">
                  Listo para iniciar el calentamiento
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Al pulsar el botón se inicia el cronómetro general del lote y
                  el reloj de calentamiento hacia 85–90 °C.
                </p>
              </div>
              <Button
                variant="primary"
                size="xl"
                icon="local_fire_department"
                onClick={handleStartCalentamiento}
              >
                Iniciar Calentamiento de la Leche
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#e6decb] flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-500">
                  TEMPERATURA OBJETIVO
                </span>
                <span className="text-2xl font-black font-mono text-gray-900 mt-1">
                  85.0 – 90.0 °C
                </span>
                <span className="text-[11px] text-gray-500">
                  Rango de pasteurización reglamentario
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#e6decb] flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-500">
                  HORA DE INICIO
                </span>
                <span className="text-2xl font-black font-mono text-amber-900 mt-1">
                  {state.calentamiento?.horaInicio || '--:--:--'}
                </span>
                <span className="text-[11px] text-gray-500">
                  Arranque del cronómetro general
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-800">
                  CRONÓMETRO DE CALENTAMIENTO
                </span>
                <span className="text-2xl font-black font-mono text-amber-950 mt-1">
                  {state.calentamiento?.completado
                    ? state.calentamiento?.tiempoCalentamiento || 'Completado'
                    : calentamientoTimer.humanElapsed}
                </span>
                <span className="text-[11px] text-amber-800 font-medium">
                  {state.calentamiento?.completado
                    ? 'Duración registrada en Paso 2'
                    : 'Corriendo en vivo hacia 85–90 °C...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* =========================================================================
          3. PASO CONDICIONAL: ADICIÓN DE AZÚCAR A LOS 60 °C (SOLO SI LLEVA AZÚCAR)
      ========================================================================= */}
      {state.llevaAzucar && (
        <Card
          title="¡Agregué el azúcar a los 60 °C!"
          subtitle="Cuando la leche alcance los 60 °C durante el calentamiento, agrega el azúcar pesada y disuélvela."
          icon="cookie"
          badge={
            state.azucar?.adicionado
              ? `✓ Agregada a las ${state.azucar?.horaAdicion}`
              : 'Pendiente a los 60 °C'
          }
          variant={state.azucar?.adicionado ? 'success' : 'default'}
          headerRight={
            state.azucar?.adicionado ? (
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-2xs hover:border-amber-400 transition-all">
                <input
                  type="checkbox"
                  checked={manualAzucar}
                  onChange={(e) => setManualAzucar(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>Habilitar edición manual</span>
              </label>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cantidad de azúcar */}
              <InputField
                label="Cantidad de Azúcar (kg)"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                unit="kg"
                placeholder={`Sugerido: ${azucarSugeridoKg} kg`}
                showZero={false}
                value={
                  state.azucar?.cantidadKg > 0 ? state.azucar.cantidadKg : ''
                }
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  onChange((prev: any) => ({
                    ...prev,
                    azucar: {
                      ...prev.azucar,
                      cantidadKg: val,
                      esManual: true,
                    },
                  }));
                }}
              />

              {/* Lote del azúcar */}
              <SelectField
                label="Lote de Azúcar"
                icon="qr_code"
                options={ensureOption(
                  LOTES_AZUCAR_OPTIONS,
                  state.azucar?.loteAzucar || state.loteAzucarPastur
                )}
                value={state.azucar?.loteAzucar || state.loteAzucarPastur || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange((prev: any) => ({
                    ...prev,
                    loteAzucarPastur: val,
                    azucar: { ...prev.azucar, loteAzucar: val },
                  }));
                }}
              />
            </div>

            {/* Acciones / Edición manual */}
            {!manualAzucar ? (
              !state.azucar?.adicionado ? (
                <div className="pt-2">
                  <Button
                    variant="warning"
                    size="lg"
                    icon="verified"
                    onClick={handleConfirmAzucar}
                    disabled={!state.calentamiento?.iniciado}
                  >
                    ¡Agregué el azúcar a los 60 °C!
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                      check_circle
                    </span>
                    <span className="font-bold text-emerald-950">
                      Azúcar agregada: {state.azucar?.cantidadKg} kg a las{' '}
                      {state.azucar?.horaAdicion} (Lote: {state.azucar?.loteAzucar})
                    </span>
                  </div>
                  <Badge variant="success" size="sm">
                    Registrado
                  </Badge>
                </div>
              )
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  <PopoverTimePicker
                    label="Hora de Adición de Azúcar"
                    icon="schedule"
                    hint="Toca para desplegar el selector flotante (hh:mm:ss)"
                    value={horaManualAzucar}
                    onChange={setHoraManualAzucar}
                  />

                  <div className="p-3 rounded-xl bg-white border border-[#e6decb] flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-gray-500">
                      CANTIDAD REGISTRADA
                    </span>
                    <span className="text-xl font-mono font-black text-amber-900 mt-1">
                      {state.azucar?.cantidadKg || azucarSugeridoKg} kg
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Lote: {state.azucar?.loteAzucar || 'Sin registrar'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    icon="save"
                    onClick={handleSaveManualAzucar}
                  >
                    Guardar Hora de Azúcar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* =========================================================================
          4. PASO 2: LLEGADA A TEMPERATURA OBJETIVO (85 - 90 °C)
      ========================================================================= */}
      <Card
        title="¡La leche llegó a 85 - 90 °C!"
        subtitle="Al confirmar, detiene el calentamiento, calcula la duración (solo lectura) e inicia la retención."
        icon="thermostat"
        badge={
          state.calentamiento?.completado
            ? `✓ Llegó a las ${
                state.calentamiento?.horaFin ||
                state.calentamiento?.horaLlegada85a90
              }`
            : 'En espera de 85–90 °C'
        }
        variant={state.calentamiento?.completado ? 'success' : 'default'}
        headerRight={
          state.calentamiento?.completado ? (
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-2xs hover:border-amber-400 transition-all">
              <input
                type="checkbox"
                checked={manualPaso2}
                onChange={(e) => setManualPaso2(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>Habilitar edición manual</span>
            </label>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {!manualPaso2 ? (
            !state.calentamiento?.completado ? (
              <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#e6decb] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-extrabold text-gray-900">
                    Confirmación de Temperatura de Pasteurización
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Al confirmar se detendrá el cronómetro del Paso 1 e iniciará
                    inmediatamente la retención de 15 minutos.
                  </p>
                </div>
                <Button
                  variant="success"
                  size="xl"
                  icon="thermostat"
                  onClick={handleLlego85a90}
                  disabled={!state.calentamiento?.iniciado}
                >
                  ¡La leche llegó a 85 - 90 °C!
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#e6decb]">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    HORA DE INICIO
                  </span>
                  <span className="text-xl font-mono font-black text-gray-900 mt-1 block">
                    {state.calentamiento?.horaInicio}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e6decb]">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    HORA DE LLEGADA (85–90 °C)
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-900 mt-1 block">
                    {state.calentamiento?.horaFin ||
                      state.calentamiento?.horaLlegada85a90}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    TIEMPO DE CALENTAMIENTO (SOLO LECTURA)
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-950 mt-1 block">
                    {state.calentamiento?.tiempoCalentamiento}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                <PopoverTimePicker
                  label="Hora de Llegada a 85–90 °C"
                  icon="schedule"
                  hint="Toca para desplegar el selector flotante (hh:mm:ss)"
                  value={horaManualPaso2}
                  onChange={setHoraManualPaso2}
                />

                <InputField
                  label="Tiempo de Calentamiento (Solo Lectura)"
                  icon="timer"
                  type="text"
                  disabled
                  readOnly
                  placeholder="Se calcula automáticamente"
                  hint={`Calculado: ${state.calentamiento?.horaInicio} → ${horaManualPaso2}`}
                  value={duracionCalentamientoRecalculada}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon="save"
                  onClick={handleSaveManualPaso2}
                >
                  Guardar Hora de Llegada
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* =========================================================================
          5. PASO 3: RETENCIÓN DE TEMPERATURA (MIN. 15 MIN)
      ========================================================================= */}
      <Card
        title="Terminó el tiempo de retención (Min. 15 min)"
        subtitle="El cronómetro de retención arranca tras el Paso 2. Al confirmar, bloquea la duración e inicia enfriamiento."
        icon="timer"
        badge={
          state.sostenimiento?.completado
            ? `✓ Retención: ${state.sostenimiento?.duracionReal || 'Listo'}`
            : state.sostenimiento?.iniciado
            ? 'Retención en curso (Min. 15 min)'
            : 'En espera del Paso 2'
        }
        variant={
          state.sostenimiento?.completado
            ? 'success'
            : state.sostenimiento?.iniciado
            ? 'warning'
            : 'locked'
        }
        headerRight={
          state.sostenimiento?.completado ? (
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-2xs hover:border-amber-400 transition-all">
              <input
                type="checkbox"
                checked={manualPaso3}
                onChange={(e) => setManualPaso3(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>Habilitar edición manual</span>
            </label>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <TimerBanner
            title="Retención Térmica a 85–90 °C"
            subtitle="Garantiza la pasteurización completa de la leche antes de enfriar a 45 °C."
            elapsedSeconds={
              state.sostenimiento?.completado
                ? 900
                : sostenimientoTimer.elapsedSeconds
            }
            targetSeconds={900}
            isRunning={Boolean(
              state.sostenimiento?.iniciado && !state.sostenimiento?.completado
            )}
            isCompleted={Boolean(state.sostenimiento?.completado)}
          />

          {!manualPaso3 ? (
            !state.sostenimiento?.completado ? (
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="xl"
                  icon="timer"
                  onClick={handleTerminarRetencion}
                  disabled={!state.sostenimiento?.iniciado}
                >
                  Terminó el tiempo de retención (Min. 15 min)
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#e6decb]">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    INICIO DE RETENCIÓN
                  </span>
                  <span className="text-xl font-mono font-black text-gray-900 mt-1 block">
                    {state.sostenimiento?.horaInicio}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e6decb]">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    FIN DE RETENCIÓN
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-900 mt-1 block">
                    {state.sostenimiento?.horaFin}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    DURACIÓN REAL DE RETENCIÓN (SOLO LECTURA)
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-950 mt-1 block">
                    {state.sostenimiento?.duracionReal}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                <PopoverTimePicker
                  label="Hora de Fin de Retención"
                  icon="schedule"
                  hint="Toca para desplegar el selector flotante (hh:mm:ss)"
                  value={horaManualPaso3}
                  onChange={setHoraManualPaso3}
                />

                <InputField
                  label="Duración de Retención (Solo Lectura)"
                  icon="timer"
                  type="text"
                  disabled
                  readOnly
                  placeholder="Se calcula automáticamente"
                  hint={`Calculado: ${state.sostenimiento?.horaInicio} → ${horaManualPaso3}`}
                  value={duracionRetencionRecalculada}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon="save"
                  onClick={handleSaveManualPaso3}
                >
                  Guardar Fin de Retención
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* =========================================================================
          6. PASO 4: ENFRIAMIENTO (A 45 °C)
      ========================================================================= */}
      <Card
        title="¡La leche se enfrió a 45 °C!"
        subtitle="Mide el tiempo desde el fin de la retención. Al confirmar, calcula la duración e inicia el reloj de traslado."
        icon="ac_unit"
        badge={
          state.enfriamiento?.enfriamientoCompletado
            ? `✓ Enfriada: ${
                state.enfriamiento?.tiempoEnfriamiento || 'Listo'
              }`
            : state.enfriamiento?.enfriamientoIniciado
            ? 'Enfriando a 45 °C...'
            : 'En espera del Paso 3'
        }
        variant={
          state.enfriamiento?.enfriamientoCompletado
            ? 'success'
            : state.enfriamiento?.enfriamientoIniciado
            ? 'info'
            : 'locked'
        }
        headerRight={
          state.enfriamiento?.enfriamientoCompletado ? (
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-2xs hover:border-amber-400 transition-all">
              <input
                type="checkbox"
                checked={manualPaso4}
                onChange={(e) => setManualPaso4(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>Habilitar edición manual</span>
            </label>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[#e6decb]">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                TEMPERATURA OBJETIVO DE ENFRIAMIENTO
              </span>
              <span className="text-2xl font-black font-mono text-blue-900 mt-1 block">
                45.0 °C
              </span>
              <span className="text-[11px] text-gray-500">
                Temperatura óptima para la siembra del cultivo
              </span>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">
                CRONÓMETRO DE ENFRIAMIENTO
              </span>
              <span className="text-2xl font-black font-mono text-blue-950 mt-1 block">
                {state.enfriamiento?.enfriamientoCompletado
                  ? state.enfriamiento?.tiempoEnfriamiento || 'Listo'
                  : enfriamientoTimer.humanElapsed}
              </span>
              <span className="text-[11px] text-blue-800 font-medium">
                {state.enfriamiento?.enfriamientoCompletado
                  ? 'Enfriamiento finalizado'
                  : 'Circulando agua fría por la chaqueta...'}
              </span>
            </div>
          </div>

          {!manualPaso4 ? (
            !state.enfriamiento?.enfriamientoCompletado ? (
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="xl"
                  icon="ac_unit"
                  onClick={handleLlego45}
                  disabled={!state.enfriamiento?.enfriamientoIniciado}
                  className="bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold shadow-md shadow-blue-600/20"
                >
                  ¡La leche se enfrió a 45 °C!
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#e6decb]">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    INICIO ENFRIAMIENTO
                  </span>
                  <span className="text-xl font-mono font-black text-gray-900 mt-1 block">
                    {state.enfriamiento?.horaInicio}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e6decb]">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    LLEGADA A 45 °C
                  </span>
                  <span className="text-xl font-mono font-black text-blue-900 mt-1 block">
                    {state.enfriamiento?.horaFinEnfriamiento}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-300">
                  <span className="text-[10px] uppercase font-bold text-blue-800 block">
                    TIEMPO DE ENFRIAMIENTO (SOLO LECTURA)
                  </span>
                  <span className="text-xl font-mono font-black text-blue-950 mt-1 block">
                    {state.enfriamiento?.tiempoEnfriamiento}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                <PopoverTimePicker
                  label="Hora de Llegada a 45 °C"
                  icon="schedule"
                  hint="Toca para desplegar el selector flotante (hh:mm:ss)"
                  value={horaManualPaso4}
                  onChange={setHoraManualPaso4}
                />

                <InputField
                  label="Tiempo de Enfriamiento (Solo Lectura)"
                  icon="timer"
                  type="text"
                  disabled
                  readOnly
                  placeholder="Se calcula automáticamente"
                  hint={`Calculado: ${state.enfriamiento?.horaInicio} → ${horaManualPaso4}`}
                  value={duracionEnfriamientoRecalculada}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon="save"
                  onClick={handleSaveManualPaso4}
                >
                  Guardar Hora de Enfriamiento
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* =========================================================================
          7. PASO 5: TRASLADO A CANTINAS
      ========================================================================= */}
      <Card
        title="¡Leche trasladada a cantinas!"
        subtitle="Calcula el tiempo desde que la leche llegó a 45 °C hasta que se pasó a las cantinas limpias."
        icon="inventory_2"
        badge={
          state.trasiego?.completado
            ? `✓ Traslado: ${state.trasiego?.tiempoTrasiego || 'Listo'}`
            : state.trasiego?.iniciado
            ? 'Trasladando a cantinas...'
            : 'En espera del Paso 4'
        }
        variant={
          state.trasiego?.completado
            ? 'success'
            : state.trasiego?.iniciado
            ? 'warning'
            : 'locked'
        }
        headerRight={
          state.trasiego?.completado ? (
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-2xs hover:border-amber-400 transition-all">
              <input
                type="checkbox"
                checked={manualPaso5}
                onChange={(e) => setManualPaso5(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>Habilitar edición manual</span>
            </label>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-[#e6decb] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                DESTINO DEL TRASIEGO
              </span>
              <span className="text-base font-extrabold text-gray-900 mt-0.5 block">
                Cantinas de acero inoxidable limpias y desinfectadas
              </span>
              <span className="text-xs text-gray-500">
                La leche está a 45 °C, lista para recibir el cultivo e incubar.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 shrink-0">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">
                TIEMPO EN TRASLADO
              </span>
              <span className="text-xl font-mono font-black text-amber-950 block">
                {state.trasiego?.completado
                  ? state.trasiego?.tiempoTrasiego || 'Listo'
                  : trasiegoTimer.humanElapsed}
              </span>
            </div>
          </div>

          {!manualPaso5 ? (
            !state.trasiego?.completado ? (
              <div className="pt-2">
                <Button
                  variant="success"
                  size="xl"
                  icon="check_circle"
                  onClick={handleYaTrasegue}
                  disabled={!state.trasiego?.iniciado}
                >
                  ¡Leche trasladada a cantinas!
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#e6decb]">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    INICIO DE TRASLADO
                  </span>
                  <span className="text-xl font-mono font-black text-gray-900 mt-1 block">
                    {state.trasiego?.horaInicio}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e6decb]">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    FIN DE TRASLADO
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-900 mt-1 block">
                    {state.trasiego?.horaFin}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    TIEMPO DE TRASLADO (SOLO LECTURA)
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-950 mt-1 block">
                    {state.trasiego?.tiempoTrasiego}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                <PopoverTimePicker
                  label="Hora de Fin de Traslado"
                  icon="schedule"
                  hint="Toca para desplegar el selector flotante (hh:mm:ss)"
                  value={horaManualPaso5}
                  onChange={setHoraManualPaso5}
                />

                <InputField
                  label="Tiempo de Traslado (Solo Lectura)"
                  icon="timer"
                  type="text"
                  disabled
                  readOnly
                  placeholder="Se calcula automáticamente"
                  hint={`Calculado: ${state.trasiego?.horaInicio} → ${horaManualPaso5}`}
                  value={duracionTrasiegoRecalculada}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon="save"
                  onClick={handleSaveManualPaso5}
                >
                  Guardar Hora de Traslado
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* =========================================================================
          PIE DE PÁGINA (FOOTER ESTANDARIZADO: AVANCE A ETAPA 2)
      ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white border border-[#e6decb] shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[32px]">
              task_alt
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={isCompletedStage ? 'success' : 'warning'}
                size="sm"
              >
                {isCompletedStage
                  ? '✓ Pasteurización Finalizada'
                  : 'Etapa 1: Pasteurización'}
              </Badge>
              <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200">
                Tiempo de Pasteurización:{' '}
                {state.trasiego?.horaFin && state.calentamiento?.horaInicio
                  ? computeDurationBetweenTimes(
                      state.calentamiento.horaInicio,
                      state.trasiego.horaFin
                    ).human
                  : calentamientoTimer.humanElapsed || '00:00:00'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
              {productName} · Cierre de Pasteurización
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Leche lista a 45 °C en cantinas · Pasa a la siembra del cultivo
              láctico.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          <Button
            variant="primary"
            size="xl"
            iconRight="arrow_forward"
            disabled={!state.trasiego?.completado}
            onClick={onNextStage}
          >
            Pasar a Etapa 2: Inoculación e Incubación
          </Button>
        </div>
      </div>
    </div>
  );
};
