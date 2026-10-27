import React from 'react';
import { InoculacionYogurState } from '../../../types/yogur';
import { ProcessTimerState } from '../../../types';
import { InoculacionStageCommon } from '../common/InoculacionStageCommon';

export interface InoculacionStageYogurProps {
  state: InoculacionYogurState;
  onChange: (updater: (prev: InoculacionYogurState) => InoculacionYogurState) => void;
  tempLlegada45?: number;
  horaLlegada45?: string | null;
  litrosLecheBase?: number;
  loteCultivoBase?: string;
  processTimer: ProcessTimerState;
  onNextStage?: () => void;
  onGoToBatidoYSabores?: () => void;
  onFinalizeProcess?: () => void;
  onOpenReviewModal?: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const InoculacionStageYogur: React.FC<InoculacionStageYogurProps> = ({
  state,
  onChange,
  horaLlegada45,
  litrosLecheBase = 100,
  loteCultivoBase,
  processTimer,
  onNextStage,
  onGoToBatidoYSabores,
  onOpenReviewModal,
  showToast,
}) => {
  return (
    <InoculacionStageCommon
      productType="yogur"
      state={state}
      onChange={onChange as any}
      horaLlegadaTemp={horaLlegada45}
      litrosLecheBase={litrosLecheBase}
      loteCultivoBase={loteCultivoBase}
      processTimer={processTimer}
      onGoToBatidoYSabores={onGoToBatidoYSabores || onNextStage || (() => {})}
      onNextStage={onNextStage}
      onOpenReviewModal={onOpenReviewModal}
      showToast={showToast}
    />
  );
};
