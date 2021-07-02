import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from '@react-navigation/native';
import Login from "../screens/Account/Login";


const Stack = createStackNavigator();

const AccountNavigation = () => (
  <Stack.Navigator>
    {/* <Stack.Screen name="Login1" component={Login} /> */}
  </Stack.Navigator>
);

export default AccountNavigation;
