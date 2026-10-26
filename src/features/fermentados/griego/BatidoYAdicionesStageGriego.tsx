import React, { useState } from 'react';
import { BatidoYAdicionesYogurGriegoState } from '../../../types/yogur_griego';
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
  Badge,
} from '../../../components/ui';

interface BatidoYAdicionesStageGriegoProps {
  state: BatidoYAdicionesYogurGriegoState;
  onChange: (
    updater: (
      prev: BatidoYAdicionesYogurGriegoState
    ) => BatidoYAdicionesYogurGriegoState
  ) => void;
  baseFiltradaKg?: number;
  processTimer: ProcessTimerState;
  onNextStage: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const BatidoYAdicionesStageGriego: React.FC<
  BatidoYAdicionesStageGriegoProps
> = ({ state, onChange, baseFiltradaKg = 35, onNextStage, showToast }) => {
  const { batido, formulacion } = state;
  const [batidoStartTimestamp, setBatidoStartTimestamp] = useState<number | null>(null);

  const batidoTimer = useStageCountdown({
    isRunning: batido.iniciado && !batido.completado,
    isCompleted: batido.completado,
    startTimestamp: batidoStartTimestamp,
    targetMinutes: 5,
    completedDurationText: batido.tiempoBatido,
  });

  const masaDisponibleKg = baseFiltradaKg;
  const masaSinEstevia = Number(formulacion.variedadSinEstevia.masaKg) || 0;
  const masaConEstevia = Number(formulacion.variedadConEstevia.masaKg) || 0;
  const masaTotalAsignada = Number((masaSinEstevia + masaConEstevia).toFixed(1));
  const diferenciaMasa = Number((masaDisponibleKg - masaTotalAsignada).toFixed(1));
  const balanceCorrecto = Math.abs(diferenciaMasa) < 0.05;

  const handleStartBatido = () => {
    const timeStr = getCurrentTimeString();
    setBatidoStartTimestamp(Date.now());
    onChange((prev) => ({
      ...prev,
      batido: {
        ...prev.batido,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
      },
    }));
    showToast(
      `⏱ Batido de Griego iniciado a las ${timeStr} (${batido.velocidadRpm} RPM).`,
      'info'
    );
  };

  const handleEndBatido = () => {
    const timeStr = getCurrentTimeString();
    const durStr = formatHumanDuration(Math.max(1, batidoTimer.elapsedSeconds || 300));
    onChange((prev) => ({
      ...prev,
      batido: {
        ...prev.batido,
        completado: true,
        horaFin: timeStr,
        tiempoBatido: durStr,
      },
    }));
    showToast(
      `✓ Batido de Griego terminado a las ${timeStr} (${durStr}). Masa brillante y sin grumos.`,
      'success'
    );
  };

  const handleConfirmarFormulacion = () => {
    if (masaConEstevia > 0 && !formulacion.variedadConEstevia.loteEstevia.trim()) {
      showToast(
        '⚠️ Anota el lote de Stevia para la parte que va endulzada.',
        'warning'
      );
      return;
    }

    if (!balanceCorrecto) {
      showToast(
        `⚠️ Ajusta los kilos: la suma (${masaTotalAsignada} kg) debe cuadrar con la masa disponible (${masaDisponibleKg} kg).`,
        'warning'
      );
      return;
    }

    const timeStr = getCurrentTimeString();
    onChange((prev) => ({
      ...prev,
      formulacion: {
        ...prev.formulacion,
        registrado: true,
        horaRegistro: timeStr,
      },
    }));

    showToast(
      `✓ Reparto guardado: ${masaSinEstevia} kg Sin Stevia y ${masaConEstevia} kg Con Stevia.`,
      'success'
    );
  };

  const isReadyForNext = batido.completado && formulacion.registrado;

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      <StageHeader
        stageNumber={4}
        totalStages={5}
        lineName="Línea de Fermentados · Yogur Griego"
        title="4. Batido y Reparto (Sin/Con Stevia)"
        subtitle="Bate suave la masa escurrida (sin agregarle crema ni azúcar) y divídela entre Griego Natural (sin stevia) y Griego con Stevia."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'scale',
            label: 'Masa Filtrada',
            value: `${masaDisponibleKg} kg`,
            tone: 'amber',
          },
          {
            icon: 'verified',
            label: 'Regla Griego',
            value: 'Cero Azúcar / Crema',
            tone: 'emerald',
          },
        ]}
      />

      {/* PASO 01: BATIDO SUAVE SIN CREMA */}
      <Card
        stepBadge="Paso 01"
        title="Batido Suave de la Masa (Sin Crema)"
        subtitle="Bate a 35 RPM por unos 5 minutos solo para darle brillo y dejar la masa pareja y sedosa."
        icon="rotate_right"
        tone={
          batido.completado
            ? 'completed'
            : batido.iniciado
              ? 'active'
              : 'default'
        }
        statusBadge={
          batido.completado
            ? { label: `Batido Listo (${batido.horaFin})`, variant: 'success' }
            : batido.iniciado
              ? { label: 'Batiendo a 35 RPM', variant: 'warning', pulse: true }
              : { label: 'Pendiente', variant: 'neutral' }
        }
        headerAction={
          !batido.iniciado ? (
            <Button
              variant="primary"
              icon="play_arrow"
              onClick={handleStartBatido}
            >
              Iniciar Batido Suave
            </Button>
          ) : (
            <ConfirmButton
              confirmed={batido.completado}
              confirmedLabel={`✓ Batido Terminado (${batido.horaFin})`}
              unconfirmedLabel="Confirmar: Ya Quedó Cremoso · Terminar Batido"
              onConfirm={handleEndBatido}
            />
          )
        }
      >
        {(batido.iniciado || batido.completado) && (
          <TimerBanner
            label="Tiempo de Batido del Griego"
            sublabel="Tiempo sugerido: 5 minutos a 35 RPM (sin crema)"
            formattedTime={batidoTimer.formattedElapsed}
            targetLabel="5 min"
            progressPercent={batidoTimer.progressPercent}
            isRunning={batido.iniciado && !batido.completado}
            isCompleted={batido.completado}
            isOvertime={batidoTimer.isOvertime}
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb]">
            <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
              Velocidad de Batido
            </span>
            <span className="text-xl font-black font-mono text-[#1e1b18] mt-1 block">
              {batido.velocidadRpm} RPM
            </span>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Batido suave para no soltar suero
            </span>
          </div>

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb]">
            <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
              Tiempo de Batido
            </span>
            <span className="text-xl font-black font-mono text-[#1e1b18] mt-1 block">
              {batido.completado
                ? batido.tiempoBatido || '5 min'
                : batido.iniciado
                  ? batidoTimer.formattedElapsed
                  : '5 min'}
            </span>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Inicio: {batido.horaInicio || '--:--'} · Fin:{' '}
              {batido.horaFin || '--:--'}
            </span>
          </div>

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb]">
            <span className="text-[11px] uppercase font-bold text-[#5d564a] block">
              Textura del Griego
            </span>
            <span className="text-sm font-black text-emerald-800 mt-1.5 block">
              Espeso, brillante y sin grumos
            </span>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              100% leche escurrida en lienzos
            </span>
          </div>
        </div>
      </Card>

      {/* PASO 02: REPARTO ENTRE SIN STEVIA Y CON STEVIA */}
      <Card
        stepBadge="Paso 02"
        title="Reparto por Variedad: Griego Sin Stevia vs. Con Stevia"
        subtitle="Reparte los kilos de masa filtrada entre las dos presentaciones de Griego."
        icon="tune"
        tone={formulacion.registrado ? 'completed' : 'default'}
        statusBadge={
          balanceCorrecto
            ? {
                label: `Cuadrado: ${masaTotalAsignada} / ${masaDisponibleKg} kg`,
                variant: 'success',
              }
            : {
                label:
                  diferenciaMasa > 0
                    ? `Faltan ${diferenciaMasa} kg por repartir`
                    : `Te pasaste por ${Math.abs(diferenciaMasa)} kg`,
                variant: 'warning',
              }
        }
        headerAction={
          <ConfirmButton
            confirmed={formulacion.registrado}
            disabled={!batido.completado}
            confirmedLabel={`✓ Reparto Guardado (${formulacion.horaRegistro})`}
            unconfirmedLabel="Confirmar Reparto de Masa"
            icon="save"
            onConfirm={handleConfirmarFormulacion}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* VARIEDAD 1: GRIEGO SIN STEVIA */}
          <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200/80">
                <h3 className="text-base font-black text-emerald-950">
                  1. Griego Sin Stevia (Natural)
                </h3>
                <Badge variant="success">100% Puro</Badge>
              </div>
              <p className="text-xs text-[#434655] mb-4">
                Sabor natural neutro sin ningún endulzante. Se envasa en tarros de 1 L (1000 g) y 500 ml (500 g).
              </p>

              <InputField
                label="Kilos de Masa Sin Stevia"
                type="number"
                step="0.5"
                min="0"
                unit="kg"
                value={formulacion.variedadSinEstevia.masaKg}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChange((prev) => ({
                    ...prev,
                    formulacion: {
                      ...prev.formulacion,
                      variedadSinEstevia: {
                        ...prev.formulacion.variedadSinEstevia,
                        masaKg: val,
                      },
                    },
                  }));
                }}
              />
            </div>

            <div className="text-xs text-emerald-900 font-semibold">
              Envases autorizados: Tarro 1000 g y Tarro 500 g
            </div>
          </div>

          {/* VARIEDAD 2: GRIEGO CON STEVIA */}
          <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/40 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200/80">
                <h3 className="text-base font-black text-amber-950">
                  2. Griego Con Stevia
                </h3>
                <Badge variant="warning">Endulzado con Stevia</Badge>
              </div>
              <p className="text-xs text-[#434655] mb-4">
                Endulzado únicamente con stevia. Se envasa en tarros de 1000 g, 500 g y vasitos de 120 g.
              </p>

              <div className="space-y-3">
                <InputField
                  label="Kilos de Masa Con Stevia"
                  type="number"
                  step="0.5"
                  min="0"
                  unit="kg"
                  value={formulacion.variedadConEstevia.masaKg}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChange((prev) => ({
                      ...prev,
                      formulacion: {
                        ...prev.formulacion,
                        variedadConEstevia: {
                          ...prev.formulacion.variedadConEstevia,
                          masaKg: val,
                        },
                      },
                    }));
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    label="Cantidad de Stevia"
                    type="number"
                    step="0.1"
                    min="0"
                    unit="g"
                    value={formulacion.variedadConEstevia.gramosEstevia ?? 0}
                    onChange={(e) => {
                      const val =
                        e.target.value === '' ? 0 : Number(e.target.value);
                      onChange((prev) => ({
                        ...prev,
                        formulacion: {
                          ...prev.formulacion,
                          variedadConEstevia: {
                            ...prev.formulacion.variedadConEstevia,
                            gramosEstevia: val,
                          },
                        },
                      }));
                    }}
                  />

                  <InputField
                    label="Lote de Stevia"
                    type="text"
                    value={formulacion.variedadConEstevia.loteEstevia}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange((prev) => ({
                        ...prev,
                        formulacion: {
                          ...prev.formulacion,
                          variedadConEstevia: {
                            ...prev.formulacion.variedadConEstevia,
                            loteEstevia: val,
                          },
                        },
                      }));
                    }}
                    placeholder="Ej: EST-2026-X"
                  />
                </div>
              </div>
            </div>

            <div className="text-xs text-amber-900 font-semibold">
              Envases autorizados: Tarro 1000 g, Tarro 500 g y Vasito 120 g
            </div>
          </div>
        </div>
      </Card>

      {/* AVANZAR A ETAPA 5 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#434655]">
          Con el Griego batido y repartido, pasa a{' '}
          <strong className="text-[#1e1b18]">5. Envasado y Almacenamiento Final</strong>.
        </div>
        <Button
          variant="primary"
          size="lg"
          iconRight="arrow_forward"
          disabled={!isReadyForNext}
          onClick={onNextStage}
          className="w-full sm:w-auto"
        >
          Ir a 5. Envasado y Rendimiento
        </Button>
      </div>
    </div>
  );
};
