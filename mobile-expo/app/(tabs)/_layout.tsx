import { Tabs } from 'expo-router';
import { CampusTabBar } from '../../src/components/campus/CampusTabBar';
import { C } from '../../src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CampusTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="social" options={{ title: 'Feed' }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
      <Tabs.Screen name="chat" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="courses" options={{ href: null, title: 'Courses' }} />
    </Tabs>
  );
}
