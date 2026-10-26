import React, { useState } from 'react';
import { Modal } from '../../../components/ui';
import { LineType, ProductDefinition, ProductionLine } from '../../../types';

interface AdminLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductDefinition[];
  onAddLine: (line: ProductionLine) => void;
}

const LINE_TYPES: { id: LineType; name: string; defaultCode: string }[] = [
  {
    id: 'pasta_hilada',
    name: 'Línea de Producción de Pasta Hilada',
    defaultCode: 'L-HILADA',
  },
  {
    id: 'fermentacion',
    name: 'Línea de Fermentación (Yogur, Kumis)',
    defaultCode: 'L-FERMENT',
  },
  {
    id: 'dulces',
    name: 'Línea de Dulces (Manjar, Panelitas)',
    defaultCode: 'L-DULCES',
  },
];

export const AdminLineModal: React.FC<AdminLineModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddLine,
}) => {
  const [lineType, setLineType] = useState<LineType>('pasta_hilada');
  const [name, setName] = useState('Línea de Producción de Pasta Hilada 2');
  const [code, setCode] = useState('L-HILADA-02');
  const [capacity, setCapacity] = useState('1200');
  const [status, setStatus] = useState<ProductionLine['status']>('disponible');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    'prod-doble-crema-premium',
    'prod-doble-crema-industrial',
  ]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLineTypeChange = (type: LineType) => {
    setLineType(type);
    const matchedType = LINE_TYPES.find((t) => t.id === type)!;
    setName(`${matchedType.name} Nueva`);
    setCode(`${matchedType.defaultCode}-${Math.floor(10 + Math.random() * 90)}`);

    // Pre-select products of that line type
    const relatedProducts = products
      .filter((p) => p.lineType === type)
      .map((p) => p.id);
    setSelectedProductIds(relatedProducts.length > 0 ? relatedProducts : [products[0].id]);
    setError('');
  };

  const toggleProduct = (prodId: string) => {
    if (selectedProductIds.includes(prodId)) {
      if (selectedProductIds.length === 1) {
        setError('Debes asociar al menos un producto a la línea.');
        return;
      }
      setSelectedProductIds(selectedProductIds.filter((id) => id !== prodId));
    } else {
      setSelectedProductIds([...selectedProductIds, prodId]);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Por favor completa el nombre y código de la línea.');
      return;
    }
    if (selectedProductIds.length === 0) {
      setError('Debes asociar al menos un producto a la línea.');
      return;
    }

    const matchedType = LINE_TYPES.find((t) => t.id === lineType)!;

    const newLine: ProductionLine = {
      id: `line-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      lineType,
      lineTypeName: matchedType.name,
      capacityLiters: parseInt(capacity, 10) || 1000,
      status,
      activeBatchId: null,
      assignedOperatorName: null,
      allowedProductIds: selectedProductIds,
    };

    onAddLine(newLine);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      icon="precision_manufacturing"
      title="Crear Línea de Producción"
      subtitle="Pasta Hilada, Fermentación o Dulces"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tipo de Línea (3 tipos solicitados) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-800">
              1. TIPO DE LÍNEA DE PRODUCCIÓN
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LINE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleLineTypeChange(t.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                    lineType === t.id
                      ? 'bg-[#004ac6] text-white border-[#004ac6] shadow-xs'
                      : 'bg-[#fcfaf7] border-[#e6decb] text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {t.id === 'pasta_hilada'
                      ? 'lunch_dining'
                      : t.id === 'fermentacion'
                      ? 'biotech'
                      : 'cookie'}
                  </span>
                  <span className="text-[10px] leading-tight">
                    {t.id === 'pasta_hilada'
                      ? 'Pasta Hilada'
                      : t.id === 'fermentacion'
                      ? 'Fermentación'
                      : 'Dulces'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Nombre de la Línea</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="ej: Línea de Producción de Pasta Hilada 2"
              className="p-2.5 rounded-xl border border-[#e6decb] text-xs font-medium text-gray-900 outline-none focus:border-[#004ac6]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Código SCADA</label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                placeholder="ej: L-HILADA-02"
                className="p-2.5 rounded-xl border border-[#e6decb] text-xs font-bold text-[#004ac6] outline-none uppercase"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Capacidad (Litros)</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="1200"
                className="p-2.5 rounded-xl border border-[#e6decb] text-xs font-bold text-gray-900 outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Estado Inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="p-2.5 rounded-xl border border-[#e6decb] text-xs font-semibold text-gray-800 outline-none"
            >
              <option value="disponible">Disponible (Lista para lotes)</option>
              <option value="en_produccion">En Producción</option>
              <option value="mantenimiento">En Mantenimiento</option>
              <option value="limpieza_cip">En Limpieza CIP</option>
            </select>
          </div>

          {/* Asociar Productos según la línea */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#e6decb]/70">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span>PRODUCTOS ASOCIADOS A ESTA LÍNEA</span>
              <span className="text-[10px] text-gray-500">Filtrados por categoría</span>
            </label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {products
                .filter((p) => p.lineType === lineType)
                .map((prod) => {
                  const isSelected = selectedProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleProduct(prod.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/70 border-[#004ac6] text-[#004ac6]'
                          : 'bg-[#fcfaf7] border-[#e6decb] text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px]">
                          {isSelected ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <div>
                          <div className="text-xs font-bold">{prod.name}</div>
                          <div className="text-[10px] text-gray-500">{prod.standards}</div>
                        </div>
                      </div>
                      {prod.isTargetProduct && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Objetivo
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e6decb]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Crear Línea
            </button>
          </div>
        </form>
    </Modal>
  );
};
