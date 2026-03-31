import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import PlannerScreen from '../screens/PlannerScreen';
import RecipesScreen from '../screens/RecipesScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type TabParamList = {
  Planner: undefined;
  Recipes: undefined;
  Shopping: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Planner:  { active: 'calendar',        inactive: 'calendar-outline' },
  Recipes:  { active: 'restaurant',      inactive: 'restaurant-outline' },
  Shopping: { active: 'cart',            inactive: 'cart-outline' },
  Profile:  { active: 'person-circle',   inactive: 'person-circle-outline' },
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#1D9E75',
          tabBarInactiveTintColor: '#888780',
          tabBarStyle: {
            borderTopWidth: 0.5,
            borderTopColor: '#D3D1C7',
            backgroundColor: '#FFFFFF',
            paddingBottom: 4,
            height: 60,
          },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name as keyof TabParamList];
            const iconName = focused ? icons.active : icons.inactive;
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Planner"  component={PlannerScreen} />
        <Tab.Screen name="Recipes"  component={RecipesScreen} />
        <Tab.Screen name="Shopping" component={ShoppingListScreen} />
        <Tab.Screen name="Profile"  component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}