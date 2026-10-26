import React from 'react';
import {
  EnvasadoYAlmacenamientoYogurGriegoState,
  YogurGriegoBatchData,
} from '../../../types/yogur_griego';
import { getCurrentTimeString } from '../../../utils/timer';
import {
  StageHeader,
  Card,
  InputField,
  ConfirmButton,
  Button,
  Badge,
} from '../../../components/ui';

interface EnvasadoGriegoStageProps {
  batch: YogurGriegoBatchData;
  onChange: (
    updater: (
      prev: EnvasadoYAlmacenamientoYogurGriegoState
    ) => EnvasadoYAlmacenamientoYogurGriegoState
  ) => void;
  onFinalizeProcess: () => void;
  onOpenReviewModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const EnvasadoGriegoStage: React.FC<EnvasadoGriegoStageProps> = ({
  batch,
  onChange,
  onFinalizeProcess,
  onOpenReviewModal,
  showToast,
}) => {
  const state = batch.envasado;
  const lecheInicialL = batch.pasteurizacion.litrosLeche || 100;
  const masaFiltradaKg =
    batch.maduracionYFiltrado.filtradoTelas.masaFiltradaKg || 35;
  const formulacion = batch.batidoYAdiciones.formulacion;

  const sinEstevia1L = state.formatosSinEstevia?.tarro1L || 0;
  const sinEstevia500ml = state.formatosSinEstevia?.tarro500ml || 0;
  const kgEnvasadosSinEstevia = Number(
    (sinEstevia1L * 1.0 + sinEstevia500ml * 0.5).toFixed(2)
  );
  const unidadesSinEstevia = sinEstevia1L + sinEstevia500ml;

  const conEstevia1L = state.formatosConEstevia?.tarro1L || 0;
  const conEstevia500ml = state.formatosConEstevia?.tarro500ml || 0;
  const conEstevia120ml = state.formatosConEstevia?.vasito120ml || 0;
  const kgEnvasadosConEstevia = Number(
    (conEstevia1L * 1.0 + conEstevia500ml * 0.5 + conEstevia120ml * 0.12).toFixed(2)
  );
  const unidadesConEstevia = conEstevia1L + conEstevia500ml + conEstevia120ml;

  const totalUnidades = unidadesSinEstevia + unidadesConEstevia;
  const totalKgEnvasados = Number(
    (kgEnvasadosSinEstevia + kgEnvasadosConEstevia).toFixed(2)
  );

  const rendimientoLacteoPct =
    lecheInicialL > 0
      ? Number(((totalKgEnvasados / lecheInicialL) * 100).toFixed(1))
      : 0;
  const mermaKg = Number(
    Math.max(0, masaFiltradaKg - totalKgEnvasados).toFixed(2)
  );

  const handleIngresoCuartoFrio = () => {
    const timeStr = getCurrentTimeString();
    onChange((prev) => ({
      ...prev,
      selladoHermeticoVerificado: true,
      rotuladoCumpleNTC805: true,
      almacenamientoCuartoFrio: {
        ...prev.almacenamientoCuartoFrio,
        ingresado: true,
        horaIngreso: timeStr,
      },
    }));
    showToast(
      `✓ Yogur Griego (${totalKgEnvasados} kg en ${totalUnidades} envases) guardado en cuarto frío a las ${timeStr}.`,
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
        lineName="Línea de Fermentados · Yogur Griego"
        title="5. Envasado y Almacenamiento Final"
        subtitle="Anota cuántos tarros de 1000 g, 500 g y vasitos de 120 g (solo stevia) llenaste, guarda en cuarto frío y cierra el lote."
        standardBadge="NTC-805"
        metrics={[
          {
            icon: 'inventory_2',
            label: 'Total Envasado',
            value: `${totalKgEnvasados} kg (${totalUnidades} u.)`,
            tone: 'amber',
          },
          {
            icon: 'trending_up',
            label: 'Rendimiento Lácteo',
            value: `${rendimientoLacteoPct} %`,
            tone: 'emerald',
          },
        ]}
      />

      {/* PASO 01: CONTEO DE ENVASES POR VARIEDAD */}
      <Card
        stepBadge="Paso 01"
        title="Conteo de Tarros y Vasitos por Variedad"
        subtitle="Ingresa las unidades llenadas de Griego Sin Stevia y Griego Con Stevia."
        icon="format_list_numbered"
        tone="default"
        statusBadge={{
          label: `${totalUnidades} envases en total`,
          variant: 'info',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* VARIEDAD 1: GRIEGO SIN STEVIA */}
          <div className="p-5 rounded-2xl bg-emerald-50/40 border-2 border-emerald-200 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-800 block">
                    Variedad 1
                  </span>
                  <h3 className="text-base font-black text-emerald-950">
                    Griego Sin Stevia (Natural)
                  </h3>
                </div>
                <Badge variant="success">
                  Masa: {formulacion.variedadSinEstevia.masaKg} kg
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="Tarro 1000 g (1.0 kg)"
                  type="number"
                  min="0"
                  unit="und"
                  value={sinEstevia1L}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    onChange((prev) => ({
                      ...prev,
                      formatosSinEstevia: {
                        ...prev.formatosSinEstevia,
                        tarro1L: val,
                      },
                    }));
                  }}
                />

                <InputField
                  label="Tarro 500 g (0.5 kg)"
                  type="number"
                  min="0"
                  unit="und"
                  value={sinEstevia500ml}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    onChange((prev) => ({
                      ...prev,
                      formatosSinEstevia: {
                        ...prev.formatosSinEstevia,
                        tarro500ml: val,
                      },
                    }));
                  }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-200/80 flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-bold">
                Subtotal Sin Stevia:
              </span>
              <span className="font-mono font-black text-emerald-950 text-sm">
                {kgEnvasadosSinEstevia} kg ({unidadesSinEstevia} und)
              </span>
            </div>
          </div>

          {/* VARIEDAD 2: GRIEGO CON STEVIA */}
          <div className="p-5 rounded-2xl bg-amber-50/40 border-2 border-amber-200 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800 block">
                    Variedad 2
                  </span>
                  <h3 className="text-base font-black text-amber-950">
                    Griego Con Stevia
                  </h3>
                </div>
                <Badge variant="warning">
                  Masa: {formulacion.variedadConEstevia.masaKg} kg
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InputField
                  label="Tarro 1000 g"
                  type="number"
                  min="0"
                  unit="und"
                  value={conEstevia1L}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    onChange((prev) => ({
                      ...prev,
                      formatosConEstevia: {
                        ...prev.formatosConEstevia,
                        tarro1L: val,
                      },
                    }));
                  }}
                />

                <InputField
                  label="Tarro 500 g"
                  type="number"
                  min="0"
                  unit="und"
                  value={conEstevia500ml}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    onChange((prev) => ({
                      ...prev,
                      formatosConEstevia: {
                        ...prev.formatosConEstevia,
                        tarro500ml: val,
                      },
                    }));
                  }}
                />

                <InputField
                  label="Vasito 120 g (Solo Stevia)"
                  type="number"
                  min="0"
                  unit="und"
                  value={conEstevia120ml}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    onChange((prev) => ({
                      ...prev,
                      formatosConEstevia: {
                        ...prev.formatosConEstevia,
                        vasito120ml: val,
                      },
                    }));
                  }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-amber-200/80 flex items-center justify-between text-xs">
              <span className="text-amber-900 font-bold">
                Subtotal Con Stevia:
              </span>
              <span className="font-mono font-black text-amber-950 text-sm">
                {kgEnvasadosConEstevia} kg ({unidadesConEstevia} und)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* PASO 02: BALANCE DE MASA */}
      <Card
        stepBadge="Paso 02"
        title="Balance de Masa Filtrada vs. Empacada"
        subtitle="Revisa cuántos kilos de masa espesa obtuviste en los lienzos y cuántos quedaron envasados."
        icon="scale"
        tone="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#e6decb]">
            <span className="text-[11px] font-bold uppercase text-[#5d564a]">
              Leche Inicial
            </span>
            <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
              {lecheInicialL} L
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Antes de escurrir
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#fcfaf7] border border-[#e6decb]">
            <span className="text-[11px] font-bold uppercase text-[#5d564a]">
              Masa de Lienzos
            </span>
            <div className="text-xl font-black font-mono text-[#1e1b18] mt-1">
              {masaFiltradaKg} kg
            </div>
            <span className="text-[11px] text-[#7a7164] mt-1 block">
              Masa concentrada
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-bold uppercase text-amber-900">
              Total Envasado
            </span>
            <div className="text-xl font-black font-mono text-amber-950 mt-1">
              {totalKgEnvasados} kg
            </div>
            <span className="text-[11px] text-amber-800 mt-1 block">
              Merma en tolva: {mermaKg} kg
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold uppercase text-emerald-900">
              Rendimiento Lácteo
            </span>
            <div className="text-xl font-black font-mono text-emerald-800 mt-1">
              {rendimientoLacteoPct} %
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">
              Sobre leche inicial
            </span>
          </div>
        </div>
      </Card>

      {/* PASO 03: ETIQUETADO Y CUARTO FRÍO */}
      <Card
        stepBadge="Paso 03"
        title="Etiquetado y Guardado en Cuarto Frío (4.0 °C)"
        subtitle="Verifica el sellado de los tarros, anota el lote de etiqueta y guarda el Griego en cuarto frío antes de despacho."
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
            unconfirmedLabel="Confirmar: Ya Guardé el Griego en Cuarto Frío"
            icon="ac_unit"
            onConfirm={handleIngresoCuartoFrio}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              const val = Number(e.target.value);
              onChange((p) => ({ ...p, temperaturaEnvasado: val }));
            }}
            hint="Máximo recomendado: 6.0 °C"
          />

          <InputField
            label="Fecha de Vencimiento (+30 días)"
            type="text"
            value={state.fechaVencimiento}
            onChange={(e) => {
              const val = e.target.value;
              onChange((p) => ({ ...p, fechaVencimiento: val }));
            }}
          />
        </div>
      </Card>

      {/* CIERRE DE LOTE GRIEGO */}
      <Card
        stepBadge="Cierre del Lote"
        title={
          isCompleted
            ? '✓ Lote de Yogur Griego Terminado y Guardado'
            : 'Cerrar Lote de Yogur Griego y Ver Resumen'
        }
        subtitle="Al cerrar el proceso se detiene el reloj general de este Yogur Griego y se abre la hoja de resumen del lote."
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
                : 'Finalizar Lote de Yogur Griego'}
            </Button>
          </div>
        }
      />
    </div>
  );
};
