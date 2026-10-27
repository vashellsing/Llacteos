import React, { useState, useMemo, useEffect } from 'react';
import {
  StageHeader,
  Card,
  InputField,
  PopoverTimePicker,
  Button,
  Badge,
} from '../../../components/ui';
import { YogurBatchData, EnvasadoYAlmacenamientoYogurState } from '../../../types/yogur';
import { KumisBatchData, EnvasadoYAlmacenamientoKumisState } from '../../../types/kumis';
import { getCurrentTimeString } from '../../../utils/timer';

export interface FormatConfig {
  key: string;
  label: string;
  volumenTexto: string;
  litrosPorUnidad: number;
  placeholder: string;
}

const FORMAT_CONFIGS_YOGUR: FormatConfig[] = [
  {
    key: 'botella200ml',
    label: 'Botella 200 ml',
    volumenTexto: '200 ml (0.2 L)',
    litrosPorUnidad: 0.2,
    placeholder: 'Ej: 100',
  },
  {
    key: 'botella1L',
    label: 'Botella 1 L',
    volumenTexto: '1 Litro',
    litrosPorUnidad: 1.0,
    placeholder: 'Ej: 40',
  },
  {
    key: 'botella2L',
    label: 'Botella 2 L',
    volumenTexto: '2 Litros',
    litrosPorUnidad: 2.0,
    placeholder: 'Ej: 15',
  },
  {
    key: 'bolsa4L',
    label: 'Bolsa 4 L',
    volumenTexto: '4 Litros',
    litrosPorUnidad: 4.0,
    placeholder: 'Ej: 5',
  },
];

const FORMAT_CONFIGS_KUMIS: FormatConfig[] = [
  {
    key: 'botella1L',
    label: 'Botella Kumis 1 L',
    volumenTexto: '1 Litro',
    litrosPorUnidad: 1.0,
    placeholder: 'Ej: 60',
  },
  {
    key: 'botella2L',
    label: 'Botella Kumis 2 L',
    volumenTexto: '2 Litros',
    litrosPorUnidad: 2.0,
    placeholder: 'Ej: 20',
  },
];

