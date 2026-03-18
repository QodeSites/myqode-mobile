import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function ExperienceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="services" />
      <Stack.Screen name="mapping" />
      <Stack.Screen name="cadence" />
    </Stack>
  );
}
