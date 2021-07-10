import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerContent from '../navigation/DrawerContent';
import TabCuocGoiNavigation from './TabCuocGoiNavigation';
import CuocGoiDi from '../screens/cuocgoi/CuocGoiDi';
import { navigationRef } from './RootNavigation';
import Login from '../screens/Account/Login';
import LogScreen from '../screens/LogData/LogScreen';


const Drawer = createDrawerNavigator();

function AppNavigation(props) {
    return (
        <NavigationContainer ref={navigationRef}>
            <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
                <Drawer.Screen name="TabCuocGoiNavigation" component={TabCuocGoiNavigation} />
                <Drawer.Screen name="CuocGoiDi" component={CuocGoiDi} />
                <Drawer.Screen name="LogScreen" component={LogScreen} />
                {/* <Drawer.Screen name="CuocGoiDen" component={CuocGoiDen} /> */}
                <Drawer.Screen name="Login" component={Login} />
            </Drawer.Navigator>
        </NavigationContainer >
    );
}

export default AppNavigation;