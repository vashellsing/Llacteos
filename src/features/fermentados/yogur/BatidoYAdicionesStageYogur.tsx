import React, { useEffect, useState } from 'react';
import { BatidoYAdicionesYogurState } from '../../../types/yogur';
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

interface BatidoYAdicionesStageYogurProps {
  state: BatidoYAdicionesYogurState;
  onChange: (
    updater: (prev: BatidoYAdicionesYogurState) => BatidoYAdicionesYogurState
  ) => void;
  llevaAzucar?: boolean;
  litrosLecheBase?: number;
  processTimer: ProcessTimerState;
  onNextStage: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const BatidoYAdicionesStageYogur: React.FC<BatidoYAdicionesStageYogurProps> = ({
  state,
  onChange,
  llevaAzucar = true,
  litrosLecheBase = 100,
  onNextStage,
  showToast,
}) => {
  const [batidoStartTimestamp, setBatidoStartTimestamp] = useState<number | null>(null);

  const batidoTimer = useStageCountdown({
    isRunning: state.batidora.iniciado && !state.batidora.completado,
    isCompleted: state.batidora.completado,
    startTimestamp: batidoStartTimestamp,
    targetMinutes: 12,
    completedDurationText: state.batidora.tiempoBatido,
  });

  // Valores seguros para las 3 variedades
  const variedadNatural = state.adiciones.variedadSinAzucar || {
    litrosBase: Math.floor(litrosLecheBase / 2) || 25,
    notaInformativa:
      'Sin azúcar, saborizante ni colorante. Pasa directo a envasar.',
  };

  const variedadStevia = state.adiciones.variedadEstevia || {
    litrosBase: Math.ceil(litrosLecheBase / 2) || 25,
    gramosEstevia: 80,
    loteEstevia: 'EST-2026-BIO',
  };

  const variedadDulce = state.adiciones.variedadAzucar || {
    litrosBase: litrosLecheBase || 50,
    kilosAzucar: Number(((litrosLecheBase / 40) * 3.2).toFixed(2)),
    loteAzucar: 'AZ-2026-10A',
    llevaSaborizante: true,
    sabor: 'Mora',
    saborizanteMl: 800,
    loteSaborizante: 'SAB-2026-10A',
    llevaColorante: true,
    coloranteMl: 50,
    loteColorante: 'COL-2026-10A',
  };

  useEffect(() => {
    if (llevaAzucar && (!variedadDulce.kilosAzucar || variedadDulce.kilosAzucar === 0)) {
      const azucarCalc = Number(((variedadDulce.litrosBase / 40) * 3.2).toFixed(2));
      onChange((p) => ({
        ...p,
        adiciones: {
          ...p.adiciones,
          variedadAzucar: {
            ...variedadDulce,
            kilosAzucar: azucarCalc,
            llevaSaborizante: true,
            llevaColorante: true,
            loteSaborizante: variedadDulce.loteSaborizante || 'SAB-2026-10A',
            loteColorante: variedadDulce.loteColorante || 'COL-2026-10A',
          },
        },
      }));
    }
  }, [llevaAzucar, variedadDulce, onChange]);

  const handleStartBatidora = () => {
    const timeStr = getCurrentTimeString();
    setBatidoStartTimestamp(Date.now());
    onChange((prev) => ({
      ...prev,
      batidora: {
        ...prev.batidora,
        iniciado: true,
        completado: false,
        horaInicio: timeStr,
      },
    }));
    showToast(
      `✓ Batidora encendida a las ${timeStr} (${state.batidora.velocidadRpm} RPM).`,
      'info'
    );
  };

  const handleConfirmFinBatido = () => {
    const timeStr = getCurrentTimeString();
    const durStr = formatHumanDuration(batidoTimer.elapsedSeconds || 12 * 60);

    onChange((prev) => ({
      ...prev,
      batidora: {
        ...prev.batidora,
        completado: true,
        horaFin: timeStr,
        tiempoBatido: durStr,
      },
      preparacionTolva: {
        ...prev.preparacionTolva,
        completado: true,
        horaPreparacion: timeStr,
      },
    }));

    showToast(
      `✓ Batido listo a las ${timeStr} (${durStr}). El yogur quedó cremoso en la tolva.`,
      'success'
    );
  };

  const totalLitrosAsignados = !llevaAzucar
    ? (variedadNatural.litrosBase || 0) + (variedadStevia.litrosBase || 0)
    : variedadDulce.litrosBase || 0;

  const handleConfirmFormulacion = () => {
    const timeStr = getCurrentTimeString();
    onChange((prev) => ({
      ...prev,
      adiciones: {
        ...prev.adiciones,
        registrado: true,
        horaRegistro: timeStr,
        variedadSinAzucar: variedadNatural,
        variedadEstevia: variedadStevia,
        variedadAzucar: {
          ...variedadDulce,
          llevaSaborizante: true,
          llevaColorante: true,
        },
      },
    }));
    showToast(`✓ Receta y adiciones guardadas a las ${timeStr}.`, 'success');
  };

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-14">
      <StageHeader
        stageNumber={4}
        totalStages={5}
        lineName="Línea de Fermentados · Yogur"
        title="4. Batido y Saborizado"
        subtitle={`Bate suave el yogur frío hasta que quede cremoso y prepara la mezcla según el tipo de lote (${
          llevaAzucar ? 'Con Azúcar / Dulce' : 'Sin Azúcar / Natural o Stevia'
        }).`}
        standardBadge="NTC-805"
        metrics={[
          {
            icon: llevaAzucar ? 'cookie' : 'spa',
            label: 'Tipo de Lote',
            value: llevaAzucar ? 'CON AZÚCAR' : 'SIN AZÚCAR',
            tone: llevaAzucar ? 'amber' : 'emerald',
          },
          {
            icon: 'cyclone',
            label: 'Velocidad Batido',
            value: `${state.batidora.velocidadRpm} RPM`,
            tone: 'purple',
          },
        ]}
      />

      {/* PASO 01: BATIDORA INDUSTRIAL */}
      <Card
        stepBadge="Paso 01"
        title="Batido Suave en Tolva / Batidora"
        subtitle="Bate a velocidad suave (30 a 40 RPM) entre 10 y 15 minutos para romper el coágulo y dejar el yogur cremoso sin aguarlo."
        icon="cyclone"
        tone={
          state.batidora.completado
            ? 'completed'
            : state.batidora.iniciado
              ? 'active'
              : 'default'
        }
        statusBadge={
          state.batidora.completado
            ? { label: `Batido Listo (${state.batidora.horaFin})`, variant: 'success' }
            : state.batidora.iniciado
              ? { label: 'Batidora Encendida', variant: 'warning', pulse: true }
              : { label: 'Pendiente', variant: 'neutral' }
        }
        headerAction={
          !state.batidora.iniciado ? (
            <Button
              variant="primary"
              icon="play_circle"
              onClick={handleStartBatidora}
            >
              Encender Batidora
            </Button>
          ) : (
            <ConfirmButton
              confirmed={state.batidora.completado}
              confirmedLabel={`✓ Batido y Tolva Listos (${state.batidora.horaFin})`}
              unconfirmedLabel="Confirmar: Ya Quedó Cremoso · Apagar Batidora"
              onConfirm={handleConfirmFinBatido}
            />
          )
        }
      >
        {(state.batidora.iniciado || state.batidora.completado) && (
          <TimerBanner
            label="Tiempo de Batido"
            sublabel="Tiempo sugerido: 10 a 15 minutos a 35 RPM"
            formattedTime={batidoTimer.formattedElapsed}
            targetLabel="12 min"
            progressPercent={batidoTimer.progressPercent}
            isRunning={state.batidora.iniciado && !state.batidora.completado}
            isCompleted={state.batidora.completado}
            isOvertime={batidoTimer.isOvertime}
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Velocidad de la Batidora"
            type="number"
            min="10"
            max="80"
            unit="RPM"
            value={state.batidora.velocidadRpm}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 35;
              onChange((p) => ({
                ...p,
                batidora: { ...p.batidora, velocidadRpm: val },
              }));
            }}
            hint="Recomendado: 30 a 40 RPM"
          />

          <InputField
            label="Temperatura de la Mezcla"
            type="number"
            step="0.5"
            unit="°C"
            value={state.preparacionTolva.temperaturaMezcla}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 7.0;
              onChange((p) => ({
                ...p,
                preparacionTolva: {
                  ...p.preparacionTolva,
                  temperaturaMezcla: val,
                },
              }));
            }}
            hint="Debe mantenerse fría: 6.0 °C a 8.0 °C"
          />

          <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-[#5d564a]">
              Tiempo y Horario de Batido
            </span>
            <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
              {state.batidora.tiempoBatido ||
                (state.batidora.iniciado ? batidoTimer.formattedElapsed : '--')}
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Inicio: {state.batidora.horaInicio || '--:--'} · Fin:{' '}
              {state.batidora.horaFin || '--:--'}
            </span>
          </div>
        </div>
      </Card>

      {/* PASO 02: SABORIZADO Y RECETA */}
      <Card
        stepBadge="Paso 02"
        title={
          llevaAzucar
            ? 'Saborizado y Color del Yogur Con Azúcar'
            : 'Reparto de Yogur Sin Azúcar (Natural y Stevia)'
        }
        subtitle={
          llevaAzucar
            ? 'Anota el sabor, los mililitros de saborizante y colorante que le pusiste al lote dulce.'
            : 'Define cuántos litros van como Yogur Natural puro y cuántos llevan endulzante de Stevia.'
        }
        icon="local_Mall"
        tone={state.adiciones.registrado ? 'completed' : 'default'}
        statusBadge={
          state.adiciones.registrado
            ? { label: `Guardado (${state.adiciones.horaRegistro})`, variant: 'success' }
            : { label: 'Por guardar', variant: 'info' }
        }
        headerAction={
          <ConfirmButton
            confirmed={state.adiciones.registrado}
            confirmedLabel={`✓ Receta Guardada (${state.adiciones.horaRegistro})`}
            unconfirmedLabel="Confirmar Receta y Saborizado"
            icon="save"
            onConfirm={handleConfirmFormulacion}
          />
        }
      >
        {!llevaAzucar ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OPCIÓN 1: YOGUR NATURAL */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border-2 border-emerald-200 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 mb-4">
                  <h3 className="text-base font-black text-emerald-950">
                    1. Yogur Natural (Puro)
                  </h3>
                  <Badge variant="success">Sin Aditivos</Badge>
                </div>

                <InputField
                  label="Litros de Yogur Natural"
                  type="number"
                  min="0"
                  step="1"
                  unit="L"
                  value={variedadNatural.litrosBase}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onChange((p) => ({
                      ...p,
                      adiciones: {
                        ...p.adiciones,
                        variedadSinAzucar: {
                          ...variedadNatural,
                          litrosBase: val,
                        },
                      },
                    }));
                  }}
                />
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">
                  check_circle
                </span>
                <span>
                  No lleva azúcar, saborizante, colorante ni stevia. Pasa directo a envasar.
                </span>
              </div>
            </div>

            {/* OPCIÓN 2: YOGUR CON STEVIA */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-200 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-4">
                  <h3 className="text-base font-black text-amber-950">
                    2. Yogur Endulzado con Stevia
                  </h3>
                  <Badge variant="warning">Solo Stevia</Badge>
                </div>

                <div className="space-y-3">
                  <InputField
                    label="Litros con Stevia"
                    type="number"
                    min="0"
                    step="1"
                    unit="L"
                    value={variedadStevia.litrosBase}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onChange((p) => ({
                        ...p,
                        adiciones: {
                          ...p.adiciones,
                          variedadEstevia: {
                            ...variedadStevia,
                            litrosBase: val,
                          },
                        },
                      }));
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputField
                      label="Gramos de Stevia"
                      type="number"
                      min="0"
                      step="1"
                      unit="g"
                      value={variedadStevia.gramosEstevia}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onChange((p) => ({
                          ...p,
                          adiciones: {
                            ...p.adiciones,
                            variedadEstevia: {
                              ...variedadStevia,
                              gramosEstevia: val,
                            },
                          },
                        }));
                      }}
                    />

                    <InputField
                      label="Lote de Stevia"
                      type="text"
                      value={variedadStevia.loteEstevia}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        onChange((p) => ({
                          ...p,
                          adiciones: {
                            ...p.adiciones,
                            variedadEstevia: {
                              ...variedadStevia,
                              loteEstevia: val,
                            },
                          },
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LOTE CON AZÚCAR */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Litros Base de Yogur Dulce"
                type="number"
                min="1"
                step="1"
                unit="L"
                value={variedadDulce.litrosBase}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  const azucarCalc = Number(((val / 40) * 3.2).toFixed(2));
                  onChange((p) => ({
                    ...p,
                    adiciones: {
                      ...p.adiciones,
                      variedadAzucar: {
                        ...variedadDulce,
                        litrosBase: val,
                        kilosAzucar: azucarCalc,
                      },
                    },
                  }));
                }}
              />

              <InputField
                label="Azúcar del Lote (3.2 kg / 40 L)"
                type="number"
                step="0.1"
                min="0"
                unit="kg"
                value={variedadDulce.kilosAzucar}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onChange((p) => ({
                    ...p,
                    adiciones: {
                      ...p.adiciones,
                      variedadAzucar: {
                        ...variedadDulce,
                        kilosAzucar: val,
                      },
                    },
                  }));
                }}
              />

              <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5d564a] block">
                  Lote de Azúcar
                </label>
                <select
                  value={variedadDulce.loteAzucar || 'AZ-2026-10A'}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange((p) => ({
                      ...p,
                      adiciones: {
                        ...p.adiciones,
                        variedadAzucar: {
                          ...variedadDulce,
                          loteAzucar: val,
                        },
                      },
                    }));
                  }}
                  className="mt-1.5 w-full bg-white px-3 py-2.5 rounded-xl border border-[#d6ccb8] font-mono font-bold text-sm text-[#1e1b18] outline-none"
                >
                  <option value="AZ-2026-10A">AZ-2026-10A</option>
                  <option value="AZ-2026-10B">AZ-2026-10B</option>
                  <option value="AZ-2026-10C">AZ-2026-10C</option>
                </select>
                <span className="text-[11px] text-[#7a7164] mt-1 block">
                  Trazabilidad del bulto
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* BLOQUE SABORIZANTE */}
              <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#e6decb] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e6decb]">
                  <span className="text-xs font-black uppercase text-[#1e1b18] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-amber-700">
                      nutrition
                    </span>
                    Saborizante Líquido
                  </span>
                  <Badge variant="warning">En ml</Badge>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#5d564a] block mb-1">
                    Sabor del Yogur
                  </label>
                  <select
                    value={variedadDulce.sabor || 'Mora'}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange((p) => ({
                        ...p,
                        adiciones: {
                          ...p.adiciones,
                          variedadAzucar: {
                            ...variedadDulce,
                            sabor: val,
                          },
                        },
                      }));
                    }}
                    className="w-full bg-white px-3 py-2.5 rounded-xl border border-[#d6ccb8] font-bold text-sm text-[#1e1b18] outline-none"
                  >
                    <option value="Mora">Mora</option>
                    <option value="Fresa">Fresa</option>
                    <option value="Melocotón">Melocotón / Durazno</option>
                    <option value="Frutos Rojos">Frutos Rojos</option>
                    <option value="Vainilla">Vainilla</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    label="Cantidad de Saborizante"
                    type="number"
                    min="10"
                    step="10"
                    unit="ml"
                    value={variedadDulce.saborizanteMl || 800}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onChange((p) => ({
                        ...p,
                        adiciones: {
                          ...p.adiciones,
                          variedadAzucar: {
                            ...variedadDulce,
                            saborizanteMl: val,
                          },
                        },
                      }));
                    }}
                  />

                  <div className="p-3.5 bg-white rounded-xl border border-[#e6decb] flex flex-col justify-between">
                    <label className="text-[11px] font-bold uppercase text-[#5d564a] block">
                      Lote Saborizante
                    </label>
                    <select
                      value={variedadDulce.loteSaborizante || 'SAB-2026-10A'}
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange((p) => ({
                          ...p,
                          adiciones: {
                            ...p.adiciones,
                            variedadAzucar: {
                              ...variedadDulce,
                              loteSaborizante: val,
                            },
                          },
                        }));
                      }}
                      className="mt-1.5 w-full bg-[#fcfaf7] px-2.5 py-2 rounded-lg border border-[#d6ccb8] font-mono font-bold text-xs text-[#1e1b18] outline-none"
                    >
                      <option value="SAB-2026-10A">SAB-2026-10A</option>
                      <option value="SAB-2026-10B">SAB-2026-10B</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BLOQUE COLORANTE */}
              <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#e6decb] flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e6decb]">
                  <span className="text-xs font-black uppercase text-[#1e1b18] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-rose-700">
                      palette
                    </span>
                    Colorante Líquido
                  </span>
                  <Badge variant="info">En ml</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    label="Cantidad de Colorante"
                    type="number"
                    min="0"
                    step="5"
                    unit="ml"
                    value={variedadDulce.coloranteMl || 50}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onChange((p) => ({
                        ...p,
                        adiciones: {
                          ...p.adiciones,
                          variedadAzucar: {
                            ...variedadDulce,
                            coloranteMl: val,
                          },
                        },
                      }));
                    }}
                  />

                  <div className="p-3.5 bg-white rounded-xl border border-[#e6decb] flex flex-col justify-between">
                    <label className="text-[11px] font-bold uppercase text-[#5d564a] block">
                      Lote Colorante
                    </label>
                    <select
                      value={variedadDulce.loteColorante || 'COL-2026-10A'}
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange((p) => ({
                          ...p,
                          adiciones: {
                            ...p.adiciones,
                            variedadAzucar: {
                              ...variedadDulce,
                              loteColorante: val,
                            },
                          },
                        }));
                      }}
                      className="mt-1.5 w-full bg-[#fcfaf7] px-2.5 py-2 rounded-lg border border-[#d6ccb8] font-mono font-bold text-xs text-[#1e1b18] outline-none"
                    >
                      <option value="COL-2026-10A">COL-2026-10A</option>
                      <option value="COL-2026-10B">COL-2026-10B</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                  Agrega el colorante gota a gota mientras bate para que tome un tono parejo.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#efe9dc] flex items-center justify-between text-xs text-[#5d564a]">
          <span>
            Volumen total preparado en esta tolva:{' '}
            <strong className="font-mono text-[#1e1b18]">{totalLitrosAsignados} L</strong>
          </span>
          {state.adiciones.horaRegistro && (
            <span className="font-semibold text-emerald-800">
              ✓ Registrado a las {state.adiciones.horaRegistro}
            </span>
          )}
        </div>
      </Card>

      {/* AVANZAR A ETAPA 5 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#434655]">
          Cuando el yogur esté bien batido y saborizado en la tolva, pasa a{' '}
          <strong className="text-[#1e1b18]">5. Envasado y Rendimiento</strong>.
        </div>
        <Button
          variant="primary"
          size="lg"
          iconRight="arrow_forward"
          onClick={onNextStage}
          className="w-full sm:w-auto"
        >
          Ir a 5. Envasado y Rendimiento
        </Button>
      </div>
    </div>
  );
};
