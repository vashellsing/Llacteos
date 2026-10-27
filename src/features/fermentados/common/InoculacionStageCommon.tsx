import React, { useEffect, useState, useMemo } from 'react';
import {
  StageHeader,
  Card,
  InputField,
  ConfirmButton,
  TimerBanner,
  PopoverTimePicker,
  Button,
} from '../../../components/ui';
import { ProcessTimerState } from '../../../types';
import { InoculacionYogurState } from '../../../types/yogur';
import { InoculacionKumisState } from '../../../types/kumis';
import {
  computeDurationBetweenTimes,
  formatHumanDuration,
  getCurrentTimeString,
} from '../../../utils/timer';
import { useStageCountdown } from '../../../hooks/useStageCountdown';

export interface InoculacionStageCommonProps {
  productType: 'yogur' | 'kumis';
  state: InoculacionYogurState | InoculacionKumisState;
  onChange: (
    updater: (
      prev: InoculacionYogurState | InoculacionKumisState
    ) => InoculacionYogurState | InoculacionKumisState
  ) => void;
  horaLlegadaTemp?: string | null;
  litrosLecheBase?: number;
  loteCultivoBase?: string;
  processTimer: ProcessTimerState;
  onGoToBatidoYSabores: () => void;
  onNextStage?: () => void;
  onOpenReviewModal?: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const InoculacionStageCommon: React.FC<InoculacionStageCommonProps> = ({
  productType,
  state,
  onChange,
  horaLlegadaTemp,
  litrosLecheBase = 100,
  loteCultivoBase,
  processTimer,
  onGoToBatidoYSabores,
  onNextStage,
  showToast,
}) => {
  const isYogur = productType === 'yogur';
  const targetHoras = isYogur ? 8 : 12;
  const defaultCultureLote = isYogur ? 'CULT-PROB-2026-04' : 'CULT-KUM-2026-02';
  const defaultCultureName = isYogur
    ? 'Cultivo Probiótico (L. bulgaricus, S. thermophilus, B. lactis)'
    : 'Cultivo de Kumis (L. lactis subsp. lactis, biovar diacetylactis)';

  // Lote de cultivo heredado de la etapa anterior (Pasteurización)
  const loteCultivoEfectivo =
    loteCultivoBase || (state as any).loteCultivoLactico || state.loteCultivo || defaultCultureLote;

  // Dosis de cultivo sugerida: estrictamente (litros / 40)
  const dosisCalculada = useMemo(() => {
    const litros = Number(litrosLecheBase) || 0;
    return litros > 0 ? Number((litros / 40).toFixed(2)) : 0;
  }, [litrosLecheBase]);

  // Sincronizar dosis calculada y lote heredado de cultivo si no ha sido confirmada la siembra
  useEffect(() => {
    if (!state.inoculacionConfirmada) {
      const current = state.cantidadCultivoCucharadas;
      const shouldUpdateDosis =
        !current || current === 0 || (current === 2.5 && litrosLecheBase !== 100);
      const shouldUpdateLote =
        Boolean(loteCultivoEfectivo) && state.loteCultivo !== loteCultivoEfectivo;

      if ((shouldUpdateDosis && dosisCalculada > 0) || shouldUpdateLote) {
        onChange((prev: any) => ({
          ...prev,
          ...(shouldUpdateDosis && dosisCalculada > 0
            ? {
                cantidadCultivoCucharadas: dosisCalculada,
                cantidadCultivoGramos: dosisCalculada,
              }
            : {}),
          loteCultivo: loteCultivoEfectivo,
        }));
      }
    }
  }, [dosisCalculada, litrosLecheBase, state.inoculacionConfirmada, state.cantidadCultivoCucharadas, loteCultivoEfectivo, state.loteCultivo, onChange]);

  // Si no hay hora de inicio de mezclado pero llegó a la temperatura o el cronómetro general está activo
  useEffect(() => {
    if (!state.horaInicioMezclado) {
      const initialStart = horaLlegadaTemp || getCurrentTimeString();
      onChange((prev: any) => ({
        ...prev,
        horaInicioMezclado: prev.horaInicioMezclado || initialStart,
      }));
    }
  }, [horaLlegadaTemp, state.horaInicioMezclado, onChange]);

  // Auto-iniciar la incubación si ya se inoculó o si el cronómetro estaba marcado como iniciado
  useEffect(() => {
    if (state.inoculacionConfirmada && !state.incubacion.iniciada && !state.incubacion.completada) {
      const now = Date.now();
      const startTime = state.horaInoculacion || getCurrentTimeString();
      onChange((prev: any) => ({
        ...prev,
        incubacion: {
          ...prev.incubacion,
          iniciada: true,
          horaInicio: prev.incubacion.horaInicio || startTime,
          timestampInicio: prev.incubacion.timestampInicio || now,
          duracionObjetivoHoras: targetHoras,
        },
      }));
    }
  }, [state.inoculacionConfirmada, state.incubacion.iniciada, state.incubacion.completada, state.horaInoculacion, targetHoras, onChange]);

  // Estados locales para la edición manual de tiempos con PopoverTimePicker
  const [esManualMezclado, setEsManualMezclado] = useState<boolean>(
    Boolean(state.esManualMezclado)
  );
  const [horaManualMezclado, setHoraManualMezclado] = useState<string>(
    state.horaInoculacion || getCurrentTimeString()
  );

  const [esManualIncubacion, setEsManualIncubacion] = useState<boolean>(
    Boolean(state.esManualIncubacion || state.incubacion.esManual)
  );
  const [horaManualIncubacionInicio, setHoraManualIncubacionInicio] = useState<string>(
    state.incubacion.horaInicio || getCurrentTimeString()
  );
  const [horaManualIncubacionFin, setHoraManualIncubacionFin] = useState<string>(
    state.incubacion.horaEntradaCuartoFrio ||
      state.incubacion.horaFin ||
      getCurrentTimeString()
  );

  useEffect(() => {
    if (state.incubacion.horaInicio && !esManualIncubacion) {
      setHoraManualIncubacionInicio(state.incubacion.horaInicio);
    }
  }, [state.incubacion.horaInicio, esManualIncubacion]);

  useEffect(() => {
    if ((state.incubacion.horaEntradaCuartoFrio || state.incubacion.horaFin) && !esManualIncubacion) {
      setHoraManualIncubacionFin(
        state.incubacion.horaEntradaCuartoFrio ||
        state.incubacion.horaFin ||
        getCurrentTimeString()
      );
    }
  }, [state.incubacion.horaEntradaCuartoFrio, state.incubacion.horaFin, esManualIncubacion]);

  // Hook de cuenta regresiva para la incubación (8h yogur / 12h kumis)
  const incubacionTimer = useStageCountdown({
    isRunning: state.incubacion.iniciada && !state.incubacion.completada,
    isCompleted: state.incubacion.completada,
    startTimestamp: state.incubacion.timestampInicio,
    targetMinutes: (state.incubacion.duracionObjetivoHoras || targetHoras) * 60,
    completedDurationText: state.incubacion.tiempoTranscurrido,
  });

  // Cálculo automático inquebrantable de la duración de adición y mezclado
  const tiempoMezcladoDisplay = useMemo(() => {
    if (state.tiempoMezcladoCalculado) {
      return state.tiempoMezcladoCalculado;
    }
    if (state.horaInoculacion) {
      const start = state.horaInicioMezclado || horaLlegadaTemp || state.horaInoculacion;
      return computeDurationBetweenTimes(start, state.horaInoculacion).human;
    }
    return formatHumanDuration(state.tiempoMezcladoMinutos * 60);
  }, [state.tiempoMezcladoCalculado, state.horaInoculacion, state.horaInicioMezclado, horaLlegadaTemp, state.tiempoMezcladoMinutos]);

  // PASO 1: Confirmación de Leche en Cantinas
  const handleConfirmLecheLista = () => {
    const nowTime = getCurrentTimeString();
    onChange((prev: any) => ({
      ...prev,
      temperaturaConfirmada: true,
      horaInicioMezclado: prev.horaInicioMezclado || nowTime,
    }));
    showToast('✓ Cantinas de leche verificadas y listas para la siembra.', 'success');
  };

  const handleConfirmTemperatura = handleConfirmLecheLista;

  // PASO 2: Confirmación de Adición de Cultivo y Mezclado ("¡Agregué el cultivo y ya revolví!")
  const handleConfirmInoculacionYMezclado = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const start = state.horaInicioMezclado || horaLlegadaTemp || timeStr;
    const durCalculada = computeDurationBetweenTimes(start, timeStr).human;

    onChange((prev: any) => ({
      ...prev,
      temperaturaConfirmada: true,
      mezcladoConfirmado: true,
      inoculacionConfirmada: true,
      horaInoculacion: timeStr,
      horaInicioMezclado: start,
      tiempoMezcladoCalculado: durCalculada,
      incubacion: {
        ...prev.incubacion,
        iniciada: true,
        completada: false,
        horaInicio: prev.incubacion.horaInicio || timeStr,
        timestampInicio: prev.incubacion.timestampInicio || now,
        duracionObjetivoHoras: targetHoras,
      },
    }));

    showToast(
      `✓ Cultivo agregado y mezclado (${state.cantidadCultivoCucharadas ?? dosisCalculada} cucharadas · Lote ${state.loteCultivo || defaultCultureLote}) a las ${timeStr} (${durCalculada}). Incubación de ${targetHoras}h en marcha.`,
      'success'
    );
  };

