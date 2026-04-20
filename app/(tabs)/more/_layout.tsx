import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}
