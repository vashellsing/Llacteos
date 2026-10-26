import React from 'react';
import { EnvasadoYAlmacenamientoKumisState, KumisBatchData } from '../../../types/kumis';
import { getCurrentTimeString } from '../../../utils/timer';
import {
  StageHeader,
  Card,
  InputField,
  ConfirmButton,
  Button,
  Badge,
} from '../../../components/ui';

interface EnvasadoKumisStageProps {
  batch: KumisBatchData;
  onChange: (
    updater: (prev: EnvasadoYAlmacenamientoKumisState) => EnvasadoYAlmacenamientoKumisState
  ) => void;
  onFinalizeProcess: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const EnvasadoKumisStage: React.FC<EnvasadoKumisStageProps> = ({
  batch,
  onChange,
  onFinalizeProcess,
  onOpenReviewModal,
  showToast,
}) => {
  const state = batch.envasado;
  const pasteurizacion = batch.pasteurizacion;

  const u1L = state.formatos.botella1L ?? state.formatos.botella1000g ?? 30;
  const u2L = state.formatos.botella2L ?? 10;

  const litros1L = u1L * 1.0;
  const litros2L = u2L * 2.0;

  const totalUnidades = u1L + u2L;
  const totalLitrosEnvasados = Number((litros1L + litros2L).toFixed(2));

  const lecheBaseLitros = pasteurizacion.litrosLeche || 100;
  const rendimientoPct =
    lecheBaseLitros > 0 ? (totalLitrosEnvasados / lecheBaseLitros) * 100 : 0;
  const mermaLitros = Math.max(
    0,
    Number((lecheBaseLitros - totalLitrosEnvasados).toFixed(2))
  );

  const formatConfigs = [
    {
      key: 'botella1L' as const,
      label: 'Kumis 1 L',
      volumenTexto: '1 Litro',
      count: u1L,
      subtotalLitros: litros1L,
    },
    {
      key: 'botella2L' as const,
      label: 'Kumis 2 L',
      volumenTexto: '2 Litros',
      count: u2L,
      subtotalLitros: litros2L,
    },
  ];

  const handleIngresoCuartoFrioFinal = () => {
    const timeStr = getCurrentTimeString();
    onChange((prev) => ({
      ...prev,
      almacenamientoCuartoFrio: {
        ...prev.almacenamientoCuartoFrio,
        ingresado: true,
        horaIngreso: timeStr,
      },
    }));
    showToast(
      `✓ Botellas de Kumis guardadas en cuarto frío a las ${timeStr} (Reposo de 24 h a 3.0 °C antes de despacho).`,
      'success'
    );
  };

  const isCompleted =
    batch.processTimer.isCompleted || batch.status === 'COMPLETADO';

  return (
    <div className="flex flex-col w-full p-4 lg:p-6 gap-5 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-16">
      <StageHeader
        stageNumber={5}
        totalStages={5}
        lineName="Línea de Fermentados · Kumis"
        title="5. Envasado y Rendimiento (Kumis)"
        subtitle="Anota cuántas botellas de 1 L y 2 L salieron del lote, guarda el Kumis en cuarto frío y cierra el proceso."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'inventory_2',
            label: 'Total Envasado',
            value: `${totalLitrosEnvasados.toFixed(1)} L (${totalUnidades} u.)`,
            tone: 'amber',
          },
          {
            icon: 'trending_up',
            label: 'Rendimiento',
            value: `${rendimientoPct.toFixed(1)} %`,
            tone: 'emerald',
          },
        ]}
      />

      {/* PASO 01: CONTEO DE BOTELLAS DE KUMIS (1 L y 2 L) */}
      <Card
        stepBadge="Paso 01"
        title="Conteo de Botellas de Kumis (1 L y 2 L)"
        subtitle="Ingresa la cantidad de botellas de 1 Litro y 2 Litros que llenaste en este lote."
        icon="format_list_numbered"
        tone="default"
        statusBadge={{
          label: `${totalUnidades} botellas en total`,
          variant: 'info',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formatConfigs.map((fmt) => (
            <div
              key={fmt.key}
              className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#e6decb] flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-[#1e1b18]">
                    {fmt.label}
                  </span>
                  <Badge variant="neutral">{fmt.volumenTexto}</Badge>
                </div>

                <InputField
                  label="Botellas Llenadas"
                  type="number"
                  min="0"
                  step="1"
                  unit="botellas"
                  value={fmt.count}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    onChange((p) => ({
                      ...p,
                      formatos: { ...p.formatos, [fmt.key]: val },
                    }));
                  }}
                />
              </div>

              <div className="pt-2.5 border-t border-[#efe9dc] flex items-center justify-between text-xs">
                <span className="text-[#5d564a] font-bold">Subtotal Litros:</span>
                <span className="font-mono font-black text-amber-900 text-sm">
                  {fmt.subtotalLitros.toFixed(2)} L
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* PASO 02: BALANCE DE LITROS */}
      <Card
        stepBadge="Paso 02"
        title="Balance del Lote de Kumis"
        subtitle="Comparación entre la leche base de Kumis y los litros totales envasados."
        icon="scale"
        tone="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#e6decb]">
            <span className="text-[11px] font-bold uppercase text-[#5d564a]">
              Leche Base de Kumis
            </span>
            <div className="text-2xl font-black font-mono text-[#1e1b18] mt-1">
              {lecheBaseLitros} L
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Litros iniciales del lote
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-bold uppercase text-amber-900">
              Total Kumis Envasado
            </span>
            <div className="text-2xl font-black font-mono text-amber-950 mt-1">
              {totalLitrosEnvasados.toFixed(2)} L
            </div>
            <span className="text-[11px] text-amber-800 mt-1 block">
              Suma de botellas de 1 L y 2 L
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

      {/* PASO 03: CUARTO FRÍO ANTES DE DESPACHO */}
      <Card
        stepBadge="Paso 03"
        title="Entrada a Cuarto Frío de Producto Terminado (24 Horas)"
        subtitle="Guarda las botellas selladas a 3.0 °C durante 24 horas antes de sacarlas a despacho."
        icon="ac_unit"
        tone={state.almacenamientoCuartoFrio.ingresado ? 'completed' : 'default'}
        statusBadge={
          state.almacenamientoCuartoFrio.ingresado
            ? {
                label: `Guardado (${state.almacenamientoCuartoFrio.horaIngreso})`,
                variant: 'success',
              }
            : { label: 'Por registrar', variant: 'info' }
        }
        headerAction={
          <ConfirmButton
            confirmed={state.almacenamientoCuartoFrio.ingresado}
            confirmedLabel={`✓ En Cuarto Frío (${state.almacenamientoCuartoFrio.horaIngreso})`}
            unconfirmedLabel="Confirmar: Ya Guardé el Kumis en Cuarto Frío"
            icon="ac_unit"
            onConfirm={handleIngresoCuartoFrioFinal}
          />
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Lote en Etiqueta"
            type="text"
            value={state.loteProductoTerminado}
            onChange={(e) => {
              const val = e.target.value;
              onChange((p) => ({ ...p, loteProductoTerminado: val }));
            }}
          />

          <InputField
            label="Temperatura al Envasar"
            type="number"
            step="0.5"
            unit="°C"
            value={state.temperaturaEnvasado}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 6.5;
              onChange((p) => ({ ...p, temperaturaEnvasado: val }));
            }}
          />

          <InputField
            label="Temperatura Cuarto Frío"
            type="number"
            step="0.5"
            unit="°C"
            value={state.almacenamientoCuartoFrio.temperaturaAlmacenamiento}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 3.0;
              onChange((p) => ({
                ...p,
                almacenamientoCuartoFrio: {
                  ...p.almacenamientoCuartoFrio,
                  temperaturaAlmacenamiento: val,
                },
              }));
            }}
          />
        </div>
      </Card>

      {/* CIERRE DE LOTE DE KUMIS */}
      <Card
        stepBadge="Cierre del Lote"
        title={
          isCompleted
            ? '✓ Lote de Kumis Terminado y Guardado'
            : 'Cerrar Lote de Kumis y Ver Resumen'
        }
        subtitle="Al cerrar el proceso se detiene el reloj general de este Kumis y se abre la hoja de resumen del lote."
        icon={isCompleted ? 'verified' : 'flag_circle'}
        tone={isCompleted ? 'completed' : 'active'}
        headerAction={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {isCompleted && (
              <Button
                variant="secondary"
                icon="assignment"
                onClick={onOpenReviewModal}
              >
                Ver Resumen del Lote
              </Button>
            )}
            <Button
              variant={isCompleted ? 'success' : 'primary'}
              size="lg"
              icon={isCompleted ? 'verified' : 'flag_circle'}
              onClick={() => {
                if (isCompleted) {
                  onOpenReviewModal();
                } else {
                  onFinalizeProcess();
                }
              }}
            >
              {isCompleted
                ? 'Proceso Terminado · Ver Resumen'
                : 'Finalizar Lote de Kumis'}
            </Button>
          </div>
        }
      />
    </div>
  );
};
