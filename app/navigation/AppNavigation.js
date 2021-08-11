import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerContent from '../navigation/DrawerContent';
import TabCuocGoiNavigation from './TabCuocGoiNavigation';
import CuocGoi from '../screens/cuocgoi/CuocGoi';
import { navigationRef } from './RootNavigation';
import Login from '../screens/Account/Login';
import LogScreen from '../screens/LogData/LogScreen';
import ChiTietLichSuCuocGoi from '../screens/cuocgoi/ChiTietLichSuCuocGoi';
import addListPhoneBook from '../screens/PhoneBook/addListPhoneBook';
import CuocGoiTransfer from '../screens/cuocgoi/CuocGoiTransfer';
import DoiMatKhau from '../screens/Account/DoiMatKhau';


const Drawer = createDrawerNavigator();

function AppNavigation(props) {
    return (
        <NavigationContainer ref={navigationRef}>
            <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
                <Drawer.Screen name="TabCuocGoiNavigation" component={TabCuocGoiNavigation} />
                <Drawer.Screen name="CuocGoi" component={CuocGoi} />
                <Drawer.Screen name="CuocGoiTransfer" component={CuocGoiTransfer} />
                <Drawer.Screen name="LogScreen" component={LogScreen} />
                <Drawer.Screen name="ChiTietLichSuCuocGoi" component={ChiTietLichSuCuocGoi} />
                <Drawer.Screen name="addListPhoneBook" component={addListPhoneBook} />
                <Drawer.Screen name="Login" component={Login} />
                <Drawer.Screen name="DoiMatKhau" component={DoiMatKhau} />

            </Drawer.Navigator>
        </NavigationContainer >
    );
}

export default AppNavigation;