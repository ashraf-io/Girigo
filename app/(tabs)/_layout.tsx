import { Tabs } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Target, PlusCircle } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.abyss2,
          borderTopColor: Colors.mystic[500] + '30',
          height: 65,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.ethereal[400],
        tabBarInactiveTintColor: Colors.ghostDim,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Bold',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Wishes',
          tabBarIcon: ({ color, size }) => (
            <Target color={color} size={size} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="create" 
        options={{ 
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <PlusCircle color={color} size={size} />
          ),
        }} 
      />
    </Tabs>
  );
}
