import { useCallback, useMemo, useState } from 'react';
import {
  BatchData,
  ChildBatchReference,
  INITIAL_KUMIS_BATCH,
  INITIAL_YOGUR_BATCH,
  INITIAL_YOGUR_GRIEGO_BATCH,
  KumisBatchData,
  ParentMilkBatch,
  SplitMilkAllocationInput,
  StageId,
  SubBatchTabInfo,
  UserProfile,
  YogurBatchData,
  YogurGriegoBatchData,
} from '../types';
import {
  createInitial7CuerosBatch,
  createInitialIndustrialBatch,
  createInitialPeraBatch,
  createInitialPremiumBatch,
} from '../data/initialBatches';
import { formatSecondsToHMS, getCurrentTimeString } from '../utils/timer';
import { useIndependentBatchTimer } from './useProcessTimer';

export const STAGE_ORDER: StageId[] = [
  'acidificar',
  'calentar-y-cuajar',
  'desuerar',
  'hilar',
  'moldeo',
];

const FERMENTADOS_STAGE_LABELS: Record<StageId, string> = {
  acidificar: '1. Pasteurización',
  'calentar-y-cuajar': '2. Inoculación',
  desuerar: '3. Cuarto Frío / Mallas',
  hilar: '4. Batido y Sabores',
  moldeo: '5. Envasado',
};

const QUESOS_STAGE_LABELS: Record<StageId, string> = {
  acidificar: '1. Acidificar',
  'calentar-y-cuajar': '2. Calentar y Cuajar',
  desuerar: '3. Desuerar',
  hilar: '4. Hilar',
  moldeo: '5. Moldeo',
};

