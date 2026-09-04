import { Tabs } from 'expo-router';
import { Colors } from '../../src/theme/colors';
// import { Target, User, Archive, Plus } from 'lucide-react-native';
import { Target, User, Archive, TrendingUp } from 'lucide-react-native';

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
        tabBarLabelStyle: { fontFamily: 'Inter-Bold', fontSize: 10 },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Active', 
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} /> 
        }} 
      />
       {/* ✅ NEW 4th TAB */}
      <Tabs.Screen 
        name="progress" 
        options={{ 
          title: 'Progress', 
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="history" 
        options={{ 
          title: 'History', 
          tabBarIcon: ({ color, size }) => <Archive color={color} size={size} /> 
        }} 
      />
     
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color, size }) => <User color={color} size={size} /> 
        }} 
      />
       <Tabs.Screen 
        name="create" 
        options={{ 
          href: null 
        }} 
      />
    </Tabs>
  );
}
// import { Tabs } from 'expo-router';
// import { Colors } from '../../src/theme/colors';
// import { Target, PlusCircle, User, Archive } from 'lucide-react-native';

// export default function TabLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: Colors.abyss2,
//           borderTopColor: Colors.mystic[500] + '30',
//           height: 65,
//           paddingBottom: 8,
//         },
//         tabBarActiveTintColor: Colors.ethereal[400],
//         tabBarInactiveTintColor: Colors.ghostDim,
//         tabBarLabelStyle: { fontFamily: 'Inter-Bold', fontSize: 10 },
//       }}
//     >
//       <Tabs.Screen name="index" options={{ title: 'Active', tabBarIcon: ({ color, size }) => <Target color={color} size={size} /> }} />
//       <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color, size }) => <Archive color={color} size={size} /> }} />
//       <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} /> }} />
//       <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
//     </Tabs>
//   );
// }
