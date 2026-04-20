import { Stack } from 'expo-router';

export default function InvestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add-funds" options={{ presentation: 'modal' }} />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="sip-management" />
    </Stack>
  );
}
