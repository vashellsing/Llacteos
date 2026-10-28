import { useCallback, useEffect, useState } from 'react';
import { OperatorLayout } from './layouts/OperatorLayout';
import { Toast } from './components/ui/Toast';
import { LoginScreen } from './pages/auth/LoginScreen';
import { AdminGlobalDashboard } from './pages/admin/AdminGlobalDashboard';
import { AdminCorrectionModal } from './pages/admin/modals/AdminCorrectionModal';
import { AdminLineModal } from './pages/admin/modals/AdminLineModal';
import { AdminUserModal } from './pages/admin/modals/AdminUserModal';
import { AuditTrailModal } from './pages/admin/modals/AuditTrailModal';
import { OperatorLineSelector } from './pages/operator/OperatorLineSelector';
import { OperatorProductSelector } from './pages/operator/OperatorProductSelector';
import { BatchExecutionPage } from './pages/operator/BatchExecutionPage';
import { BatchSummaryModal } from './features/pasta-hilada/modals/BatchSummaryModal';
import { YogurSummaryModal } from './features/fermentados/modals/YogurSummaryModal';
import { KumisSummaryModal } from './features/fermentados/modals/KumisSummaryModal';
import { YogurGriegoSummaryModal } from './features/fermentados/modals/YogurGriegoSummaryModal';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_LINES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
} from './data/initialData';
import { useBatchManager } from './hooks/useBatchManager';
import {
  AppView,
  AuditLogEntry,
  BatchData,
  ProductDefinition,
  ProductionLine,
  ToastMessage,
  UserProfile,
  UserRole,
} from './types';

