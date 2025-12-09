import React, { Suspense, lazy } from 'react';
import { useModal } from '../state/ModalContext';
import SimpleQuickNote from './SimpleQuickNote';

// Lazy load the Roadmap screen to keep initial bundle small
const RoadmapScreen = lazy(() => import('./details/RoadmapDetails'));
const SplitViewConfigurationModal = lazy(() => import('./SplitViewConfigurationModal'));


const ModalRoot: React.FC = () => {
  const { modals, closeModal } = useModal();

  return (
    <>
      {/* Quick Note Modal - always rendered, manages its own visibility */}
      <SimpleQuickNote />

      {Object.entries(modals).map(([key, modal]) => {
        if (!modal || !modal.isOpen) return null;

        switch (key) {
          case 'roadmapScreen':
            return (
              <Suspense fallback={<div />} key={key}>
                <RoadmapScreen
                  item={(modal.payload as any).item}
                  onUpdate={(modal.payload as any).onUpdate}
                  onDelete={(modal.payload as any).onDelete}
                  onClose={() => closeModal(key)}
                />
              </Suspense>
            );
          case 'splitViewConfig':
            return (
              <Suspense fallback={<div />} key={key}>
                <SplitViewConfigurationModal />
              </Suspense>
            );
          case 'quickNote':
            // Handled by SimpleQuickNote component above
            return null;
          default:
            return null;
        }
      })}
    </>
  );
};

export default ModalRoot;
