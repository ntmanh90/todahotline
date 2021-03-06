import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BanPhim from '../screens/cuocgoi/BanPhim';
import LichSuCuocGoi from '../screens/cuocgoi/LichSuCuocGoi';
import LienHe from '../screens/cuocgoi/LienHe';
import CaiDat from '../screens/cuocgoi/CaiDat';
import { Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import phoneBookScreen from '../screens/PhoneBook/phoneBookScreen';

const Tab = createBottomTabNavigator();

export default function TabCuocGoiNavigation() {

    return (
        <Tab.Navigator
            initialRouteName="BanPhim"

            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'BanPhim') {
                        iconName = focused
                            ? 'keypad'
                            : 'keypad-outline';
                    }
                    else if (route.name === 'LichSuCuocGoi') {
                        iconName = focused ? 'time' : 'time-outline';
                    }
                    else if (route.name === 'phoneBookScreen') {
                        iconName = focused ? 'ios-people-sharp' : 'ios-people-outline';
                    }
                    else if (route.name === 'CaiDat') {
                        iconName = focused ? 'ios-settings' : 'ios-settings-outline';
                    }

                    // You can return any component that you like here!
                    return <Ionicons name={iconName} size={22} color={color} />;
                },
            })}

            tabBarOptions={{
                activeTintColor: '#0061a8',
                inactiveTintColor: 'gray',
                labelStyle: {
                    marginBottom: 5,
                    fontWeight: 'bold',
                },
                iconStyle: {
                    marginTop: 4,
                }
            }}
        >
            <Tab.Screen
                name="BanPhim"
                component={BanPhim}
                onPress={() => console.log('click BanPhim')}
                options={{
                    tabBarLabel: 'B??n ph??m',
                }}
            />
            <Tab.Screen
                name="LichSuCuocGoi"
                component={LichSuCuocGoi}
                onPress={() => console.log('click LichSuCuocGoi')}
                options={{
                    tabBarLabel: 'L???ch s???',
                }}
            />
            <Tab.Screen
                name="phoneBookScreen"
                component={phoneBookScreen}
                onPress={() => console.log('click LienHe')}
                options={{
                    tabBarLabel: 'Li??n h???',
                }}
            />
            <Tab.Screen
                name="CaiDat"
                component={CaiDat}
                onPress={() => console.log('click CaiDat')}
                options={{
                    tabBarLabel: 'C??i ?????t',
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({


});
