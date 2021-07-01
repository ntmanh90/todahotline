import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerContent from '../navigation/DrawerContent';
import TabCuocGoiNavigation from './TabCuocGoiNavigation';
import DienThoai from '../screens/cuocgoi/DienThoai';
import { navigationRef } from './RootNavigation';

const Drawer = createDrawerNavigator();

function AppNavigation(props) {
    return (
        <NavigationContainer ref={navigationRef}>
            <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
                <Drawer.Screen name="TabCuocGoiNavigation" component={TabCuocGoiNavigation} />
                <Drawer.Screen name="DienThoai" component={DienThoai} />

            </Drawer.Navigator>
        </NavigationContainer >
    );
}

export default AppNavigation;