export default function App() {
  // 1. Autenticación y Rol Activo
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('operador');
  const [currentView, setCurrentView] = useState<AppView>('operator_line_select');

  // 2. Catálogos de Planta y Auditoría
  const [lines, setLines] = useState<ProductionLine[]>(INITIAL_LINES);
  const [products] = useState<ProductDefinition[]>(INITIAL_PRODUCTS);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // 3. Notificaciones (Toasts)
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 4. Motor Central de Lotes (Lote Padre, Lotes Hijos y Cronómetros Independientes)
  const batchManager = useBatchManager({ showToast });
  const {
    selectedLineId,
    setSelectedLineId,
    activeProductId,
    selectProductBatch,
    currentStage,
    setCurrentStage,
    isQueso7Cueros,
    isFermentacionLine,
    batch,
    setBatch,
    batchYogur,
    setBatchYogur,
    batchKumis,
    setBatchKumis,
    batchYogurGriego,
    setBatchYogurGriego,
    activeHeaderBatch,
    activeStageStatuses,
    handleFinalizeBatch,
    handleFinalizeYogurBatch,
    handleFinalizeKumisBatch,
    handleFinalizeYogurGriegoBatch,
    reviewModalOpen,
    setReviewModalOpen,
    yogurReviewModalOpen,
    setYogurReviewModalOpen,
    kumisReviewModalOpen,
    setKumisReviewModalOpen,
    yogurGriegoReviewModalOpen,
    setYogurGriegoReviewModalOpen,
    openActiveReviewModal,
    assignOperatorToAllBatches,
  } = batchManager;

  // 5. Modales de Navegación y Administración
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [createLineModalOpen, setCreateLineModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [auditTrailModalOpen, setAuditTrailModalOpen] = useState(false);

  const adminUser =
    users.find((u) => u.role === 'administrador') || INITIAL_USERS[0];
  const operatorUser =
    users.find((u) => u.role === 'operador') || INITIAL_USERS[1];
  const activeUser =
    currentUser || (userRole === 'administrador' ? adminUser : operatorUser);

  // Scroll automático al cambiar de vista, etapa o sub-lote
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentStage, currentView, activeProductId]);

  // Handlers de Autenticación y Navegación
  const handleLogin = (user: UserProfile) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setUserRole(user.role);

    if (user.role === 'operador') {
      assignOperatorToAllBatches(user);
    }

    if (user.role === 'administrador') {
      setCurrentView('admin_dashboard');
      showToast(
        `🛡️ Hola ${user.name} (${user.code}) · Panel de Supervisor activado.`,
        'success'
      );
    } else {
      setCurrentView('operator_line_select');
      showToast(
        `👤 ¡Bienvenido ${user.name}! Turno ${user.shift || 'Jornada Continua'}.`,
        'success'
      );
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('Cerraste tu turno. Selecciona tu usuario para volver a entrar.');
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setUserRole(newRole);
    if (newRole === 'administrador') {
      setCurrentUser(adminUser);
      setCurrentView('admin_dashboard');
      showToast(`🛡️ Cambiaste a vista de Supervisor (${adminUser.name}).`, 'info');
    } else {
      setCurrentUser(operatorUser);
      assignOperatorToAllBatches(operatorUser);
      setCurrentView('batch_process');
      showToast(`👤 Cambiaste a vista de Operario (${operatorUser.name}).`, 'info');
    }
  };

  const handleSelectLine = (lineId: string) => {
    setSelectedLineId(lineId);
    setCurrentView('operator_product_select');
  };

  const handleSelectProduct = (productId: string) => {
    selectProductBatch(productId);
    setCurrentView('batch_process');
  };

  const handleApplyCorrection = (
    updatedBatch: BatchData,
    logEntry: AuditLogEntry
  ) => {
    setBatch(updatedBatch);
    setAuditLogs((prev) => [logEntry, ...prev]);
    showToast(
      `✓ Corrección guardada: ${logEntry.fieldLabel} ajustado a ${logEntry.newValue} ${
        logEntry.unit || ''
      }.`,
      'success'
    );
  };

  const handleAddLine = (newLine: ProductionLine) => {
    setLines((prev) => [...prev, newLine]);
    showToast(`✓ Línea "${newLine.name}" creada con éxito.`, 'success');
  };

  const handleAddUser = (newUser: UserProfile) => {
    setUsers((prev) => [...prev, newUser]);
    showToast(`✓ Operario "${newUser.name}" registrado.`, 'success');
  };

  const currentSelectedLine =
    lines.find((l) => l.id === selectedLineId) || lines[0];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f4efe6] text-[#191c1e] flex flex-col font-sans selection:bg-amber-200">
        <Toast toasts={toasts} onDismiss={handleDismissToast} />
        <LoginScreen users={users} onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <OperatorLayout
      batch={activeHeaderBatch}
      lotesLeche={isFermentacionLine ? undefined : batch.lotesLeche}
      currentUser={activeUser}
      currentView={currentView}
      currentStage={currentStage}
      stageStatuses={activeStageStatuses}
      mobileOpen={mobileMenuOpen}
      onCloseMobile={() => setMobileMenuOpen(false)}
      onOpenMobileMenu={() => setMobileMenuOpen(true)}
      onSelectStage={(stage) => {
        setCurrentStage(stage);
        setCurrentView('batch_process');
      }}
      onSwitchRole={handleSwitchRole}
      onNavigateView={setCurrentView}
      onOpenReviewModal={openActiveReviewModal}
      onOpenCorrectionModal={
        userRole === 'administrador'
          ? () => setCorrectionModalOpen(true)
          : undefined
      }
      onOpenAuditTrailModal={() => setAuditTrailModalOpen(true)}
      onLogout={handleLogout}
    >
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {currentView === 'admin_dashboard' && (
        <AdminGlobalDashboard
          lines={lines}
          activeBatch={batch}
          products={products}
          users={users}
          adminUser={adminUser}
          auditLogsCount={auditLogs.length}
          onOpenCreateLineModal={() => setCreateLineModalOpen(true)}
          onOpenCreateUserModal={() => setCreateUserModalOpen(true)}
          onOpenAuditTrailModal={() => setAuditTrailModalOpen(true)}
          onOpenCorrectionModal={() => setCorrectionModalOpen(true)}
          onNavigateToBatch={() => setCurrentView('batch_process')}
          onStartBatchOnLine={(lineId) => {
            setSelectedLineId(lineId);
            setCurrentView('batch_process');
            showToast('✓ Lote abierto en la línea seleccionada.');
          }}
        />
      )}

      {currentView === 'operator_line_select' && (
        <OperatorLineSelector
          lines={lines}
          currentUser={activeUser}
          activeBatchId={activeHeaderBatch.id}
          onSelectLine={handleSelectLine}
          onContinueCurrentBatch={() => setCurrentView('batch_process')}
        />
      )}

      {currentView === 'operator_product_select' && (
        <OperatorProductSelector
          selectedLine={currentSelectedLine}
          products={products}
          onSelectProduct={handleSelectProduct}
          onBackToLines={() => setCurrentView('operator_line_select')}
        />
      )}

      {currentView === 'batch_process' && (
        <BatchExecutionPage
          batchManager={batchManager}
          userRole={userRole}
          onOpenCorrectionModal={() => setCorrectionModalOpen(true)}
          onNavigateView={setCurrentView}
          showToast={showToast}
        />
      )}

      {/* Modales de Resumen y Certificación por Producto */}
      <YogurSummaryModal
        isOpen={yogurReviewModalOpen}
        onClose={() => setYogurReviewModalOpen(false)}
        batch={batchYogur}
        users={users}
        onFinalizeBatch={() => {
          handleFinalizeYogurBatch(false);
          setYogurReviewModalOpen(false);
          setCurrentView('operator_line_select');
        }}
        onChangeObservaciones={(obs) =>
          setBatchYogur((prev) => ({ ...prev, observaciones: obs }))
        }
        onChangeOperariosIntervinientes={(operarios) =>
          setBatchYogur((prev) => ({
            ...prev,
            operariosIntervinientes: operarios,
          }))
        }
      />

      <KumisSummaryModal
        isOpen={kumisReviewModalOpen}
        onClose={() => setKumisReviewModalOpen(false)}
        batch={batchKumis}
        users={users}
        onFinalizeBatch={() => {
          handleFinalizeKumisBatch(false);
          setKumisReviewModalOpen(false);
          setCurrentView('operator_line_select');
        }}
        onChangeObservaciones={(obs) =>
          setBatchKumis((prev) => ({ ...prev, observaciones: obs }))
        }
        onChangeOperariosIntervinientes={(operarios) =>
          setBatchKumis((prev) => ({
            ...prev,
            operariosIntervinientes: operarios,
          }))
        }
      />

      <YogurGriegoSummaryModal
        isOpen={yogurGriegoReviewModalOpen}
        onClose={() => setYogurGriegoReviewModalOpen(false)}
        batch={batchYogurGriego}
        users={users}
        onFinalizeBatch={() => {
          handleFinalizeYogurGriegoBatch(false);
          setYogurGriegoReviewModalOpen(false);
          setCurrentView('operator_line_select');
        }}
        onChangeObservaciones={(obs) =>
          setBatchYogurGriego((prev) => ({ ...prev, observaciones: obs }))
        }
        onChangeOperariosIntervinientes={(operarios) =>
          setBatchYogurGriego((prev) => ({
            ...prev,
            operariosIntervinientes: operarios,
          }))
        }
      />

      <BatchSummaryModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        batch={batch}
        users={users}
        onFinalizeBatch={() => {
          handleFinalizeBatch();
          setCurrentView('operator_line_select');
        }}
        onChangeObservaciones={(obs) =>
          setBatch((prev) => ({ ...prev, observaciones: obs }))
        }
        onChangeOperariosIntervinientes={(operarios) =>
          setBatch((prev) => ({ ...prev, operariosIntervinientes: operarios }))
        }
      />

      {/* Modales Administrativos */}
      <AdminCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        batch={batch}
        adminName={adminUser.name}
        onApplyCorrection={handleApplyCorrection}
      />

      <AdminLineModal
        isOpen={createLineModalOpen}
        onClose={() => setCreateLineModalOpen(false)}
        products={products}
        onAddLine={handleAddLine}
      />

      <AdminUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        lines={lines}
        onAddUser={handleAddUser}
      />

      <AuditTrailModal
        isOpen={auditTrailModalOpen}
        onClose={() => setAuditTrailModalOpen(false)}
        logs={auditLogs}
      />
    </OperatorLayout>
  );
}
