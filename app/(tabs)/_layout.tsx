import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuthStore } from '@/store/authStore';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  activeIcon: IoniconsName;
}

const TABS: TabConfig[] = [
  {
    name: 'portfolio',
    title: 'Portfolio',
    icon: 'bar-chart-outline',
    activeIcon: 'bar-chart',
  },
  {
    name: 'invest',
    title: 'Invest',
    icon: 'wallet-outline',
    activeIcon: 'wallet',
  },
  {
    name: 'about',
    title: 'About',
    icon: 'information-circle-outline',
    activeIcon: 'information-circle',
  },
  {
    name: 'experience',
    title: 'Experience',
    icon: 'settings-outline',
    activeIcon: 'settings',
  },
  {
    name: 'engagement',
    title: 'Engage',
    icon: 'chatbubble-outline',
    activeIcon: 'chatbubble',
  },
  {
    name: 'docs',
    title: 'Docs',
    icon: 'shield-checkmark-outline',
    activeIcon: 'shield-checkmark',
  },
];

export default function TabsLayout() {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (isHydrated && !token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor: Colors.primaryDark,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarIcon: ({ focused, color }) => {
            const iconName = focused ? (tab?.activeIcon ?? tab?.icon) : tab?.icon;
            return (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons
                  name={iconName as IoniconsName}
                  size={22}
                  color={color}
                />
              </View>
            );
          },
        };
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabLabel: {
    ...Typography.Caption,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconWrapper: {
    padding: 4,
    borderRadius: 8,
  },
  iconWrapperActive: {
    backgroundColor: Colors.navActiveBg,
  },
});
