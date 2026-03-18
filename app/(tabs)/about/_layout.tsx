import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function AboutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="foundation" />
      <Stack.Screen name="strategy" />
      <Stack.Screen name="team" />
    </Stack>
  );
}
