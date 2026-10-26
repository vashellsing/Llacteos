import React, { useEffect } from 'react';
import { InoculacionKumisState } from '../../../types/kumis';
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

interface InoculacionStageKumisProps {
  state: InoculacionKumisState;
  onChange: (updater: (prev: InoculacionKumisState) => InoculacionKumisState) => void;
  tempLlegada45?: number;
  tempLlegada35?: number;
  horaLlegada45?: string | null;
  horaLlegada35?: string | null;
  litrosLecheBase?: number;
  processTimer: ProcessTimerState;
  onNextStage: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const InoculacionStageKumis: React.FC<InoculacionStageKumisProps> = ({
  state,
  onChange,
  horaLlegada45,
  horaLlegada35,
  litrosLecheBase = 100,
  onNextStage,
  showToast,
}) => {
  const horaFinEnf = horaLlegada35 || horaLlegada45;

  // Reloj de incubación de Kumis (12 horas = 720 min)
  const incubacionTimer = useStageCountdown({
    isRunning: state.incubacion.iniciada && !state.incubacion.completada,
    isCompleted: state.incubacion.completada,
    startTimestamp: state.incubacion.timestampInicio,
    targetMinutes: (state.incubacion.duracionObjetivoHoras || 12) * 60,
    completedDurationText: state.incubacion.tiempoTranscurrido,
  });

  // Calcular dosis de cultivo (1 cucharada por cada 40 L)
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
    const now = Date.now();
    onChange((prev) => ({
      ...prev,
      temperaturaConfirmada: true,
      mezcladoConfirmado: true,
      inoculacionConfirmada: true,
      horaInoculacion: timeStr,
      incubacion: {
        ...prev.incubacion,
        iniciada: true,
        completada: false,
        horaInicio: timeStr,
        timestampInicio: now,
        duracionObjetivoHoras: 12,
      },
    }));
    showToast(
      `✓ Cultivo de Kumis agregado (${state.cantidadCultivoCucharadas ?? 2.5} cucharadas · Lote ${state.loteCultivo}). Reloj de 12 horas en marcha (${timeStr}).`,
      'success'
    );
  };

