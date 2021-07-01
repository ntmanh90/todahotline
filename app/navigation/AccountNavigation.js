import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from '@react-navigation/native';
import Login from "../screens/Account/Login";


const Stack = createStackNavigator();

const AccountNavigation = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AccountNavigation;
