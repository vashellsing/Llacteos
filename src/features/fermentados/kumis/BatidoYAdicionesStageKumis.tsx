import React from 'react';
import { BatidoYAdicionesKumisState } from '../../../types/kumis';
import { ProcessTimerState } from '../../../types';
import { BatidoYSaboresStageCommon } from '../common/BatidoYSaboresStageCommon';

export interface BatidoYAdicionesStageKumisProps {
  state: BatidoYAdicionesKumisState;
  onChange: (
    updater: (prev: BatidoYAdicionesKumisState) => BatidoYAdicionesKumisState
  ) => void;
  llevaAzucar?: boolean;
  litrosLecheBase?: number;
  processTimer: ProcessTimerState;
  onNextStage?: () => void;
  onOpenReviewModal?: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const BatidoYAdicionesStageKumis: React.FC<BatidoYAdicionesStageKumisProps> = ({
  state,
  onChange,
  llevaAzucar = true,
  litrosLecheBase = 100,
  processTimer,
  onNextStage,
  onOpenReviewModal,
  showToast,
}) => {
  return (
    <BatidoYSaboresStageCommon
      productType="kumis"
      state={state}
      onChange={onChange as any}
      llevaAzucar={llevaAzucar}
      litrosLecheBase={litrosLecheBase}
      processTimer={processTimer}
      onNextStage={onNextStage}
      onOpenReviewModal={onOpenReviewModal}
      showToast={showToast}
    />
  );
};