interface UseBatchManagerParams {
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export function useBatchManager({ showToast }: UseBatchManagerParams) {
  // Producto activo y línea activa
  const [selectedLineId, setSelectedLineId] = useState<string>('line-pasta-hilada');
  const [activeProductId, setActiveProductId] = useState<string>(
    'prod-doble-crema-premium'
  );

  // Etapa independiente por cada producto/lote hijo (para no perder la etapa al saltar entre sub-lotes)
  const [stagesByProduct, setStagesByProduct] = useState<Record<string, StageId>>({
    'prod-doble-crema-premium': 'acidificar',
    'prod-doble-crema-industrial': 'acidificar',
    'prod-queso-pera': 'acidificar',
    'prod-queso-7-cueros': 'acidificar',
    'prod-yogur': 'acidificar',
    'prod-kumis': 'acidificar',
    'prod-yogur-griego': 'acidificar',
  });

  const currentStage: StageId = stagesByProduct[activeProductId] || 'acidificar';

  const setCurrentStage = useCallback(
    (stage: StageId) => {
      setStagesByProduct((prev) => ({
        ...prev,
        [activeProductId]: stage,
      }));
    },
    [activeProductId]
  );

  // LOTE PADRE (Recepción / Pasteurización Base para Producción Divergente)
  const [parentBatch, setParentBatch] = useState<ParentMilkBatch>(() => ({
    id: 'LP-FERM-01',
    codigoLotePadre: 'LP-20261026-01',
    fechaProduccion: new Date().toISOString().slice(0, 10),
    responsable: 'Carlos Mendoza',
    totalMilkLiters: 250,
    allocatedLiters: 250,
    remainingLiters: 0,
    proveedorPrincipal: 'Hacienda San José',
    loteLecheProveedor: 'LECHE-2026-0918-A',
    isStarted: false,
    startedAt: null,
    isDivided: true,
    dividedAt: null,
    childBatches: [
      {
        id: INITIAL_YOGUR_BATCH.id,
        parentBatchId: 'LP-FERM-01',
        variant: 'yogur_con_azucar',
        productId: 'prod-yogur',
        productName: 'Yogur Entero Probiótico',
        allocatedLiters: INITIAL_YOGUR_BATCH.pasteurizacion.litrosLeche,
        llevaAzucar: true,
        targetInoculationTempRange: '42 – 45 °C',
        createdAt: '08:00 AM',
        status: 'en_proceso',
      },
      {
        id: INITIAL_KUMIS_BATCH.id,
        parentBatchId: 'LP-FERM-01',
        variant: 'kumis',
        productId: 'prod-kumis',
        productName: 'Kumis Tradicional',
        allocatedLiters: INITIAL_KUMIS_BATCH.pasteurizacion.litrosLeche,
        llevaAzucar: true,
        targetInoculationTempRange: '30 – 35 °C',
        createdAt: '08:00 AM',
        status: 'en_proceso',
      },
      {
        id: INITIAL_YOGUR_GRIEGO_BATCH.id,
        parentBatchId: 'LP-FERM-01',
        variant: 'yogur_griego',
        productId: 'prod-yogur-griego',
        productName: 'Yogur Griego',
        allocatedLiters: INITIAL_YOGUR_GRIEGO_BATCH.pasteurizacion.litrosLeche,
        llevaAzucar: false,
        targetInoculationTempRange: '42 – 45 °C',
        createdAt: '08:00 AM',
        status: 'en_proceso',
      },
    ],
  }));

  // LOTES DE PASTA HILADA (QUESOS)
  const [batchIndustrial, setBatchIndustrial] = useState<BatchData>(
    createInitialIndustrialBatch
  );
  const [batchPremium, setBatchPremium] = useState<BatchData>(
    createInitialPremiumBatch
  );
  const [batchPera, setBatchPera] = useState<BatchData>(createInitialPeraBatch);
  const [batch7Cueros, setBatch7Cueros] = useState<BatchData>(
    createInitial7CuerosBatch
  );

  // LOTES HIJOS DE FERMENTACIÓN (YOGUR, KUMIS, GRIEGO)
  const [batchYogur, setBatchYogur] =
    useState<YogurBatchData>(INITIAL_YOGUR_BATCH);
  const [batchKumis, setBatchKumis] =
    useState<KumisBatchData>(INITIAL_KUMIS_BATCH);
  const [batchYogurGriego, setBatchYogurGriego] =
    useState<YogurGriegoBatchData>(INITIAL_YOGUR_GRIEGO_BATCH);

  // Modales de resumen por línea
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [yogurReviewModalOpen, setYogurReviewModalOpen] =
    useState<boolean>(false);
  const [kumisReviewModalOpen, setKumisReviewModalOpen] =
    useState<boolean>(false);
  const [yogurGriegoReviewModalOpen, setYogurGriegoReviewModalOpen] =
    useState<boolean>(false);

  // CRONÓMETROS INDEPENDIENTES EN PARALELO PARA CADA LOTE
  // Ningún cronómetro depende de qué pestaña esté abierta; cada lote corre su propio reloj.
  useIndependentBatchTimer(batchIndustrial, setBatchIndustrial, 7200, 14400);
  useIndependentBatchTimer(batchPremium, setBatchPremium, 7200, 14400);
  useIndependentBatchTimer(batchPera, setBatchPera, 9000, 18000);
  useIndependentBatchTimer(batch7Cueros, setBatch7Cueros, 7200, 14400);
  useIndependentBatchTimer(batchYogur, setBatchYogur, 28800, 86400);
  useIndependentBatchTimer(batchKumis, setBatchKumis, 64800, 108000);
  useIndependentBatchTimer(batchYogurGriego, setBatchYogurGriego, 86400, 172800);

  // Flags de producto activo
  const isIndustrial = activeProductId === 'prod-doble-crema-industrial';
  const isQuesoPera = activeProductId === 'prod-queso-pera';
  const isQueso7Cueros = activeProductId === 'prod-queso-7-cueros';
  const isYogurGriego = activeProductId === 'prod-yogur-griego';
  const isKumis = activeProductId === 'prod-kumis';
  const isYogur = activeProductId === 'prod-yogur';
  const isFermentacionLine = isYogur || isKumis || isYogurGriego;

  const batch: BatchData = isIndustrial
    ? batchIndustrial
    : isQuesoPera
    ? batchPera
    : isQueso7Cueros
    ? batch7Cueros
    : batchPremium;

  const setBatch = isIndustrial
    ? setBatchIndustrial
    : isQuesoPera
    ? setBatchPera
    : isQueso7Cueros
    ? setBatch7Cueros
    : setBatchPremium;

  // Asignar operario responsable a TODOS los lotes (incluyendo Yogur Griego y Lote Padre)
  const assignOperatorToAllBatches = useCallback((user: UserProfile) => {
    const respName = user.name;
    const roleStr = `Operador Responsable · ${user.shift || 'Jornada Continua'}`;

    setParentBatch((prev) => ({ ...prev, responsable: respName }));
    setBatchIndustrial((prev) => ({
      ...prev,
      operator: respName,
      responsableProceso: respName,
      operatorRole: roleStr,
      operariosIntervinientes: [respName],
    }));
    setBatchPremium((prev) => ({
      ...prev,
      operator: respName,
      responsableProceso: respName,
      operatorRole: roleStr,
      operariosIntervinientes: [respName],
    }));
    setBatchPera((prev) => ({
      ...prev,
      operator: respName,
      responsableProceso: respName,
      operatorRole: roleStr,
      operariosIntervinientes: [respName],
    }));
    setBatch7Cueros((prev) => ({
      ...prev,
      operator: respName,
      responsableProceso: respName,
      operatorRole: roleStr,
      operariosIntervinientes: [respName],
    }));
    setBatchYogur((prev) => ({
      ...prev,
      operator: respName,
      responsableProceso: respName,
      operatorRole: roleStr,
      operariosIntervinientes: [respName],
    }));
    setBatchKumis((prev) => ({
      ...prev,
      operator: respName,
      responsableProceso: respName,
      operatorRole: roleStr,
      operariosIntervinientes: [respName],
    }));
    setBatchYogurGriego((prev) => ({
      ...prev,
      operator: respName,
      responsableProceso: respName,
      operatorRole: roleStr,
      operariosIntervinientes: [respName],
    }));
  }, []);

  // 1. INICIAR LOTE PADRE (Recepción / Pasteurización Base)
  const startParentBatch = useCallback(
    (params: {
      totalMilkLiters: number;
      loteLecheProveedor?: string;
      codigoLotePadre?: string;
    }) => {
      const timeStr = getCurrentTimeString();
      setParentBatch((prev) => ({
        ...prev,
        totalMilkLiters: params.totalMilkLiters,
        remainingLiters: Math.max(
          0,
          params.totalMilkLiters - prev.allocatedLiters
        ),
        loteLecheProveedor:
          params.loteLecheProveedor || prev.loteLecheProveedor,
        codigoLotePadre: params.codigoLotePadre || prev.codigoLotePadre,
        isStarted: true,
        startedAt: timeStr,
      }));
      showToast(
        `🥛 Lote Padre iniciado con ${params.totalMilkLiters} L de leche (${timeStr}).`,
        'info'
      );
    },
    [showToast]
  );

  // 2. DIVIDIR LOTE PADRE EN LOTES HIJOS (Yogur, Kumis, Griego)
  const splitParentBatch = useCallback(
    (input: SplitMilkAllocationInput) => {
      const timeStr = getCurrentTimeString();
      const now = Date.now();

      const litrosYogur =
        Math.max(0, Number(input.litrosYogurConAzucar) || 0) +
        Math.max(0, Number(input.litrosYogurSinAzucar) || 0);
      const litrosKumis = Math.max(0, Number(input.litrosKumis) || 0);
      const litrosGriego = Math.max(0, Number(input.litrosYogurGriego) || 0);
      const totalAllocated = litrosYogur + litrosKumis + litrosGriego;

      setParentBatch((prev) => {
        const baseTotal = input.totalParentLiters ?? prev.totalMilkLiters;
        const effectiveTotal = Math.max(baseTotal, totalAllocated);
        const remaining = Math.max(0, effectiveTotal - totalAllocated);
        const newChildren: ChildBatchReference[] = [];

        if (litrosYogur > 0) {
          newChildren.push({
            id: batchYogur.id,
            parentBatchId: prev.id,
            variant:
              (input.litrosYogurSinAzucar || 0) > 0 &&
              input.litrosYogurConAzucar === 0
                ? 'yogur_sin_azucar'
                : 'yogur_con_azucar',
            productId: 'prod-yogur',
            productName: 'Yogur Probiótico',
            allocatedLiters: litrosYogur,
            llevaAzucar: input.litrosYogurConAzucar > 0,
            targetInoculationTempRange: '42 – 45 °C',
            createdAt: timeStr,
            status:
              batchYogur.status === 'COMPLETADO' ? 'completado' : 'en_proceso',
          });
        }

        if (litrosKumis > 0) {
          newChildren.push({
            id: batchKumis.id,
            parentBatchId: prev.id,
            variant: 'kumis',
            productId: 'prod-kumis',
            productName: 'Kumis Tradicional',
            allocatedLiters: litrosKumis,
            llevaAzucar: true,
            targetInoculationTempRange: '30 – 35 °C',
            createdAt: timeStr,
            status:
              batchKumis.status === 'COMPLETADO' ? 'completado' : 'en_proceso',
          });
        }

        if (litrosGriego > 0) {
          newChildren.push({
            id: batchYogurGriego.id,
            parentBatchId: prev.id,
            variant: 'yogur_griego',
            productId: 'prod-yogur-griego',
            productName: 'Yogur Griego',
            allocatedLiters: litrosGriego,
            llevaAzucar: false,
            targetInoculationTempRange: '42 – 45 °C',
            createdAt: timeStr,
            status:
              batchYogurGriego.status === 'COMPLETADO'
                ? 'completado'
                : 'en_proceso',
          });
        }

        return {
          ...prev,
          totalMilkLiters: effectiveTotal,
          allocatedLiters: totalAllocated,
          remainingLiters: remaining,
          loteLecheProveedor: input.loteLeche || prev.loteLecheProveedor,
          isStarted: true,
          startedAt: prev.startedAt || timeStr,
          isDivided: true,
          dividedAt: timeStr,
          childBatches: newChildren,
        };
      });

      // Actualizar Lote Hijo 1: Yogur
      if (litrosYogur > 0) {
        setBatchYogur((prev) => ({
          ...prev,
          processTimer: prev.processTimer.isRunning
            ? prev.processTimer
            : {
                ...prev.processTimer,
                isRunning: true,
                isCompleted: false,
                startTime: timeStr,
                startTimestamp: now,
              },
          pasteurizacion: {
            ...prev.pasteurizacion,
            litrosLeche: litrosYogur,
            loteLeche: input.loteLeche || prev.pasteurizacion.loteLeche,
            incluyeKumis: litrosKumis > 0,
            litrosKumisDestinados: litrosKumis,
            divisionLeche: {
              ...prev.pasteurizacion.divisionLeche,
              litrosYogurConAzucar: input.litrosYogurConAzucar,
              litrosYogurSinAzucar: input.litrosYogurSinAzucar || 0,
              litrosKumis: litrosKumis,
              litrosYogurGriego: litrosGriego,
            },
          },
        }));
      }

      // Actualizar Lote Hijo 2: Kumis
      if (litrosKumis > 0) {
        setBatchKumis((prev) => ({
          ...prev,
          processTimer: prev.processTimer.isRunning
            ? prev.processTimer
            : {
                ...prev.processTimer,
                isRunning: true,
                isCompleted: false,
                startTime: timeStr,
                startTimestamp: now,
              },
          pasteurizacion: {
            ...prev.pasteurizacion,
            litrosLeche: litrosKumis,
            loteLeche: input.loteLeche || prev.pasteurizacion.loteLeche,
            azucar: {
              ...prev.pasteurizacion.azucar,
              cantidadKg: Math.round(litrosKumis * 0.04 * 100) / 100,
              cantidadGramos: Math.round(litrosKumis * 40),
            },
          },
        }));
      }

      // Actualizar Lote Hijo 3: Yogur Griego
      if (litrosGriego > 0) {
        setBatchYogurGriego((prev) => ({
          ...prev,
          processTimer: prev.processTimer.isRunning
            ? prev.processTimer
            : {
                ...prev.processTimer,
                isRunning: true,
                isCompleted: false,
                startTime: timeStr,
                startTimestamp: now,
              },
          pasteurizacion: {
            ...prev.pasteurizacion,
            litrosLeche: litrosGriego,
            loteLeche: input.loteLeche || prev.pasteurizacion.loteLeche,
            loteYogurSinAzucar:
              input.loteYogurSinAzucar ||
              prev.pasteurizacion.loteYogurSinAzucar ||
              `YSA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`,
          },
        }));
      }

      showToast(
        `✓ Lote Padre dividido en Lotes Hijos: Yogur (${litrosYogur} L), Kumis (${litrosKumis} L) y Griego (${litrosGriego} L). Relojes individuales activos.`,
        'success'
      );
    },
    [
      batchYogur.id,
      batchYogur.status,
      batchKumis.id,
      batchKumis.status,
      batchYogurGriego.id,
      batchYogurGriego.status,
      showToast,
    ]
  );

  // INICIAR CRONÓMETROS POR PRODUCTO
  const handleStartProcessTimer = useCallback(() => {
    const now = Date.now();
    const timeStr = getCurrentTimeString();

    setBatch((prev) => ({
      ...prev,
      processTimer: {
        ...prev.processTimer,
        isRunning: true,
        isCompleted: false,
        startTime: timeStr,
        startTimestamp: now,
        elapsedSeconds: 0,
        formattedTime: '00:00:00',
      },
      acidificar: {
        ...prev.acidificar,
        inicioCalentamiento: {
          iniciado: true,
          horaInicio: timeStr,
          timestampInicio: now,
        },
      },
    }));

    showToast(
      `⏱ Calentamiento iniciado a las ${timeStr} (${batch.productName}).`,
      'info'
    );
  }, [batch.productName, setBatch, showToast]);

  // DETENER EL CRONÓMETRO GENERAL DEL LOTE (Al terminar el hilado en paila)
  const handleStopProcessTimer = useCallback(
    (customEndTime?: string) => {
      const now = Date.now();
      const timeStr = customEndTime || getCurrentTimeString();

      setBatch((prev) => {
        const startTs = prev.processTimer.startTimestamp;
        const finalElapsedSec = startTs
          ? Math.max(
              prev.processTimer.elapsedSeconds,
              Math.floor((now - startTs) / 1000)
            )
          : prev.processTimer.elapsedSeconds;
        const computedHMS =
          finalElapsedSec > 0 ? formatSecondsToHMS(finalElapsedSec) : '01:45:20';
        const totalTime =
          prev.processTimer.formattedTime &&
          prev.processTimer.formattedTime !== '00:00:00'
            ? prev.processTimer.formattedTime
            : computedHMS;

        return {
          ...prev,
          processTimer: {
            ...prev.processTimer,
            isRunning: false,
            isCompleted: true,
            endTime: timeStr,
            endTimestamp: now,
            elapsedSeconds: finalElapsedSec,
            formattedTime: totalTime,
          },
          hilar: {
            ...prev.hilar,
            procesoFinalizado: {
              finalizado: true,
              horaFinalizacion: timeStr,
              tiempoTotalProceso: totalTime,
            },
          },
        };
      });

      showToast(
        `⏱ Cronómetro general de producción detenido a las ${timeStr}. Listo para moldeo.`,
        'info'
      );
    },
    [setBatch, showToast]
  );

  const handleStartProcessTimerYogur = useCallback(() => {
    const now = Date.now();
    const timeStr = getCurrentTimeString();

    setBatchYogur((prev) => ({
      ...prev,
      processTimer: {
        ...prev.processTimer,
        isRunning: true,
        isCompleted: false,
        startTime: timeStr,
        startTimestamp: now,
        elapsedSeconds: 0,
        formattedTime: '00:00:00',
      },
      stageStatuses: {
        ...prev.stageStatuses,
        acidificar: 'en_proceso',
      },
    }));

    showToast(`⏱ Reloj de Yogur en marcha desde las ${timeStr}.`, 'info');
  }, [showToast]);

  const handleStartProcessTimerKumis = useCallback(() => {
    const now = Date.now();
    const timeStr = getCurrentTimeString();

    setBatchKumis((prev) => ({
      ...prev,
      processTimer: {
        ...prev.processTimer,
        isRunning: true,
        isCompleted: false,
        startTime: timeStr,
        startTimestamp: now,
        elapsedSeconds: 0,
        formattedTime: '00:00:00',
      },
      stageStatuses: {
        ...prev.stageStatuses,
        acidificar: 'en_proceso',
      },
    }));

    showToast(`⏱ Reloj de Kumis en marcha desde las ${timeStr}.`, 'info');
  }, [showToast]);

  const handleStartProcessTimerYogurGriego = useCallback(() => {
    const now = Date.now();
    const timeStr = getCurrentTimeString();

    setBatchYogurGriego((prev) => ({
      ...prev,
      processTimer: {
        ...prev.processTimer,
        isRunning: true,
        isCompleted: false,
        startTime: timeStr,
        startTimestamp: now,
        elapsedSeconds: 0,
        formattedTime: '00:00:00',
      },
      stageStatuses: {
        ...prev.stageStatuses,
        acidificar: 'en_proceso',
      },
    }));

    showToast(
      `⏱ Reloj de Yogur Griego en marcha desde las ${timeStr}.`,
      'info'
    );
  }, [showToast]);

  // AVANZAR DE ETAPA EN EL SUB-LOTE ACTIVO
  const handleNextStage = useCallback(() => {
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIndex + 1];
      setCurrentStage(nextStage);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      if (isYogurGriego) {
        setBatchYogurGriego((prev) => ({
          ...prev,
          stageStatuses: {
            ...prev.stageStatuses,
            [currentStage]: 'completada',
            [nextStage]: 'en_proceso',
          },
        }));
      } else if (isKumis) {
        setBatchKumis((prev) => ({
          ...prev,
          stageStatuses: {
            ...prev.stageStatuses,
            [currentStage]: 'completada',
            [nextStage]: 'en_proceso',
          },
        }));
      } else if (isYogur) {
        setBatchYogur((prev) => ({
          ...prev,
          stageStatuses: {
            ...prev.stageStatuses,
            [currentStage]: 'completada',
            [nextStage]: 'en_proceso',
          },
        }));
      } else {
        setBatch((prev) => ({
          ...prev,
          stageStatuses: {
            ...prev.stageStatuses,
            [currentStage]: 'completada',
            [nextStage]: 'en_proceso',
          },
        }));
      }
    } else {
      if (isYogurGriego) {
        setYogurGriegoReviewModalOpen(true);
      } else if (isKumis) {
        setKumisReviewModalOpen(true);
      } else if (isYogur) {
        setYogurReviewModalOpen(true);
      } else {
        setReviewModalOpen(true);
      }
    }
  }, [
    currentStage,
    isKumis,
    isYogur,
    isYogurGriego,
    setBatch,
    setCurrentStage,
  ]);

  // FINALIZAR LOTES
  const handleFinalizeYogurGriegoBatch = useCallback(() => {
    const timeStr = getCurrentTimeString();
    const totalTime =
      batchYogurGriego.processTimer.formattedTime &&
      batchYogurGriego.processTimer.formattedTime !== '00:00:00'
        ? batchYogurGriego.processTimer.formattedTime
        : '36h 45m';

    setBatchYogurGriego((prev) => ({
      ...prev,
      status: 'COMPLETADO',
      processTimer: {
        ...prev.processTimer,
        isRunning: false,
        isCompleted: true,
        formattedTime: totalTime,
      },
      stageStatuses: {
        acidificar: 'completada',
        'calentar-y-cuajar': 'completada',
        desuerar: 'completada',
        hilar: 'completada',
        moldeo: 'completada',
      },
      envasado: {
        ...prev.envasado,
        procesoFinalizado: {
          finalizado: true,
          horaFinalizacion: timeStr,
          tiempoTotalProceso: totalTime,
        },
      },
    }));
    setYogurGriegoReviewModalOpen(true);
    showToast(
      `✓ Lote de Yogur Griego terminado y guardado (${totalTime}).`,
      'success'
    );
  }, [batchYogurGriego.processTimer.formattedTime, showToast]);

  const handleFinalizeKumisBatch = useCallback(() => {
    const timeStr = getCurrentTimeString();
    const totalTime =
      batchKumis.processTimer.formattedTime &&
      batchKumis.processTimer.formattedTime !== '00:00:00'
        ? batchKumis.processTimer.formattedTime
        : '20h 45m';

    setBatchKumis((prev) => ({
      ...prev,
      status: 'COMPLETADO',
      processTimer: {
        ...prev.processTimer,
        isRunning: false,
        isCompleted: true,
        formattedTime: totalTime,
      },
      stageStatuses: {
        acidificar: 'completada',
        'calentar-y-cuajar': 'completada',
        desuerar: 'completada',
        hilar: 'completada',
        moldeo: 'completada',
      },
      envasado: {
        ...prev.envasado,
        procesoFinalizado: {
          finalizado: true,
          horaFinalizacion: timeStr,
          tiempoTotalProceso: totalTime,
        },
      },
    }));
    setKumisReviewModalOpen(true);
    showToast(`✓ Lote de Kumis terminado y guardado (${totalTime}).`, 'success');
  }, [batchKumis.processTimer.formattedTime, showToast]);

  const handleFinalizeYogurBatch = useCallback(() => {
    const timeStr = getCurrentTimeString();
    const totalTime =
      batchYogur.processTimer.formattedTime &&
      batchYogur.processTimer.formattedTime !== '00:00:00'
        ? batchYogur.processTimer.formattedTime
        : '20h 30m';

    setBatchYogur((prev) => ({
      ...prev,
      status: 'COMPLETADO',
      processTimer: {
        ...prev.processTimer,
        isRunning: false,
        isCompleted: true,
        formattedTime: totalTime,
      },
      stageStatuses: {
        acidificar: 'completada',
        'calentar-y-cuajar': 'completada',
        desuerar: 'completada',
        hilar: 'completada',
        moldeo: 'completada',
      },
      envasado: {
        ...prev.envasado,
        procesoFinalizado: {
          finalizado: true,
          horaFinalizacion: timeStr,
          tiempoTotalProceso: totalTime,
        },
      },
    }));
    setYogurReviewModalOpen(true);
    showToast(`✓ Lote de Yogur terminado y guardado (${totalTime}).`, 'success');
  }, [batchYogur.processTimer.formattedTime, showToast]);

  const handleFinalizeBatch = useCallback(
    (openModal: boolean = true) => {
      const nowTs = Date.now();
      const timeStr = getCurrentTimeString();
      const finalElapsedSec = batch.processTimer.startTimestamp
        ? Math.max(
            batch.processTimer.elapsedSeconds,
            Math.floor((nowTs - batch.processTimer.startTimestamp) / 1000)
          )
        : batch.processTimer.elapsedSeconds;
      const computedHMS =
        finalElapsedSec > 0 ? formatSecondsToHMS(finalElapsedSec) : '01:45:20';
      const totalTime =
        batch.processTimer.formattedTime &&
        batch.processTimer.formattedTime !== '00:00:00'
          ? batch.processTimer.formattedTime
          : computedHMS;

      setBatch((prev) => ({
        ...prev,
        status: 'COMPLETADO',
        processTimer: {
          ...prev.processTimer,
          isRunning: false,
          isCompleted: true,
          elapsedSeconds: finalElapsedSec || prev.processTimer.elapsedSeconds,
          formattedTime: totalTime,
        },
        stageStatuses: {
          acidificar: 'completada',
          'calentar-y-cuajar': 'completada',
          desuerar: 'completada',
          hilar: 'completada',
          moldeo: 'completada',
        },
        calentarYCuajar: {
          ...prev.calentarYCuajar,
          cuajado: {
            ...prev.calentarYCuajar.cuajado,
            registrado: true,
            horaRegistro:
              prev.calentarYCuajar.cuajado.horaRegistro || timeStr,
          },
          corte: {
            ...prev.calentarYCuajar.corte,
            registrado: true,
            horaRegistro: prev.calentarYCuajar.corte.horaRegistro || timeStr,
          },
          temperatura40: {
            ...prev.calentarYCuajar.temperatura40,
            alcanzado: true,
            horaRegistro:
              prev.calentarYCuajar.temperatura40.horaRegistro || timeStr,
          },
        },
        desuerar: {
          ...prev.desuerar,
          desuerado: {
            ...prev.desuerar.desuerado,
            registrado: true,
            horaRegistro: prev.desuerar.desuerado.horaRegistro || timeStr,
          },
          escurrido: {
            ...prev.desuerar.escurrido,
            iniciado: true,
            completado: true,
            horaFin: prev.desuerar.escurrido.horaFin || timeStr,
          },
        },
        hilar: {
          ...prev.hilar,
          pruebaHilado: {
            ...prev.hilar.pruebaHilado,
            exitosa: true,
            horaRegistro: prev.hilar.pruebaHilado.horaRegistro || timeStr,
          },
          hiladoEnPaila: {
            ...prev.hilar.hiladoEnPaila,
            iniciado: true,
            completado: true,
            horaFin: prev.hilar.hiladoEnPaila?.horaFin || timeStr,
            duracion: prev.hilar.hiladoEnPaila?.duracion || '15 min',
          },
          extruirYAirear: {
            ...prev.hilar.extruirYAirear,
            completado: true,
            horaFin: prev.hilar.extruirYAirear.horaFin || timeStr,
            duracion: prev.hilar.extruirYAirear.duracion || '15 min',
          },
          procesoFinalizado: {
            finalizado: true,
            horaFinalizacion: timeStr,
            tiempoTotalProceso: totalTime,
          },
        },
      }));
      if (openModal) {
        setReviewModalOpen(true);
        showToast(
          `✓ Lote terminado (${totalTime}). Se detuvo el reloj del lote.`,
          'success'
        );
      }
    },
    [
      batch.processTimer.elapsedSeconds,
      batch.processTimer.formattedTime,
      batch.processTimer.startTimestamp,
      setBatch,
      showToast,
    ]
  );

  // Seleccionar producto o sub-lote (conserva la etapa en que iba ese sub-lote)
  const selectProductBatch = useCallback(
    (productId: string, silent: boolean = false) => {
      setActiveProductId(productId);
      if (
        productId === 'prod-yogur' ||
        productId === 'prod-kumis' ||
        productId === 'prod-yogur-griego'
      ) {
        setSelectedLineId('line-fermentacion');
      } else {
        setSelectedLineId('line-pasta-hilada');
      }

      if (!silent) {
        const names: Record<string, string> = {
          'prod-yogur': 'Yogur Probiótico',
          'prod-kumis': 'Kumis Tradicional',
          'prod-yogur-griego': 'Yogur Griego',
          'prod-doble-crema-industrial': 'Queso Doble Crema Industrial',
          'prod-doble-crema-premium': 'Queso Doble Crema Tradicional',
          'prod-queso-pera': 'Queso Pera',
          'prod-queso-7-cueros': 'Queso 7 Cueros',
        };
        showToast(
          `✓ Trabajando en: ${names[productId] || productId}.`,
          'info'
        );
      }
    },
    [showToast]
  );

  // PESTAÑAS PARA EL SELECTOR RÁPIDO DE SUB-LOTES
  const subBatchTabs = useMemo<SubBatchTabInfo[]>(() => {
    if (isFermentacionLine) {
      const yogurStage = stagesByProduct['prod-yogur'] || 'acidificar';
      const kumisStage = stagesByProduct['prod-kumis'] || 'acidificar';
      const griegoStage = stagesByProduct['prod-yogur-griego'] || 'acidificar';

      return [
        {
          productId: 'prod-yogur',
          batchId: batchYogur.id,
          shortName: 'Yogur',
          fullName: batchYogur.productName,
          icon: 'icecream',
          allocatedLiters: batchYogur.pasteurizacion.litrosLeche,
          currentStage: yogurStage,
          currentStageNumber: STAGE_ORDER.indexOf(yogurStage) + 1,
          stageLabel: FERMENTADOS_STAGE_LABELS[yogurStage],
          status: batchYogur.status,
          timer: batchYogur.processTimer,
          isChildOfParent: true,
        },
        {
          productId: 'prod-kumis',
          batchId: batchKumis.id,
          shortName: 'Kumis',
          fullName: batchKumis.productName,
          icon: 'local_drink',
          allocatedLiters: batchKumis.pasteurizacion.litrosLeche,
          currentStage: kumisStage,
          currentStageNumber: STAGE_ORDER.indexOf(kumisStage) + 1,
          stageLabel: FERMENTADOS_STAGE_LABELS[kumisStage],
          status: batchKumis.status,
          timer: batchKumis.processTimer,
          isChildOfParent: true,
        },
        {
          productId: 'prod-yogur-griego',
          batchId: batchYogurGriego.id,
          shortName: 'Yogur Griego',
          fullName: batchYogurGriego.productName,
          icon: 'filter_alt',
          allocatedLiters: batchYogurGriego.pasteurizacion.litrosLeche,
          currentStage: griegoStage,
          currentStageNumber: STAGE_ORDER.indexOf(griegoStage) + 1,
          stageLabel: FERMENTADOS_STAGE_LABELS[griegoStage],
          status: batchYogurGriego.status,
          timer: batchYogurGriego.processTimer,
          isChildOfParent: true,
        },
      ];
    }

    // Pestañas para Línea de Pasta Hilada (Quesos)
    const cheeseItems: {
      productId: string;
      shortName: string;
      icon: string;
      data: BatchData;
    }[] = [
      {
        productId: 'prod-doble-crema-premium',
        shortName: 'Doble Crema Trad.',
        icon: 'local_pizza',
        data: batchPremium,
      },
      {
        productId: 'prod-doble-crema-industrial',
        shortName: 'Doble Crema Ind.',
        icon: 'factory',
        data: batchIndustrial,
      },
      {
        productId: 'prod-queso-pera',
        shortName: 'Queso Pera',
        icon: 'spa',
        data: batchPera,
      },
      {
        productId: 'prod-queso-7-cueros',
        shortName: 'Queso 7 Cueros',
        icon: 'layers',
        data: batch7Cueros,
      },
    ];

    return cheeseItems.map((item) => {
      const st = stagesByProduct[item.productId] || 'acidificar';
      const liters =
        (item.data.acidificar.insumos.lecheFresca || 0) +
        (item.data.acidificar.insumos.lecheAcida || 0);
      return {
        productId: item.productId,
        batchId: item.data.id,
        shortName: item.shortName,
        fullName: item.data.productName,
        icon: item.icon,
        allocatedLiters: liters,
        currentStage: st,
        currentStageNumber: STAGE_ORDER.indexOf(st) + 1,
        stageLabel: QUESOS_STAGE_LABELS[st],
        status: item.data.status,
        timer: item.data.processTimer,
        isChildOfParent: false,
      };
    });
  }, [
    isFermentacionLine,
    stagesByProduct,
    batchYogur,
    batchKumis,
    batchYogurGriego,
    batchPremium,
    batchIndustrial,
    batchPera,
    batch7Cueros,
  ]);

  // Datos consolidados del encabezado / sidebar según el lote activo
  const activeHeaderBatch: BatchData = useMemo(() => {
    if (isYogurGriego) {
      return {
        ...batch,
        id: batchYogurGriego.id,
        productName: batchYogurGriego.productName,
        productId: batchYogurGriego.productId,
        line: batchYogurGriego.line,
        status: batchYogurGriego.status,
        processTimer: batchYogurGriego.processTimer,
      };
    }
    if (isKumis) {
      return {
        ...batch,
        id: batchKumis.id,
        productName: batchKumis.productName,
        productId: batchKumis.productId,
        line: batchKumis.line,
        status: batchKumis.status,
        processTimer: batchKumis.processTimer,
      };
    }
    if (isYogur) {
      return {
        ...batch,
        id: batchYogur.id,
        productName: batchYogur.productName,
        productId: batchYogur.productId,
        line: batchYogur.line,
        status: batchYogur.status,
        processTimer: batchYogur.processTimer,
      };
    }
    return batch;
  }, [batch, batchKumis, batchYogur, batchYogurGriego, isKumis, isYogur, isYogurGriego]);

  const activeStageStatuses = isYogurGriego
    ? batchYogurGriego.stageStatuses
    : isKumis
    ? batchKumis.stageStatuses
    : isYogur
    ? batchYogur.stageStatuses
    : batch.stageStatuses;

  const openActiveReviewModal = useCallback(() => {
    if (isYogurGriego) setYogurGriegoReviewModalOpen(true);
    else if (isKumis) setKumisReviewModalOpen(true);
    else if (isYogur) setYogurReviewModalOpen(true);
    else setReviewModalOpen(true);
  }, [isKumis, isYogur, isYogurGriego]);

  return {
    // Selección y Navegación de Etapa
    selectedLineId,
    setSelectedLineId,
    activeProductId,
    setActiveProductId,
    selectProductBatch,
    currentStage,
    setCurrentStage,
    handleNextStage,

    // Flags
    isIndustrial,
    isQuesoPera,
    isQueso7Cueros,
    isYogurGriego,
    isKumis,
    isYogur,
    isFermentacionLine,

    // Lote Padre y División Divergente
    parentBatch,
    startParentBatch,
    splitParentBatch,
    subBatchTabs,

    // Lotes Individuales
    batch,
    setBatch,
    batchIndustrial,
    setBatchIndustrial,
    batchPremium,
    setBatchPremium,
    batchPera,
    setBatchPera,
    batch7Cueros,
    setBatch7Cueros,
    batchYogur,
    setBatchYogur,
    batchKumis,
    setBatchKumis,
    batchYogurGriego,
    setBatchYogurGriego,

    // Datos activos para Header/Sidebar
    activeHeaderBatch,
    activeStageStatuses,

    // Inicio y detención de cronómetros
    handleStartProcessTimer,
    handleStopProcessTimer,
    handleStartProcessTimerYogur,
    handleStartProcessTimerKumis,
    handleStartProcessTimerYogurGriego,

    // Finalización de lotes
    handleFinalizeBatch,
    handleFinalizeYogurBatch,
    handleFinalizeKumisBatch,
    handleFinalizeYogurGriegoBatch,

    // Modales de resumen
    reviewModalOpen,
    setReviewModalOpen,
    yogurReviewModalOpen,
    setYogurReviewModalOpen,
    kumisReviewModalOpen,
    setKumisReviewModalOpen,
    yogurGriegoReviewModalOpen,
    setYogurGriegoReviewModalOpen,
    openActiveReviewModal,

    // Asignación de operario
    assignOperatorToAllBatches,
  };
}