export interface EnvasadoStageCommonProps {
  productType: 'yogur' | 'kumis';
  batch: YogurBatchData | KumisBatchData;
  onChange: (
    updater: (
      prev: EnvasadoYAlmacenamientoYogurState | EnvasadoYAlmacenamientoKumisState
    ) => EnvasadoYAlmacenamientoYogurState | EnvasadoYAlmacenamientoKumisState
  ) => void;
  onFinalizeProcess: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const EnvasadoStageCommon: React.FC<EnvasadoStageCommonProps> = ({
  productType,
  batch,
  onChange,
  onOpenReviewModal,
  showToast,
}) => {
  const isYogur = productType === 'yogur';
  const state = batch.envasado;
  const pasteurizacion = (batch as any).pasteurizacion || {};
  const lecheBaseLitros = pasteurizacion.litrosLeche || 100;

  const formatConfigs = isYogur ? FORMAT_CONFIGS_YOGUR : FORMAT_CONFIGS_KUMIS;

  // =========================================================================
  // PASO 01: CONTEO DE ENVASES Y EDICIÓN MANUAL
  // =========================================================================
  const [cantidades, setCantidades] = useState<{ [key: string]: number | '' }>(() => {
    const initial: { [key: string]: number | '' } = {};
    formatConfigs.forEach((fmt) => {
      const existingVal = (state.formatos as any)?.[fmt.key];
      initial[fmt.key] = existingVal && existingVal > 0 ? existingVal : '';
    });
    return initial;
  });

  const hasInitialSaved = useMemo(() => {
    return Object.values(cantidades).some((v) => typeof v === 'number' && v > 0);
  }, [cantidades]);

  const [isManualFormatos, setIsManualFormatos] = useState<boolean>(false);
  const [isFormatosBloqueados, setIsFormatosBloqueados] = useState<boolean>(() => {
    return hasInitialSaved;
  });

  const handleFormatChange = (key: string, valStr: string) => {
    const val = valStr === '' ? '' : Math.max(0, parseInt(valStr, 10) || 0);
    setCantidades((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleGuardarFormatos = () => {
    const updatedFormatos: { [key: string]: number } = {};
    formatConfigs.forEach((fmt) => {
      const v = cantidades[fmt.key];
      updatedFormatos[fmt.key] = typeof v === 'number' ? v : 0;
    });

    onChange((prev: any) => ({
      ...prev,
      formatos: {
        ...(prev.formatos || {}),
        ...updatedFormatos,
      },
    }));

    setIsFormatosBloqueados(true);
    setIsManualFormatos(false);
    showToast('✓ Conteo de envases guardado exitosamente. Inputs bloqueados.', 'success');
  };

  // Totales y cálculos matemáticos
  const totalUnidades = useMemo(() => {
    return formatConfigs.reduce((acc, fmt) => {
      const count = typeof cantidades[fmt.key] === 'number' ? (cantidades[fmt.key] as number) : 0;
      return acc + count;
    }, 0);
  }, [formatConfigs, cantidades]);

  const totalLitrosEnvasados = useMemo(() => {
    const sum = formatConfigs.reduce((acc, fmt) => {
      const count = typeof cantidades[fmt.key] === 'number' ? (cantidades[fmt.key] as number) : 0;
      return acc + count * fmt.litrosPorUnidad;
    }, 0);
    return Number(sum.toFixed(2));
  }, [formatConfigs, cantidades]);

  const rendimientoPct = useMemo(() => {
    return lecheBaseLitros > 0 ? (totalLitrosEnvasados / lecheBaseLitros) * 100 : 0;
  }, [totalLitrosEnvasados, lecheBaseLitros]);

  const mermaLitros = useMemo(() => {
    return Math.max(0, Number((lecheBaseLitros - totalLitrosEnvasados).toFixed(2)));
  }, [lecheBaseLitros, totalLitrosEnvasados]);

  // =========================================================================
  // PASO 03: ENTRADA A CUARTO FRÍO (SIMPLIFICACIÓN EXTREMA: SOLO TIEMPO)
  // =========================================================================
  const isIngresadoCuartoFrio = Boolean(state.almacenamientoCuartoFrio?.ingresado);
  const [manualPaso3, setManualPaso3] = useState<boolean>(false);
  const [horaManualIngreso, setHoraManualIngreso] = useState<string>(
    state.almacenamientoCuartoFrio?.horaIngreso || getCurrentTimeString()
  );

  useEffect(() => {
    if (!manualPaso3 && state.almacenamientoCuartoFrio?.horaIngreso) {
      setHoraManualIngreso(state.almacenamientoCuartoFrio.horaIngreso);
    }
  }, [manualPaso3, state.almacenamientoCuartoFrio?.horaIngreso]);

  const handleIngresoCuartoFrioFinal = () => {
    const timeStr = getCurrentTimeString();
    onChange((prev: any) => ({
      ...prev,
      almacenamientoCuartoFrio: {
        ...prev.almacenamientoCuartoFrio,
        ingresado: true,
        horaIngreso: timeStr,
      },
    }));
    showToast(
      `✓ ¡Producto ingresado al cuarto frío! Hora registrada: ${timeStr}.`,
      'success'
    );
  };

  const handleSaveManualIngreso = () => {
    onChange((prev: any) => ({
      ...prev,
      almacenamientoCuartoFrio: {
        ...prev.almacenamientoCuartoFrio,
        ingresado: true,
        horaIngreso: horaManualIngreso,
      },
    }));
    showToast(
      `✓ Hora de ingreso a cuarto frío actualizada a ${horaManualIngreso}.`,
      'success'
    );
  };

  const areInputsLocked = isFormatosBloqueados && !isManualFormatos;

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-16">
      {/* CABECERA ESTÁNDAR MAESTRA */}
      <StageHeader
        stageNumber={4}
        totalStages={4}
        lineName={isYogur ? 'Línea de Fermentados · Yogur' : 'Línea de Fermentados · Kumis'}
        title="4. Envasar y Guardar"
        subtitle="Conteo de envases por presentación comercial, balance y rendimiento del lote, y traslado final a cuarto frío."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'inventory_2',
            label: 'Total Envasado',
            value: `${totalLitrosEnvasados.toFixed(1)} L (${totalUnidades} u.)`,
            tone: 'amber',
          },
          {
            icon: 'verified',
            label: 'Rendimiento',
            value: `${rendimientoPct.toFixed(1)} %`,
            tone: 'emerald',
          },
        ]}
      />

      {/* ========================================================================= */}
      {/* PASO 01: CONTEO DE ENVASES Y RENDIMIENTO CON EDICIÓN MANUAL Y GUARDAR     */}
      {/* ========================================================================= */}
      <Card
        stepBadge="Paso 01"
        title="Conteo de Envases y Presentaciones"
        subtitle="Ingresa la cantidad de unidades obtenidas en cada presentación comercial producida."
        icon="format_list_numbered"
        tone={hasInitialSaved ? 'completed' : 'default'}
        statusBadge={{
          label: `${totalUnidades} unidades · ${totalLitrosEnvasados.toFixed(2)} L`,
          variant: totalUnidades > 0 ? 'success' : 'info',
        }}
        headerAction={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#5d564a] bg-[#f4efe6] px-3 py-1.5 rounded-lg border border-[#e6decb] hover:bg-[#ede5d6] transition-colors">
              <input
                type="checkbox"
                checked={isManualFormatos}
                onChange={(e) => setIsManualFormatos(e.target.checked)}
                className="rounded border-[#cfc4b0] text-[#1e1b18] focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>Habilitar edición manual</span>
            </label>

            {/* Botón de Guardar para bloquear inputs tras edición manual */}
            <Button
              variant={areInputsLocked ? 'secondary' : 'primary'}
              size="md"
              icon={areInputsLocked ? 'lock' : 'save'}
              onClick={handleGuardarFormatos}
              disabled={areInputsLocked}
              className="font-bold shadow-2xs"
            >
              {areInputsLocked ? '✓ Guardado y Bloqueado' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            isYogur ? 'lg:grid-cols-4' : 'lg:grid-cols-2'
          } gap-4`}
        >
          {formatConfigs.map((fmt) => {
            const countVal = cantidades[fmt.key];
            const subtotalLitros =
              (typeof countVal === 'number' ? countVal : 0) * fmt.litrosPorUnidad;

            return (
              <div
                key={fmt.key}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                  areInputsLocked
                    ? 'bg-[#f8f5ee] border-[#e6decb]'
                    : 'bg-white border-[#d6ccb8] shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#1e1b18]">
                      {fmt.label}
                    </span>
                    <Badge variant="neutral">{fmt.volumenTexto}</Badge>
                  </div>

                  <InputField
                    label="Unidades Llenadas"
                    type="number"
                    min="0"
                    step="1"
                    unit="unid."
                    disabled={areInputsLocked}
                    readOnly={areInputsLocked}
                    placeholder={fmt.placeholder}
                    value={countVal === '' ? '' : countVal}
                    onChange={(e) => handleFormatChange(fmt.key, e.target.value)}
                  />
                </div>

                <div className="pt-2.5 border-t border-[#efe9dc] flex items-center justify-between text-xs">
                  <span className="text-[#5d564a] font-bold">Subtotal Litros:</span>
                  <span className="font-mono font-black text-amber-900 text-sm">
                    {subtotalLitros.toFixed(2)} L
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* PASO 02: BALANCE DEL LOTE (RESUMEN Y RENDIMIENTO)                         */}
      {/* ========================================================================= */}
      <Card
        stepBadge="Paso 02"
        title="Balance del Lote y Rendimiento"
        subtitle="Comparación entre la leche base inicial y el volumen envasado para determinar la merma del proceso."
        icon="scale"
        tone="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#e6decb]">
            <span className="text-[11px] font-bold uppercase text-[#5d564a]">
              Leche Base del Lote
            </span>
            <div className="text-2xl font-black font-mono text-[#1e1b18] mt-1">
              {lecheBaseLitros} L
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Litros procesados desde Etapa 1
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-bold uppercase text-amber-900">
              Total Litros Envasados
            </span>
            <div className="text-2xl font-black font-mono text-amber-950 mt-1">
              {totalLitrosEnvasados.toFixed(2)} L
            </div>
            <span className="text-[11px] text-amber-800 mt-1 block">
              Suma de todas las presentaciones ({totalUnidades} u.)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold uppercase text-emerald-900">
              Rendimiento del Lote
            </span>
            <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
              {rendimientoPct.toFixed(1)} %
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">
              Merma normal de proceso: {mermaLitros.toFixed(2)} L
            </span>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* PASO 03: ENTRADA A CUARTO FRÍO (SIN NINGÚN CAMPO NI LABEL DE TEMPERATURA) */}
      {/* ========================================================================= */}
      <Card
        stepBadge="Paso 03"
        title="Entrada a Cuarto Frío"
        subtitle="Registra el traslado de los envases terminados y sellados al cuarto frío para su estabilización."
        icon="kitchen"
        tone={isIngresadoCuartoFrio ? 'completed' : 'default'}
        statusBadge={
          isIngresadoCuartoFrio
            ? {
                label: `En Cuarto Frío (${state.almacenamientoCuartoFrio?.horaIngreso || 'Listo'}) ✓`,
                variant: 'success',
              }
            : { label: 'Por ingresar', variant: 'info' }
        }
        headerAction={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#5d564a] bg-[#f4efe6] px-3 py-1.5 rounded-lg border border-[#e6decb] hover:bg-[#ede5d6] transition-colors">
              <input
                type="checkbox"
                checked={manualPaso3}
                onChange={(e) => setManualPaso3(e.target.checked)}
                className="rounded border-[#cfc4b0] text-[#1e1b18] focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>Habilitar edición manual</span>
            </label>

            {/* Botón único de confirmación tipo "¡Producto ingresado al cuarto frío!" */}
            <Button
              variant={isIngresadoCuartoFrio ? 'secondary' : 'primary'}
              size="md"
              icon="kitchen"
              onClick={handleIngresoCuartoFrioFinal}
              className={
                isIngresadoCuartoFrio
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                  : 'font-bold shadow-sm'
              }
            >
              {isIngresadoCuartoFrio
                ? `✓ ¡Producto ingresado al cuarto frío! (${state.almacenamientoCuartoFrio?.horaIngreso || 'OK'})`
                : '¡Producto ingresado al cuarto frío!'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {manualPaso3 ? (
            <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 flex flex-col sm:flex-row items-end gap-3 justify-between">
              <div className="w-full sm:max-w-xs">
                <PopoverTimePicker
                  label="Hora de ingreso al cuarto frío"
                  icon="schedule"
                  hint="Toca para desplegar selector flotante (hh:mm:ss a)"
                  value={horaManualIngreso}
                  onChange={setHoraManualIngreso}
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                icon="save"
                onClick={handleSaveManualIngreso}
                className="w-full sm:w-auto font-bold"
              >
                Guardar Hora de Ingreso
              </Button>
            </div>
          ) : (
            <div className="p-3.5 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-emerald-600">
                  {isIngresadoCuartoFrio ? 'check_circle' : 'info'}
                </span>
                <span className="text-xs text-[#5d564a]">
                  {isIngresadoCuartoFrio
                    ? `Los envases terminados se encuentran en cuarto frío desde las ${state.almacenamientoCuartoFrio?.horaIngreso}.`
                    : 'Pulsa el botón de confirmación cuando todos los envases sellados hayan sido trasladados al cuarto frío.'}
                </span>
              </div>
              {isIngresadoCuartoFrio && (
                <span className="font-mono font-black text-emerald-800 text-sm">
                  {state.almacenamientoCuartoFrio?.horaIngreso}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* BARRA INFERIOR (FOOTER): VER RESUMEN + TERMINAR LOTE                     */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e6decb] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div className="text-xs sm:text-sm text-[#434655]">
            <p className="font-bold text-[#1e1b18]">
              Cierre de Lote y Rendimiento Final
            </p>
            <p>
              Total envasado: <strong>{totalLitrosEnvasados.toFixed(2)} L</strong> ({totalUnidades} unidades) · Rendimiento: <strong>{rendimientoPct.toFixed(1)} %</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          {/* Botón Secundario: Ver resumen */}
          <Button
            variant="outline"
            size="lg"
            icon="description"
            onClick={onOpenReviewModal}
            className="font-bold"
          >
            Ver resumen
          </Button>

          {/* Botón Principal: Terminar lote */}
          <Button
            variant="primary"
            size="xl"
            icon="verified"
            disabled={totalUnidades === 0}
            onClick={onOpenReviewModal}
            className="font-bold shadow-md"
          >
            Terminar lote
          </Button>
        </div>
      </div>
    </div>
  );
};
