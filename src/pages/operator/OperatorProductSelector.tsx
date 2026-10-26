import React, { useState } from 'react';
import { Modal } from '../../components/ui';
import { ProductDefinition, ProductionLine } from '../../types';

interface OperatorProductSelectorProps {
  selectedLine: ProductionLine;
  products: ProductDefinition[];
  onSelectProduct: (productId: string) => void;
  onBackToLines: () => void;
}

export const OperatorProductSelector: React.FC<OperatorProductSelectorProps> = ({
  selectedLine,
  products,
  onSelectProduct,
  onBackToLines,
}) => {
  const [infoModalProduct, setInfoModalProduct] = useState<ProductDefinition | null>(null);

  const allowedProducts = products.filter((p) =>
    selectedLine.allowedProductIds.includes(p.id)
  );

  const isPastaHilada = selectedLine.lineType === 'pasta_hilada';

  return (
    <div className="flex flex-col w-full p-4 lg:p-8 gap-6 bg-[#fcfaf7] min-h-[calc(100vh-4rem)] pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-[#e6decb] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToLines}
            className="text-xs font-bold text-[#004ac6] flex items-center gap-1 hover:underline mb-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Volver al selector de líneas</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#004ac6] border border-blue-200">
              {selectedLine.code}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#191c1e]">
              {selectedLine.name}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#434655] mt-1">
            Capacidad: <strong>{selectedLine.capacityLiters} L</strong> · Tipo:{' '}
            <strong className="text-amber-900">{selectedLine.lineTypeName}</strong>
          </p>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
            Línea Seleccionada
          </span>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 mt-0.5">
            ✓ Operación Autorizada
          </span>
        </div>
      </div>

      {/* Banner de contexto de la línea */}
      {isPastaHilada ? (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 text-[24px] shrink-0">
            lunch_dining
          </span>
          <div>
            <strong className="font-bold text-amber-950 text-sm">
              Línea de Pasta Hilada Activa
            </strong>
            <p className="mt-0.5 leading-relaxed text-amber-900">
              Elige el queso que vas a preparar hoy: <strong>Queso Doble Crema Premium (Tradicional)</strong>, <strong>Queso Doble Crema Industrial</strong>, <strong>Queso Pera</strong> o <strong>Queso 7 Cueros</strong>.
            </p>
          </div>
        </div>
      ) : selectedLine.lineType === 'fermentacion' ? (
        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-300 text-xs text-purple-900 flex items-start gap-3">
          <span className="material-symbols-outlined text-purple-700 text-[24px] shrink-0">
            biotech
          </span>
          <div>
            <strong className="font-bold text-purple-950 text-sm">
              Línea de Fermentados Activa (Yogur, Kumis y Yogur Griego)
            </strong>
            <p className="mt-0.5 leading-relaxed text-purple-900">
              Elige el producto fermentado a trabajar: <strong>Yogur Entero Probiótico</strong>, <strong>Kumis Tradicional</strong> o <strong>Yogur Griego</strong>. Puedes dividir un mismo Lote Padre de leche entre los tres sub-lotes y llevar sus cronómetros por separado.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-300 text-xs text-rose-900 flex items-start gap-3">
          <span className="material-symbols-outlined text-rose-700 text-[24px] shrink-0">
            cookie
          </span>
          <div>
            <strong className="font-bold text-rose-950 text-sm">
              Línea de Dulces (Manjar Blanco / Arequipe y Panelitas)
            </strong>
            <p className="mt-0.5 leading-relaxed text-rose-900">
              Consulta las fichas de referencia para evaporación y concentración en marmitas hasta 68° Brix.
            </p>
          </div>
        </div>
      )}

      {/* Lista de Productos asociados a la línea */}
      <div className="flex flex-col gap-4">
        {allowedProducts.map((prod) => {
          const isTarget = prod.isTargetProduct;

          return (
            <div
              key={prod.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs ${
                isTarget
                  ? 'bg-white border-[#004ac6] ring-2 ring-blue-100 hover:shadow-md'
                  : 'bg-white border-[#e6decb] hover:border-gray-400'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                    prod.id === 'prod-kumis'
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                      : prod.id === 'prod-yogur'
                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                      : prod.id === 'prod-queso-7-cueros'
                      ? 'bg-teal-100 text-teal-900 border-teal-300'
                      : isTarget
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : prod.lineType === 'fermentacion'
                      ? 'bg-purple-100 text-purple-900 border-purple-200'
                      : prod.lineType === 'dulces'
                      ? 'bg-rose-100 text-rose-900 border-rose-200'
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[28px]">
                    {prod.id === 'prod-kumis'
                      ? 'science'
                      : prod.id === 'prod-yogur'
                      ? 'biotech'
                      : prod.id === 'prod-queso-7-cueros'
                      ? 'layers'
                      : isTarget
                      ? 'lunch_dining'
                      : prod.lineType === 'fermentacion'
                      ? 'biotech'
                      : prod.lineType === 'dulces'
                      ? 'cookie'
                      : 'egg'}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      prod.id === 'prod-queso-7-cueros'
                        ? 'bg-gray-100 text-[#004ac6] border-gray-300'
                        : 'bg-blue-50 text-[#004ac6] border-blue-200'
                    }`}>
                      {prod.code}
                    </span>
                    <h3 className="text-lg font-black text-[#191c1e]">{prod.name}</h3>
                    {isTarget && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        prod.id === 'prod-queso-7-cueros'
                          ? 'bg-teal-100 text-teal-900 border-teal-300'
                          : prod.id === 'prod-yogur'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        PROCESO OFICIAL HABILITADO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#434655] max-w-xl">{prod.description}</p>
                  <span className="text-[11px] font-bold text-gray-500 mt-0.5">
                    Normativa: {prod.standards}
                  </span>

                  {isTarget && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold text-gray-700">
                      {prod.id === 'prod-yogur-griego' ? (
                        <>
                          <span className="px-2 py-1 bg-cyan-50 border border-cyan-300 text-cyan-900 rounded-lg">1. Pasteurización (Griego)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">2. Inoculación (Griego)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">3. Maduración y Filtrado en Telas</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">4. Batido, Crema y Adiciones</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">5. Envasado y Almacenamiento</span>
                        </>
                      ) : prod.id === 'prod-kumis' ? (
                        <>
                          <span className="px-2 py-1 bg-indigo-50 border border-indigo-300 text-indigo-900 rounded-lg">1. Pasteurización (Kumis)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">2. Inoculación (Kumis)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">3. Maduración en Frío (Kumis)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">4. Batido y Adiciones (Kumis)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">5. Envasado y Almacenamiento (Kumis)</span>
                        </>
                      ) : prod.id === 'prod-yogur' ? (
                        <>
                          <span className="px-2 py-1 bg-purple-50 border border-purple-300 text-purple-900 rounded-lg">1. Pasteurización y Enfriamiento</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">2. Inoculación (Cultivo)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">3. Maduración en Frío</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">4. Batido y Adiciones</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">5. Envasado y Rendimiento</span>
                        </>
                      ) : prod.id === 'prod-queso-pera' ? (
                        <>
                          <span className="px-2 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg">1. Etapa de Premaduración</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">2. Calentar y Cuajar</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">3. Desuerar (40 °C)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">4. Hilar (Queso Pera)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">5. Moldeo y Balance</span>
                        </>
                      ) : prod.id === 'prod-queso-7-cueros' ? (
                        <>
                          <span className="px-2 py-1 bg-teal-50 border border-teal-300 text-teal-900 rounded-lg">1. Acidificar</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">2. Calentar y Cuajar</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">3. Desuerar (40 °C)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">4. Hilar</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">5. Rendimiento y Moldeo</span>
                        </>
                      ) : (
                        <>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">1. Acidificar (35 °C)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">2. Calentar y Cuajar</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">3. Desuerar (40 °C)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">4. Hilar (65 °C / Hebra / Extrusión)</span>
                          <span className="px-2 py-1 bg-[#fcfaf7] border border-[#e6decb] rounded-lg">5. Moldeo y Balance</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row gap-2">
                {prod.id === 'prod-yogur-griego' ? (
                  <button
                    onClick={() => onSelectProduct(prod.id)}
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>Iniciar Yogur Griego -&gt;</span>
                  </button>
                ) : prod.id === 'prod-kumis' ? (
                  <button
                    onClick={() => onSelectProduct(prod.id)}
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>Iniciar Kumis -&gt;</span>
                  </button>
                ) : prod.id === 'prod-yogur' ? (
                  <button
                    onClick={() => onSelectProduct(prod.id)}
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>Iniciar Yogur -&gt;</span>
                  </button>
                ) : prod.id === 'prod-doble-crema-premium' ? (
                  <button
                    onClick={() => onSelectProduct(prod.id)}
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>Iniciar Doble Crema Premium (Tradicional)</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                ) : prod.id === 'prod-doble-crema-industrial' ? (
                  <button
                    onClick={() => onSelectProduct(prod.id)}
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>Iniciar Doble Crema Industrial</span>
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  </button>
                ) : prod.id === 'prod-queso-pera' ? (
                  <button
                    onClick={() => onSelectProduct(prod.id)}
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>Iniciar Queso Pera</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                ) : prod.id === 'prod-queso-7-cueros' ? (
                  <button
                    onClick={() => onSelectProduct(prod.id)}
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>Iniciar Queso 7 Cueros</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setInfoModalProduct(prod)}
                    className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold border border-gray-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span>Ver Ficha Técnica</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Ficha Técnica de Producto */}
      <Modal
        isOpen={Boolean(infoModalProduct)}
        onClose={() => setInfoModalProduct(null)}
        maxWidth="lg"
        icon="assignment"
        title={infoModalProduct ? `Ficha Técnica: ${infoModalProduct.name}` : 'Ficha Técnica'}
        subtitle={infoModalProduct ? `Código: ${infoModalProduct.code}` : undefined}
        footer={
          <button
            onClick={() => setInfoModalProduct(null)}
            className="px-5 py-2.5 rounded-xl bg-[#004ac6] text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
          >
            Entendido / Volver
          </button>
        }
      >
        {infoModalProduct && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 bg-[#fcfaf7] rounded-xl border border-[#e6decb] flex flex-col gap-1">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Línea de Proceso</span>
              <span className="font-bold text-gray-900 text-sm">
                {infoModalProduct.lineType === 'fermentacion'
                  ? 'Línea de Fermentación (Yogur, Kumis y Griego)'
                  : infoModalProduct.lineType === 'dulces'
                  ? 'Línea de Dulces (Manjar y Panelitas)'
                  : 'Línea de Pasta Hilada'}
              </span>
            </div>

            <div>
              <span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Descripción del Proceso</span>
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
                {infoModalProduct.description}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#004ac6]">
              <strong className="block font-bold">Norma y Marco Regulatorio:</strong>
              <span>{infoModalProduct.standards}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