  // PASO 2: Guardar Hora Manual con PopoverTimePicker
  const handleSaveManualMezclado = () => {
    const start = state.horaInicioMezclado || horaLlegadaTemp || horaManualMezclado;
    const durCalculada = computeDurationBetweenTimes(start, horaManualMezclado).human;

    onChange((prev: any) => ({
      ...prev,
      temperaturaConfirmada: true,
      mezcladoConfirmado: true,
      inoculacionConfirmada: true,
      horaInoculacion: horaManualMezclado,
      horaInicioMezclado: start,
      tiempoMezcladoCalculado: durCalculada,
      esManualMezclado: true,
      incubacion: {
        ...prev.incubacion,
        iniciada: true,
        horaInicio: prev.incubacion.horaInicio || horaManualMezclado,
      },
    }));

    showToast(
      `✓ Hora de adición y mezclado actualizada a ${horaManualMezclado}. Duración recalculada: ${durCalculada}.`,
      'success'
    );
  };

  // PASO 3: Guardar Horarios Manuales de Fin de Incubación / Pase a Frío
  const handleSaveManualIncubacionTimes = () => {
    const durStr = computeDurationBetweenTimes(
      horaManualIncubacionInicio,
      horaManualIncubacionFin
    ).human;

    onChange((prev: any) => ({
      ...prev,
      esManualIncubacion: true,
      incubacion: {
        ...prev.incubacion,
        esManual: true,
        horaInicio: horaManualIncubacionInicio,
        horaEntradaCuartoFrio: horaManualIncubacionFin,
        horaFin: horaManualIncubacionFin,
        tiempoTranscurrido: durStr,
      },
    }));

    showToast(
      `✓ Horarios de incubación actualizados. Duración calculada: ${durStr}.`,
      'success'
    );
  };

