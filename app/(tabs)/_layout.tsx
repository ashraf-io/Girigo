import { Tabs } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.abyss2,
          borderTopColor: Colors.mystic[500] + '30',
        },
        tabBarActiveTintColor: Colors.ethereal[400],
        tabBarInactiveTintColor: Colors.ghostDim,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
    </Tabs>
  );
}
