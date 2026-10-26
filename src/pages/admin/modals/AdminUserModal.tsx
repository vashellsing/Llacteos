import React, { useState } from 'react';
import { Modal } from '../../../components/ui';
import { ProductionLine, UserProfile } from '../../../types';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: ProductionLine[];
  onAddUser: (user: UserProfile) => void;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  onClose,
  lines,
  onAddUser,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [shift, setShift] = useState<UserProfile['shift']>('Mañana');
  const [assignedLineId, setAssignedLineId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa el nombre del operario.');
      return;
    }

    const newUser: UserProfile = {
      id: `usr-op-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase() || `OP-${Math.floor(100 + Math.random() * 900)}`,
      role: 'operador', // Strictly locked to 'operador' per business rule
      shift,
      assignedLineId: assignedLineId || undefined,
    };

    onAddUser(newUser);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      icon="person_add"
      title="Registrar Operador de Planta"
      subtitle="Alta de nuevo usuario para piso de producción"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Security Policy Badge */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs flex items-start gap-2.5">
            <span className="material-symbols-outlined text-amber-700 text-[20px] shrink-0 mt-0.5">
              lock
            </span>
            <div className="text-amber-900 leading-relaxed">
              <strong>Directiva de Seguridad Industrial:</strong> Por políticas de gobernanza de planta, los administradores únicamente tienen facultades para crear usuarios con el rol <strong>Operador</strong>. No está permitida la creación de cuentas de administrador.
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Nombre Completo del Operador</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="ej: Santiago Betancur"
              className="p-2.5 rounded-xl border border-[#e6decb] text-xs font-medium text-gray-900 outline-none focus:border-emerald-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Código Carnet / ID</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ej: OP-112"
                className="p-2.5 rounded-xl border border-[#e6decb] text-xs font-bold text-[#004ac6] outline-none uppercase"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Turno Asignado</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as any)}
                className="p-2.5 rounded-xl border border-[#e6decb] text-xs font-semibold text-gray-800 outline-none"
              >
                <option value="Mañana">Mañana (06:00 - 14:00)</option>
                <option value="Tarde">Tarde (14:00 - 22:00)</option>
                <option value="Noche">Noche (22:00 - 06:00)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Línea Asignada Inicial (Opcional)</label>
            <select
              value={assignedLineId}
              onChange={(e) => setAssignedLineId(e.target.value)}
              className="p-2.5 rounded-xl border border-[#e6decb] text-xs font-medium text-gray-800 outline-none"
            >
              <option value="">-- Sin línea fija / Flotante --</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>

          {/* Rol Locked Component */}
          <div className="flex flex-col gap-1 pt-1">
            <label className="text-xs font-bold text-gray-700">Rol en el Sistema</label>
            <div className="p-3 rounded-xl bg-gray-100 border border-gray-300 text-xs font-bold text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">badge</span>
                <span>Operador de Planta</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                🔒 Bloqueado
              </span>
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
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Registrar Operador
            </button>
          </div>
        </form>
    </Modal>
  );
};