  const handleSaveManualIncubacionFin = handleSaveManualIncubacionTimes;

  // PASO 3: Nueva Acción de Cierre: "Meter producto a cuarto frío"
  const handleMeterProductoCuartoFrio = () => {
    const timeStr = esManualIncubacion ? horaManualIncubacionFin : getCurrentTimeString();
    const now = Date.now();
    const start = state.incubacion.timestampInicio || now;
    const elapsedSec = Math.max(1, Math.floor((now - start) / 1000));
    const durStr = formatHumanDuration(elapsedSec);

    onChange((prev: any) => ({
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
      `✓ Producto ingresado a cuarto frío a las ${timeStr} (${durStr}). Avanzando directamente a Batido y Sabores.`,
      'success'
    );

    // Salto directo a la siguiente etapa operativa: "Batido y Sabores"
    if (onGoToBatidoYSabores) {
      onGoToBatidoYSabores();
    } else if (onNextStage) {
      onNextStage();
    }
  };

  const isInoculado = Boolean(state.inoculacionConfirmada || state.mezcladoConfirmado);
  const isIncubando = Boolean(state.incubacion.iniciada && !state.incubacion.completada);
  const isIncubacionCompletada = Boolean(
    state.incubacion.completada || state.incubacion.productoEntroCuartoFrio
  );


  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      {/* CABECERA ESTÁNDAR MAESTRA */}
      <StageHeader
        stageNumber={2}
        totalStages={4}
        lineName={isYogur ? 'Línea de Fermentados · Yogur' : 'Línea de Fermentados · Kumis'}
        title={isYogur ? '2. Inoculación e Incubación (Yogur)' : '2. Inoculación e Incubación (Kumis)'}
        subtitle={
          isYogur
            ? 'Adición de cultivo láctico probiótico, mezclado uniforme y reposo en cámara de incubación por 8 horas.'
            : 'Adición de cultivo de Kumis, mezclado suave y reposo a temperatura ambiente por 12 horas.'
        }
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'water_drop',
            label: 'Leche del Lote',
            value: `${litrosLecheBase} L`,
            tone: 'neutral',
          },
          {
            icon: 'timer',
            label: `Incubación (${targetHoras} h)`,
            value: state.incubacion.iniciada
              ? incubacionTimer.formattedElapsed
              : `${targetHoras} Horas`,
            tone: isIncubacionCompletada ? 'emerald' : isIncubando ? 'amber' : 'neutral',
          },
        ]}
      />

      {/* ========================================================================= */}
      {/* PASO 01: VERIFICACIÓN DE LA LECHE EN CANTINAS                             */}
      {/* ========================================================================= */}
      <Card
        stepBadge="Paso 01"
        title="Verificación de la Leche en Cantinas"
        subtitle={
          horaLlegadaTemp
            ? `La leche se transfirió y enfrió a las ${horaLlegadaTemp}. Verifica que las cantinas se encuentren listas en el área de siembra antes de inocular.`
            : 'Verifica que las cantinas con leche pasteurizada se encuentren listas y desinfectadas en el área de siembra para iniciar la inoculación.'
        }
        icon="inventory_2"
        tone={state.temperaturaConfirmada ? 'completed' : 'active'}
        statusBadge={
          state.temperaturaConfirmada
            ? { label: 'Leche Verificada ✓', variant: 'success' }
            : { label: 'Por verificar', variant: 'warning' }
        }
        headerAction={
          <ConfirmButton
            confirmed={state.temperaturaConfirmada}
            confirmedLabel="✓ Leche Lista en Cantinas"
            unconfirmedLabel="Confirmar Leche Lista para Siembra"
            onConfirm={handleConfirmLecheLista}
          />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Estado de la Leche
            </span>
            <div className="text-base font-black text-emerald-800 mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                check_circle
              </span>
              <span>Lista en cantinas para siembra</span>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              {horaLlegadaTemp
                ? `Enfriada y lista desde las ${horaLlegadaTemp}`
                : 'Cantinas limpias y desinfectadas'}
            </span>
          </div>

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Hora de Disponibilidad
            </span>
            <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
              {horaLlegadaTemp || state.horaInicioMezclado || '--:--:--'}
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Registrada al finalizar enfriamiento en Pasteurización
            </span>
          </div>

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Leche del Lote / Dosis Sugerida
            </span>
            <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
              {litrosLecheBase} L
            </div>
            <span className="text-[11px] text-amber-800 font-semibold mt-1 block">
              Dosis: {dosisCalculada} cucharadas (1 cda por cada 40 L)
            </span>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* PASO 02: ADICIÓN DE CULTIVO Y MEZCLADO                                   */}
      {/* ========================================================================= */}
      <Card
        stepBadge="Paso 02"
        title="¡Agregué el cultivo y ya revolví!"
        subtitle={
          isYogur
            ? 'Adiciona el cultivo láctico probiótico y revuelve suavemente para repartirlo uniformemente. Al confirmar arranca la incubación de 8 horas.'
            : 'Adiciona el cultivo láctico de Kumis y revuelve suavemente para repartirlo parejo. Al confirmar arranca la incubación de 12 horas.'
        }
        icon="biotech"
        tone={isInoculado ? 'completed' : 'active'}
        statusBadge={
          isInoculado
            ? {
                label: `Sembrado (${state.horaInoculacion || '--:--'}) ✓`,
                variant: 'success',
              }
            : { label: 'Por sembrar', variant: 'info' }
        }
        headerAction={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#5d564a] bg-[#f4efe6] px-3 py-1.5 rounded-lg border border-[#e6decb] hover:bg-[#ede5d6] transition-colors">
              <input
                type="checkbox"
                checked={esManualMezclado}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEsManualMezclado(checked);
                  onChange((p: any) => ({ ...p, esManualMezclado: checked }));
                }}
                className="rounded border-[#cfc4b0] text-[#1e1b18] focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>Habilitar edición manual</span>
            </label>

            <ConfirmButton
              confirmed={isInoculado}
              confirmedLabel={`✓ ¡Agregué el cultivo y ya revolví! (${state.horaInoculacion || 'Listo'})`}
              unconfirmedLabel="¡Agregué el cultivo y ya revolví!"
              icon="biotech"
              onConfirm={handleConfirmInoculacionYMezclado}
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Lote del Cultivo Láctico (Solo Lectura - Heredado de Pasteurización) */}
          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Lote del Cultivo Láctico
            </span>
            <div className="text-base font-black font-mono text-[#1e1b18] mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-amber-700">
                biotech
              </span>
              <span>{loteCultivoEfectivo}</span>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Solo lectura · Heredado de Pasteurización
            </span>
          </div>

          {/* Cucharadas de Cultivo */}
          <InputField
            label="Cucharadas de Cultivo"
            type="number"
            step="0.1"
            min="0.1"
            unit="cucharadas"
            placeholder={dosisCalculada > 0 ? `Ej: ${dosisCalculada}` : 'Ej: 25'}
            value={
              state.cantidadCultivoCucharadas !== undefined &&
              state.cantidadCultivoCucharadas !== 0
                ? state.cantidadCultivoCucharadas
                : dosisCalculada > 0
                ? dosisCalculada
                : ''
            }
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              onChange((p: any) => ({
                ...p,
                cantidadCultivoCucharadas: val,
                cantidadCultivoGramos: val,
              }));
            }}
            hint={`Sugerencia exacta: 1 cda por cada 40 L (${litrosLecheBase} L → ${dosisCalculada} cucharadas)`}
          />

          {/* Hora de Adición / Mezclado */}
          {esManualMezclado ? (
            <div className="flex flex-col gap-1.5">
              <PopoverTimePicker
                label="Hora de Adición / Mezclado"
                icon="schedule"
                hint="Toca para desplegar selector flotante (hh:mm:ss a)"
                value={horaManualMezclado}
                onChange={setHoraManualMezclado}
              />
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="save"
                  onClick={handleSaveManualMezclado}
                  className="w-full text-xs"
                >
                  Guardar Hora
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
              <span className="text-[11px] uppercase font-bold text-[#5d564a]">
                Hora de Adición / Mezclado
              </span>
              <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
                {state.horaInoculacion || '--:--'}
              </div>
              <span className="text-[11px] text-[#7a7164] mt-1 block">
                {state.horaInoculacion
                  ? 'Registrada al pulsar confirmación'
                  : 'Pendiente de registrar'}
              </span>
            </div>
          )}

          {/* Tiempo en Adicionar y Revolver (Cálculo Automático - SOLO LECTURA) */}
          <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/70 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-amber-900">
                Tiempo en Adicionar y Revolver
              </span>
              <span className="material-symbols-outlined text-[16px] text-amber-700">
                lock
              </span>
            </div>
            <div className="text-xl font-black font-mono text-amber-950 mt-1">
              {tiempoMezcladoDisplay}
            </div>
            <span className="text-[11px] text-amber-800 font-semibold mt-1 block">
              Cálculo automático (Solo lectura)
            </span>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* PASO 03: FIN DE INCUBACIÓN Y CUARTO FRÍO (SIN CRONÓMETROS INTERNOS SUELTOS) */}
      {/* ========================================================================= */}
      <Card
        stepBadge="Paso 03"
        title={
          isYogur
            ? 'Fin de Incubación y Cuarto Frío (8 Horas)'
            : 'Fin de Incubación y Cuarto Frío (12 Horas)'
        }
        subtitle={
          isYogur
            ? 'Reposo e incubación durante 8 horas continuas. Al terminar, mete el producto a cuarto frío.'
            : 'Reposo e incubación durante 12 horas continuas. Al terminar, mete el producto a cuarto frío.'
        }
        icon="hourglass_top"
        tone={isIncubacionCompletada ? 'completed' : isIncubando ? 'active' : 'default'}
        statusBadge={
          isIncubacionCompletada
            ? {
                label: `En Cuarto Frío (${state.incubacion.horaEntradaCuartoFrio || state.incubacion.horaFin || 'Listo'}) ✓`,
                variant: 'success',
              }
            : isIncubando
            ? { label: `Incubando (${targetHoras} h)...`, variant: 'warning', pulse: true }
            : { label: 'Inicia al sembrar', variant: 'neutral' }
        }
        headerAction={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#5d564a] bg-[#f4efe6] px-3 py-1.5 rounded-lg border border-[#e6decb] hover:bg-[#ede5d6] transition-colors">
              <input
                type="checkbox"
                checked={esManualIncubacion}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEsManualIncubacion(checked);
                  onChange((p: any) => ({
                    ...p,
                    esManualIncubacion: checked,
                    incubacion: { ...p.incubacion, esManual: checked },
                  }));
                }}
                className="rounded border-[#cfc4b0] text-[#1e1b18] focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>Habilitar edición manual</span>
            </label>

            {/* BOTÓN MAESTRO DE CIERRE DE ETAPA: "Meter producto a cuarto frío" */}
            <Button
              variant={isIncubacionCompletada ? 'secondary' : 'primary'}
              size="md"
              icon="kitchen"
              onClick={handleMeterProductoCuartoFrio}
              className={
                isIncubacionCompletada
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold'
                  : 'font-bold shadow-sm'
              }
            >
              {isIncubacionCompletada
                ? `✓ En Cuarto Frío (${state.incubacion.horaEntradaCuartoFrio || state.incubacion.horaFin || 'Listo'})`
                : 'Meter producto a cuarto frío'}
            </Button>
          </div>
        }
      >
        {/* Banner del cronómetro de incubación */}
        <TimerBanner
          label={`Cronómetro de Incubación (${isYogur ? 'Yogur' : 'Kumis'})`}
          sublabel={`Meta reglamentaria: ${targetHoras} horas continuas de reposo e incubación`}
          formattedTime={
            state.incubacion.iniciada
              ? incubacionTimer.formattedElapsed
              : `${targetHoras} Horas`
          }
          targetLabel={`${targetHoras} Horas`}
          progressPercent={incubacionTimer.progressPercent}
          isRunning={isIncubando}
          isCompleted={isIncubacionCompletada}
          isOvertime={incubacionTimer.isOvertime}
          className="mb-4"
        />

        {!esManualIncubacion ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Inicio de Incubación */}
            <div className="p-4 rounded-xl bg-white border border-[#e6decb] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                INICIO DE INCUBACIÓN
              </span>
              <span className="text-xl font-mono font-black text-gray-900 mt-1 block">
                {state.incubacion.horaInicio || '--:--:--'}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                {state.incubacion.horaInicio
                  ? 'Registrado al sembrar el cultivo'
                  : 'Inicia al confirmar la siembra'}
              </span>
            </div>

            {/* 2. Tiempo Transcurrido (Solo Lectura - Cálculo Matemático / En Vivo) */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-900 block">
                  TIEMPO TRANSCURRIDO
                </span>
                <span className="material-symbols-outlined text-amber-700 text-base">timer</span>
              </div>
              <span className="text-xl font-mono font-black text-amber-950 mt-1 block">
                {state.incubacion.iniciada
                  ? state.incubacion.tiempoTranscurrido || incubacionTimer.formattedElapsed
                  : '00:00:00'}
              </span>
              <span className="text-[11px] text-amber-800 font-medium mt-1 block">
                {isIncubacionCompletada
                  ? 'Incubación completada'
                  : isIncubando
                  ? `Cronómetro en vivo (${targetHoras}h meta)`
                  : 'Pendiente de inicio'}
              </span>
            </div>

            {/* 3. Pase a Cuarto Frío */}
            <div className="p-4 rounded-xl bg-white border border-[#e6decb] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                ENTRADA A CUARTO FRÍO
              </span>
              <span
                className={`text-xl font-mono font-black mt-1 block ${
                  isIncubacionCompletada ? 'text-emerald-800' : 'text-gray-400'
                }`}
              >
                {state.incubacion.horaEntradaCuartoFrio ||
                  state.incubacion.horaFin ||
                  'En reposo'}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                {isIncubacionCompletada
                  ? 'Producto en refrigeración ✓'
                  : 'Registra al pulsar "Meter producto a cuarto frío"'}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Inicio Manual */}
            <div className="flex flex-col gap-1.5">
              <PopoverTimePicker
                label="Hora Inicio de Incubación"
                icon="schedule"
                hint="Toca para desplegar selector flotante (hh:mm:ss a)"
                value={horaManualIncubacionInicio}
                onChange={setHoraManualIncubacionInicio}
              />
            </div>

            {/* 2. Duración Matemática Calculada (Solo Lectura) */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-900 block">
                  DURACIÓN DE INCUBACIÓN
                </span>
                <span className="material-symbols-outlined text-amber-700 text-base">functions</span>
              </div>
              <span className="text-xl font-mono font-black text-amber-950 mt-1 block">
                {computeDurationBetweenTimes(horaManualIncubacionInicio, horaManualIncubacionFin).human}
              </span>
              <span className="text-[11px] text-amber-800 font-medium mt-1 block">
                Cálculo matemático automático (Solo lectura)
              </span>
            </div>

            {/* 3. Entrada a Cuarto Frío Manual con Botón de Guardado */}
            <div className="flex flex-col gap-1.5 justify-between">
              <PopoverTimePicker
                label="Hora Entrada a Cuarto Frío"
                icon="schedule"
                hint="Toca para desplegar selector flotante (hh:mm:ss a)"
                value={horaManualIncubacionFin}
                onChange={setHoraManualIncubacionFin}
              />
              <Button
                variant="secondary"
                size="sm"
                icon="save"
                onClick={handleSaveManualIncubacionTimes}
                className="w-full text-xs font-semibold mt-1"
              >
                Guardar Horarios de Incubación
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* TARJETA INFERIOR: ACCIÓN DE CIERRE Y PASO DIRECTO A BATIDO Y SABORES     */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 shrink-0">
            <span className="material-symbols-outlined text-[24px]">kitchen</span>
          </div>
          <div className="text-xs sm:text-sm text-[#434655]">
            <p className="font-bold text-[#1e1b18]">
              Cierre de Incubación y Traslado a Cuarto Frío
            </p>
            <p>
              Al pulsar <strong>&ldquo;Meter producto a cuarto frío&rdquo;</strong>, se registra el evento y se avanza directamente a la etapa operativa de{' '}
              <strong className="text-amber-900 font-semibold">Batido y Sabores</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            icon="kitchen"
            iconRight="arrow_forward"
            onClick={handleMeterProductoCuartoFrio}
            className="w-full sm:w-auto font-bold shadow-md"
          >
            {isIncubacionCompletada ? 'Ir a Batido y Sabores' : 'Meter producto a cuarto frío'}
          </Button>
        </div>
      </div>
    </div>
  );
};
