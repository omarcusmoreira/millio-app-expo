import { Redirect } from 'expo-router';
import { MOCK_HOUSEHOLD } from '../src/__dev__/mockHousehold';
import { useHouseholdStore } from '../src/store/household';

// Seed mock state once at module load — no React lifecycle needed.
// Guard prevents double-seed on hot reload.
if (__DEV__) {
  const s = useHouseholdStore.getState();
  if (!s.household) {
    s.setHousehold(MOCK_HOUSEHOLD);
    s.setToday('2026-05-18');
  }
}

export default function Index() {
  return <Redirect href={__DEV__ ? '/(tabs)/home' : '/(auth)/splash'} />;
}
