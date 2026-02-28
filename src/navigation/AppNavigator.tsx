/**
 * 导航配置
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { CodePlanScreen } from '../screens/CodePlanScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootStackParamList, MainTabParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MemoryManagerScreen } from '../screens/MemoryManagerScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Chat') {
            iconName = 'chat';
          } else if (route.name === 'Tasks') {
            iconName = 'checkbox-marked';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ tabBarLabel: '对话' }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{ tabBarLabel: '任务' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TaskDetail" 
          component={TaskDetailScreen}
          options={{ title: '任务详情' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: '设置' }}
        />
        <Stack.Screen 
          name="MemoryManager" 
          component={MemoryManagerScreen}
          options={{ title: '记忆管理' }}
        />
        <Stack.Screen 
          name="CodePlan" 
          component={CodePlanScreen}
          options={{ title: '代码规划' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
