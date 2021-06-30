import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BanPhim from '../screens/cuocgoi/BanPhim';
import LichSuCuocGoi from '../screens/cuocgoi/LichSuCuocGoi';
import LienHe from '../screens/cuocgoi/LienHe';
import CaiDat from '../screens/cuocgoi/CaiDat';
import { Text, StyleSheet } from 'react-native';

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
                            ? 'home'
                            : 'home-outline';
                    }
                    else if (route.name === 'LichSuCuocGoi') {
                        iconName = focused ? 'book' : 'book-outline';
                    }
                    else if (route.name === 'LienHe') {
                        iconName = focused ? 'heart-circle' : 'heart-circle-outline';
                    }
                    else if (route.name === 'CaiDat') {
                        iconName = focused ? 'heart-circle' : 'heart-circle-outline';
                    }

                    // You can return any component that you like here!
                    return <Ionicons name={iconName} size={22} color={color} />;
                },
            })}

            tabBarOptions={{
                activeTintColor: '#fa784a',
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
                    tabBarLabel: 'Bàn phím',
                }}
            />
            <Tab.Screen
                name="LichSuCuocGoi"
                component={LichSuCuocGoi}
                onPress={() => console.log('click LichSuCuocGoi')}
                options={{
                    tabBarLabel: 'Lịch sử',
                }}
            />
            <Tab.Screen
                name="LienHe"
                component={LienHe}
                onPress={() => console.log('click LienHe')}
                options={{
                    tabBarLabel: 'Liên hệ',
                }}
            />
            <Tab.Screen
                name="CaiDat"
                component={CaiDat}
                onPress={() => console.log('click CaiDat')}
                options={{
                    tabBarLabel: 'Cài đặt',
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({


});
