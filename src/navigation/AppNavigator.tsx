/**
 * Three designed tabs — Plan, List, Week — using the custom flat tab bar.
 *
 * Recipes and Profile were not part of the redesign, so they sit outside the tab
 * bar as stack screens: adding cells would break the three-cell geometry the
 * design specifies. Both are reachable from the foot of the Week tab.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PlannerScreen from '../screens/PlannerScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import WeekScreen from '../screens/WeekScreen';
import RecipesScreen from '../screens/RecipesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DesignTabBar from './DesignTabBar';
import { PlannerDataProvider, usePlannerData } from '../context/PlannerData';
import { color } from '../theme/tokens';

export type TabParamList = {
  Plan: undefined;
  List: undefined;
  Week: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Recipes: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  const { toBuyCount, filledSlotCount } = usePlannerData();

  // The design's tab metas are live counters, not static labels.
  const metas: Record<string, string> = {
    Plan: 'pick meals',
    List: `${toBuyCount} to buy`,
    Week: `${filledSlotCount}/21`,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: color.bg },
      }}
      tabBar={(props) => <DesignTabBar {...props} metas={metas} />}
    >
      <Tab.Screen name="Plan" component={PlannerScreen} options={{ tabBarLabel: 'Plan' }} />
      <Tab.Screen name="List" component={ShoppingListScreen} options={{ tabBarLabel: 'List' }} />
      <Tab.Screen name="Week" component={WeekScreen} options={{ tabBarLabel: 'Week' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      {/* Above the navigator so the tab bar's live counts and the reconciler
          share one set of subscriptions. */}
      <PlannerDataProvider>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color.bg },
          }}
        >
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="Recipes" component={RecipesScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </PlannerDataProvider>
    </NavigationContainer>
  );
}
