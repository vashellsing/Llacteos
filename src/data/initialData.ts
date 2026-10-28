import { AuditLogEntry, ProductDefinition, ProductionLine, UserProfile } from '../types';

export const INITIAL_PRODUCTS: ProductDefinition[] = [
  // 1. PRODUCTOS DE PASTA HILADA
  {
    id: 'prod-doble-crema-premium',
    name: 'Queso Doble Crema Premium (Tradicional)',
    code: 'QDC-PREM',
    lineType: 'pasta_hilada',
    description: 'Proceso tradicional y artesanal premium de pasta hilada con doble crema de alta materia grasa, amasado manual de hebra en paila y moldeo microperforado.',
    standards: 'Norma Técnica Colombiana NTC-589',
    isTargetProduct: true,
  },
  {
    id: 'prod-doble-crema-industrial',
    name: 'Queso Doble Crema Industrial',
    code: 'QDC-IND',
    lineType: 'pasta_hilada',
    description: 'Proceso industrial estandarizado a gran escala: Tina mecanizada, acidificación a 35 °C, cuajado enzimático, desuerado a 40 °C, hiladora continua de doble sinfín a 65 °C, extrusión y aireado combinados.',
    standards: 'Norma Técnica Colombiana NTC-589 / Resolución 2310 de 1986',
    isTargetProduct: false,
  },
  {
    id: 'prod-queso-pera',
    name: 'Queso Pera',
    code: 'QP-2026',
    lineType: 'pasta_hilada',
    description: 'Queso fresco de pasta hilada semicocida con forma característica de pera o lágrima. Incluye etapa inicial de premaduración con cultivo lácteo dosificado en unidades, cuajado enzimático, desuerado a 40 °C, hilado elástico y moldeo artesanal.',
    standards: 'Norma Técnica Colombiana NTC-589',
    isTargetProduct: true,
  },
  {
    id: 'prod-queso-7-cueros',
    name: 'Queso 7 Cueros',
    code: 'Q7C-2026',
    lineType: 'pasta_hilada',
    description: 'Queso fresco de pasta hilada en capas o cintas. Proceso que incluye acidificación, cuajado, desuerado, hilado y moldeo.',
    standards: 'Norma Técnica Colombiana NTC-589',
    isTargetProduct: true,
  },

  // 2. PRODUCTOS DE FERMENTACIÓN
  {
    id: 'prod-yogur',
    name: 'Yogur Entero',
    code: 'YOG-101',
    lineType: 'fermentacion',
    description: 'Leche entera pasteurizada e inoculada con cultivos lácticos específicos. Incluye tratamiento térmico a 85-90 °C, enfriamiento a 45 °C, inoculación (8 h), maduración en frío (12 h), batido con adición de saborizante natural/azúcar y envasado.',
    standards: 'NTC-805 (Productos Lácteos Fermentados)',
    isTargetProduct: true,
  },
  {
    id: 'prod-kumis',
    name: 'Kumis Tradicional Fermentado',
    code: 'KUM-102',
    lineType: 'fermentacion',
    description: 'Leche entera pasteurizada e inoculada con cultivo láctico específico para kumis. Incluye tratamiento térmico a 85-90 °C, enfriamiento a 45 °C, inoculación (8 h), maduración en frío (12 h), batido con adición de endulzante (sin saborizantes) y envasado.',
    standards: 'NTC-805',
    isTargetProduct: true,
  },
  {
    id: 'prod-yogur-griego',
    name: 'Yogur Griego',
    code: 'YGR-103',
    lineType: 'fermentacion',
    description: 'Producto lácteo fermentado de alta densidad y cremosidad. Incluye pasteurización a 85-90 °C, enfriamiento a 45 °C, inoculación (8 h), maduración en frío (12 h), proceso especial de filtrado en telas (16 h), batido con crema de leche y estevia opcional, y envasado.',
    standards: 'NTC-805 (Productos Lácteos Fermentados)',
    isTargetProduct: true,
  },

  // 3. PRODUCTOS DE DULCES
  {
    id: 'prod-manjar',
    name: 'Manjar Blanco / Arequipe de Olla',
    code: 'MNJ-201',
    lineType: 'dulces',
    description: 'Concentración térmica de leche fresca con sacarosa, glucosa y neutralizante en marmita a vapor hasta 68° Brix.',
    standards: 'NTC-3757 (Arequipe o Dulce de Leche y Manjar Blanco)',
    isTargetProduct: false,
  },
  {
    id: 'prod-panelitas',
    name: 'Panelitas de Leche y Azúcar',
    code: 'PNL-202',
    lineType: 'dulces',
    description: 'Evaporación profunda de leche con panela/azúcar, batido en bateas de enfriamiento y corte manual en pastillas rectangulares.',
    standards: 'NTC-3757',
    isTargetProduct: false,
  },
  {
    id: 'prod-cortado',
    name: 'Dulce de Leche Cortada',
    code: 'DTC-203',
    lineType: 'dulces',
    description: 'Dulce tradicional preparado mediante coagulación intencional de la leche con jugo cítrico y cocción en almíbar de panela.',
    standards: 'NTC-3757',
    isTargetProduct: false,
  },
];

