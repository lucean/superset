import { useCallback, useMemo, useState } from 'react';
import { ConfigProvider, Tour, TourProps } from 'antd-v5';

export interface ModalTourConfig<State> {
  rootClassName: string;
  getSteps: (state: State) => TourProps['steps'];
  isAvailable?: (state: State) => boolean;
}

export type ModalTourConfigMap<State> = Record<string, ModalTourConfig<State>>;

export type TourKey<Map> = keyof Map & string;

export function useModalTours<State, Map extends ModalTourConfigMap<State>>(
  tours: Map,
  state: State,
) {
  const [activeKey, setActiveKey] = useState<TourKey<Map> | null>(null);

  const openTour = useCallback(
    (key: TourKey<Map>) => {
      const cfg = tours[key];
      if (!cfg) return;
      if (cfg.isAvailable && !cfg.isAvailable(state)) return;
      setActiveKey(key);
    },
    [tours, state],
  );

  const closeTour = useCallback(() => setActiveKey(null), []);

  const TourElement = useMemo(() => {
    if (!activeKey) return null;

    const cfg = tours[activeKey];
    const steps = cfg.getSteps(state);

    return (
      <ConfigProvider>
        <Tour
          rootClassName={cfg.rootClassName}
          open
          onClose={closeTour}
          steps={steps}
        />
      </ConfigProvider>
    );
  }, [activeKey, tours, state, closeTour]);

  return {
    activeTour: activeKey,
    openTour,
    closeTour,
    TourElement,
  };
}
