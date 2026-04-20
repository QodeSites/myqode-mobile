import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuthStore } from '@/store/authStore';
import { isSmallDevice } from '@/constants/Responsive';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  activeIcon: IoniconsName;
}

const VISIBLE_TABS: TabConfig[] = [
  {
    name: 'portfolio',
    title: 'Portfolio',
    icon: 'bar-chart-outline',
    activeIcon: 'bar-chart',
  },
  {
    name: 'home',
    title: 'Account Mapping',
    icon: 'people-outline',
    activeIcon: 'people',
  },
  {
    name: 'invest',
    title: 'Invest',
    icon: 'wallet-outline',
    activeIcon: 'wallet',
  },
  {
    name: 'docs',
    title: 'Docs',
    icon: 'document-text-outline',
    activeIcon: 'document-text',
  },
  {
    name: 'more',
    title: 'More',
    icon: 'grid-outline',
    activeIcon: 'grid',
  },
];

// Routes accessible via the More screen but hidden from the tab bar
const HIDDEN_TABS = ['about', 'experience', 'engagement'];

export default function TabsLayout() {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const insets = useSafeAreaInsets();

  if (isHydrated && !token) {
    return <Redirect href="/(auth)/login" />;
  }

  const bottomPad = Math.max(insets.bottom, 8);
  const tabBarHeight = (isSmallDevice ? 66 : 72) + bottomPad;

  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = VISIBLE_TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor: Colors.primaryDark,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: [styles.tabBar, { height: tabBarHeight, paddingBottom: bottomPad }],
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarIconStyle: styles.tabBarIcon,
          tabBarIcon: ({ focused, color }) => {
            const iconName = focused ? (tab?.activeIcon ?? tab?.icon) : tab?.icon;
            return (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons
                  name={iconName as IoniconsName}
                  size={isSmallDevice ? 20 : 22}
                  color={color}
                />
              </View>
            );
          },
        };
      }}
    >
      {VISIBLE_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title }}
        />
      ))}
      {HIDDEN_TABS.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null }}
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
  },
  tabLabel: {
    ...Typography.Caption,
    fontFamily: 'Inter_500Medium',
    marginTop: 1,
  },
  tabItem: {
    paddingTop: 8,
  },
  tabBarIcon: {
    overflow: 'visible',
  },
  iconWrapper: {
    width: 34,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: Colors.navActiveBg,
  },
});