export const INITIAL_LINES: ProductionLine[] = [
  // LÍNEA 1: PASTA HILADA
  {
    id: 'line-pasta-hilada',
    name: 'Línea de Producción de Pasta Hilada',
    code: 'L-HILADA-01',
    lineType: 'pasta_hilada',
    lineTypeName: 'Línea de Producción de Pasta Hilada',
    capacityLiters: 1200,
    status: 'disponible',
    activeBatchId: null,
    assignedOperatorName: null,
    allowedProductIds: [
      'prod-doble-crema-premium',
      'prod-doble-crema-industrial',
      'prod-queso-pera',
      'prod-queso-7-cueros',
    ],
  },

  // LÍNEA 2: FERMENTACIÓN
  {
    id: 'line-fermentacion',
    name: 'Línea de Fermentación',
    code: 'L-FERMENT-02',
    lineType: 'fermentacion',
    lineTypeName: 'Línea de Fermentación',
    capacityLiters: 2000,
    status: 'disponible',
    activeBatchId: null,
    assignedOperatorName: null,
    allowedProductIds: ['prod-yogur', 'prod-kumis', 'prod-yogur-griego'],
  },

  // LÍNEA 3: DULCES
  {
    id: 'line-dulces',
    name: 'Línea de Dulces',
    code: 'L-DULCES-03',
    lineType: 'dulces',
    lineTypeName: 'Línea de Dulces',
    capacityLiters: 800,
    status: 'disponible',
    activeBatchId: null,
    assignedOperatorName: null,
    allowedProductIds: ['prod-manjar', 'prod-panelitas', 'prod-cortado'],
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-admin-1',
    name: 'Ing. David Rojas',
    code: 'ADM-901',
    role: 'administrador',
    shift: 'Jornada Continua',
    pin: '9090',
    password: 'admin',
  },
  {
    id: 'usr-op-1',
    name: 'Carlos Mendoza',
    code: 'OP-104',
    role: 'operador',
    shift: 'Jornada Continua',
    pin: '1040',
    password: '1234',
    assignedLineId: 'line-pasta-hilada',
  },
  {
    id: 'usr-op-2',
    name: 'Luisa Ramírez',
    code: 'OP-105',
    role: 'operador',
    shift: 'Jornada Continua',
    pin: '1050',
    password: '1234',
    assignedLineId: 'line-fermentacion',
  },
  {
    id: 'usr-op-3',
    name: 'Andrés Cifuentes',
    code: 'OP-108',
    role: 'operador',
    shift: 'Jornada Continua',
    pin: '1080',
    password: '1234',
    assignedLineId: 'line-dulces',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    batchId: 'Lote BD J BG - 20',
    lineName: 'Línea de Producción de Pasta Hilada',
    timestamp: Date.now() - 3600000,
    dateStr: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    adminName: 'Ing. David Rojas',
    stageId: 'desuerar',
    stageLabel: 'Desuerar',
    fieldKey: 'temperaturaVerificada',
    fieldLabel: 'Temperatura en Desuerado',
    oldValue: 39.4,
    newValue: 40.0,
    unit: '°C',
    reasonCategory: 'Error de lectura de instrumento / sensor descalibrado',
    justificationText: 'Se ajusta la temperatura de desuerado según termómetro de inmersión patrón calibrado.',
  },
];