  const handleConfirmProductoEntroCuartoFrio = () => {
    const timeStr = getCurrentTimeString();
    const now = Date.now();
    const start = state.incubacion.timestampInicio || now;
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
      `✓ Incubación de Kumis lista a las ${timeStr} (${durStr}). Ahora pasa a 3. Cuarto Frío.`,
      'success'
    );
  };

  const isInoculado = state.inoculacionConfirmada || state.mezcladoConfirmado;
  const isIncubando = state.incubacion.iniciada && !state.incubacion.completada;
  const isIncubacionCompletada = state.incubacion.completada;

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      <StageHeader
        stageNumber={2}
        totalStages={5}
        lineName="Línea de Fermentados · Kumis"
        title="2. Inoculación e Incubación (Kumis)"
        subtitle="Verifica que la leche esté a 35 °C, ponle el cultivo de Kumis (1 cucharada por cada 40 L), revuelve 5 minutos y déjala reposar 12 horas."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'thermostat',
            label: 'Temp. Siembra',
            value: '35.0 °C',
            tone: 'emerald',
          },
          {
            icon: 'timer',
            label: 'Incubación (12 h)',
            value: state.incubacion.iniciada
              ? incubacionTimer.formattedElapsed
              : '12 Horas',
            tone: isIncubacionCompletada ? 'emerald' : 'amber',
          },
        ]}
      />

      {/* PASO 01: VERIFICACIÓN DE TEMPERATURA A 35 °C */}
      <Card
        stepBadge="Paso 01"
        title="Temperatura de la Leche a 35.0 °C"
        subtitle={
          horaFinEnf
            ? `La leche bajó a 35.0 °C a las ${horaFinEnf}. Revisa que siga a esa temperatura antes de poner el cultivo.`
            : 'Revisa con el termómetro que la leche esté entre 34 °C y 36 °C antes de agregar el cultivo.'
        }
        icon="device_thermostat"
        tone={state.temperaturaConfirmada ? 'completed' : 'default'}
        headerAction={
          <ConfirmButton
            confirmed={state.temperaturaConfirmada}
            confirmedLabel="✓ Temperatura 35.0 °C Lista"
            unconfirmedLabel="Confirmar Temperatura 35.0 °C"
            onConfirm={() => {
              onChange((p) => ({ ...p, temperaturaConfirmada: true }));
              showToast('✓ Temperatura de 35.0 °C confirmada para el Kumis.', 'success');
            }}
          />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Temperatura Medida"
            type="number"
            step="0.1"
            unit="°C"
            value={
              state.temperaturaVerificada45 === 45.0
                ? 35.0
                : state.temperaturaVerificada45 || 35.0
            }
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 35.0;
              onChange((p) => ({ ...p, temperaturaVerificada45: val }));
            }}
            hint="Rango de siembra: 34.0 °C a 36.0 °C"
          />

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Estado de la Leche
            </span>
            <div className="text-base font-black text-emerald-800 mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                check_circle
              </span>
              <span>Con azúcar disuelta</span>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Lista en cantinas de fermentación
            </span>
          </div>

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Leche del Lote
            </span>
            <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
              {litrosLecheBase} L
            </div>
            <span className="text-[11px] text-amber-800 font-semibold mt-1 block">
              Medida: 1 cucharada por cada 40 L
            </span>
          </div>
        </div>
      </Card>

      {/* PASO 02: SIEMBRA Y MEZCLA DEL CULTIVO */}
      <Card
        stepBadge="Paso 02"
        title="Agregar el Cultivo de Kumis y Revolver"
        subtitle="Pon las cucharadas de cultivo y revuelve parejo por 5 minutos. Al confirmar arranca solo el reloj de 12 horas."
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
            confirmedLabel={`✓ Cultivo Agregado (${state.horaInoculacion})`}
            unconfirmedLabel="Confirmar: Ya Puse el Cultivo y Mezclé"
            onConfirm={handleConfirmInoculacionYMezclado}
          />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Lote del Cultivo de Kumis"
            type="text"
            value={state.loteCultivo}
            onChange={(e) => {
              const val = e.target.value;
              onChange((p) => ({ ...p, loteCultivo: val }));
            }}
            placeholder="Ej: CULT-KUM-2026-02"
            hint="Código del sobre de cultivo"
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

      {/* PASO 03: REPOSO E INCUBACIÓN DE 12 HORAS */}
      <Card
        stepBadge="Paso 03"
        title="Incubación del Kumis (12 Horas a Temperatura Ambiente)"
        subtitle="Deja reposar las cantinas a 22–26 °C durante 12 horas hasta que cuaje y coja su aroma fresco de Kumis."
        icon="hourglass_top"
        tone={
          isIncubacionCompletada
            ? 'completed'
            : isIncubando
              ? 'active'
              : 'default'
        }
        statusBadge={
          isIncubacionCompletada
            ? { label: 'Incubación Lista (12 h) ✓', variant: 'success' }
            : isIncubando
              ? { label: 'Incubando 12 h', variant: 'warning', pulse: true }
              : { label: 'Inicia al sembrar', variant: 'neutral' }
        }
        headerAction={
          state.incubacion.iniciada ? (
            <ConfirmButton
              confirmed={isIncubacionCompletada}
              confirmedLabel={`✓ Pasó a Cuarto Frío (${state.incubacion.horaFin})`}
              unconfirmedLabel="Confirmar: Ya Cuajó · Pasar a Cuarto Frío"
              icon="ac_unit"
              onConfirm={handleConfirmProductoEntroCuartoFrio}
            />
          ) : undefined
        }
      >
        {(state.incubacion.iniciada || isIncubacionCompletada) && (
          <TimerBanner
            label="Tiempo de Incubación de Kumis"
            sublabel="Meta reglamentaria: 12 horas continuas entre 22.0 °C y 26.0 °C"
            formattedTime={incubacionTimer.formattedElapsed}
            targetLabel="12 Horas"
            progressPercent={incubacionTimer.progressPercent}
            isRunning={isIncubando}
            isCompleted={isIncubacionCompletada}
            isOvertime={incubacionTimer.isOvertime}
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Temperatura Ambiente / Sala"
            type="number"
            step="0.5"
            unit="°C"
            value={state.incubacion.temperaturaIncubacion}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 24.0;
              onChange((p) => ({
                ...p,
                incubacion: { ...p.incubacion, temperaturaIncubacion: val },
              }));
            }}
            hint="Rango ideal para Kumis: 22.0 °C a 26.0 °C"
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
                  {state.incubacion.horaFin || 'En reposo'}
                </strong>
              </div>
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Cuajada suave con aroma fresco de Kumis
            </span>
          </div>
        </div>
      </Card>

      {/* AVANZAR A ETAPA 3 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#434655]">
          Cuando cumpla las 12 horas de incubación y pases las cantinas al frío, avanza a{' '}
          <strong className="text-[#1e1b18]">3. Cuarto Frío (Kumis)</strong>.
        </div>
        <Button
          variant="primary"
          size="lg"
          iconRight="arrow_forward"
          onClick={onNextStage}
          className="w-full sm:w-auto"
        >
          Ir a 3. Cuarto Frío (Kumis)
        </Button>
      </div>
    </div>
  );
};
