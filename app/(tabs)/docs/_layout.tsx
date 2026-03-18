import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function DocsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="risk" />
      <Stack.Screen name="escalation" />
      <Stack.Screen name="faq" />
    </Stack>
  );
}
