import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ISUZU_FVR_170_300 } from '@/lib/load-calculator/truck-config';

interface TruckConfigState {
  // Weigh bridge readings
  weighBridgeReadings: {
    frontAxle: number; // kg
    rearAxle: number; // kg
  };

  // Body configuration
  fromBackOfCab: number; // mm - spacing between cab and body
  bodyDimensions: {
    length: number; // mm
    width: number; // mm
  };

  // Wall thickness
  wallThickness: {
    front: number; // mm
    rear: number; // mm
    sides: number; // mm
  };

  // Actions
  setWeighBridgeReadings: (readings: { frontAxle: number; rearAxle: number }) => void;
  setFromBackOfCab: (value: number) => void;
  setBodyDimensions: (dimensions: { length: number; width: number }) => void;
  setBodyLength: (length: number) => void;
  setBodyWidth: (width: number) => void;
  setWallThickness: (thickness: { front: number; rear: number; sides: number }) => void;
  resetToDefaults: () => void;
}

const defaultState = {
  weighBridgeReadings: {
    frontAxle: ISUZU_FVR_170_300.cabChassisFront, // 4140 kg (actual weighbridge)
    rearAxle: ISUZU_FVR_170_300.cabChassisRear,   // 4260 kg (actual weighbridge)
  },
  fromBackOfCab: 200, // Default 200mm
  bodyDimensions: {
    length: 5000, // Default 5000mm body length
    width: 2500,  // Default external width (2500mm)
  },
  wallThickness: {
    front: 50, // mm
    rear: 50, // mm
    sides: 50, // mm
  },
};

export const useTruckConfigStore = create<TruckConfigState>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,

        setWeighBridgeReadings: (readings) =>
          set({ weighBridgeReadings: readings }, false, 'setWeighBridgeReadings'),

        setFromBackOfCab: (value) =>
          set({ fromBackOfCab: value }, false, 'setFromBackOfCab'),

        setBodyDimensions: (dimensions) =>
          set({ bodyDimensions: dimensions }, false, 'setBodyDimensions'),

        setBodyLength: (length) =>
          set(
            (state) => ({
              bodyDimensions: { ...state.bodyDimensions, length },
            }),
            false,
            'setBodyLength'
          ),

        setBodyWidth: (width) =>
          set(
            (state) => ({
              bodyDimensions: { ...state.bodyDimensions, width },
            }),
            false,
            'setBodyWidth'
          ),

        setWallThickness: (thickness) =>
          set({ wallThickness: thickness }, false, 'setWallThickness'),

        resetToDefaults: () =>
          set(defaultState, false, 'resetToDefaults'),
      }),
      {
        name: 'truckcheck-truck-config-storage',
      }
    ),
    { name: 'TruckConfigStore' }
  )
);

