import { Redirect } from 'expo-router';
import { useHouseholdStore } from '../src/store/household';

export default function Index() {
  const household = useHouseholdStore((s) => s.household);
  return <Redirect href={household ? '/(tabs)/home' : '/(auth)/splash'} />;
}
