import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Dimensions,
    Alert,
    TouchableOpacity,
    Image,
} from 'react-native';

import { Avatar, Icon, Button } from 'react-native-elements';
import storeData from '../../hooks/storeData';
import AppApi from '../../api/Client';
import BaseURL from '../../utils/BaseURL';
import { ScrollView } from 'react-native-gesture-handler';
import deviceInfoModule from 'react-native-device-info';
import colors from '../../theme/colors';
import keyStoreData from '../../utils/keyStoreData';
import ProgressApp from '../../components/ProgressApp';
import BackgroundTimer from 'react-native-background-timer';
import { getHubAndReconnect } from '../../hubmanager/HubManager';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default function Caidat({ navigation }) {

    const [teninfo, setTeninfo] = useState('');
    const [diachi, setDiachi] = useState('');
    const [sdt, setSdt] = useState('');
    const [sdtv2, setSdtv2] = useState('');
    const [webinfo, setWebinfo] = useState('');
    const [tennhanvien, setTennhanvien] = useState('');
    const [somayle, setSomayle] = useState('');
    const [chucvu, setChucvu] = useState('');
    const [avata, setAvata] = useState('');
    const [showProcess, setShowProcess] = useState(false);

    const removeDataLogin = () => {
        storeData.setStoreDataObject(keyStoreData.sip_user, {});
        storeData.setStoreDataValue(keyStoreData.tennhanvien, '');
        storeData.setStoreDataValue(keyStoreData.isLogin, false);
        navigation.navigate('Login');
    }

    const handleLogout = async () => {
        try {
            setShowProcess(true);
            let http = await storeData.getStoreDataValue('urlApi');
            var url = http + BaseURL.URL_LOGOUT;
            let mact = await storeData.getStoreDataValue('tenct');
            let prefix = await storeData.getStoreDataValue('Prefix');
            let somayle = await storeData.getStoreDataValue('somayle');
            let idnhanvien = await storeData.getStoreDataValue('idnhanvien');
            let imei = deviceInfoModule.getUniqueId();

            var params = {
                imei: imei,
                prefix: prefix,
                mact: mact,
                somayle: somayle,
                hinhthucdangxuat: '0',
                idnhanvien: idnhanvien,
                token: '',
            };
            fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            }).then((responce) => {
                setShowProcess(false);
                var conn = getHubAndReconnect();
                conn.invoke('SignOut').catch(); 
                if (responce.status) {
                    BackgroundTimer.setTimeout(() => {
                        try {
                            setError(false);
                            setIsLogout(true);
                            conn.invoke('SignOut').catch();
                            conn.stop();
                            removeDataLogin();
                        }
                        catch (err) {
                            removeDataLogin();
                        }
                    }, 1000);
                    // conn.stop();
                }
            })
            setShowProcess(false);
        } catch (error) {
            setShowProcess(false);
        }
    }

    useEffect(() => {

    }, [showProcess]);

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            getInFo();
            setShowProcess(false);
        });

        return unsubscribe;
    }, [navigation]);

    const getInFo = async () => {
        let tennhanvienData = await storeData.getStoreDataValue(keyStoreData.tennhanvien);
        let somayleData = await storeData.getStoreDataValue(keyStoreData.somayle);
        let chucvuData = await storeData.getStoreDataValue(keyStoreData.chucvu);
        let urlApiData = await storeData.getStoreDataValue(keyStoreData.urlApi);

        setTennhanvien(tennhanvienData);
        setSomayle(somayleData);
        setChucvu(chucvuData);

        if (tennhanvienData.length > 0)
            setAvata(tennhanvienData.substring(0, 1));

        var url = urlApiData + BaseURL.URL_INFO;
        console.log('url: ', urlApiData);
        var params = {
            lang: 'vi',
        };

        console.log('url', url);

        AppApi.RequestPOST(url, params, (err, json) => {
            if (!err) {
                if (json.data.status) {
                    setTeninfo(json.data.tenlienhe);
                    setDiachi(json.data.diachi);
                    setSdt(json.data.dienthoai1);
                    setSdtv2(json.data.hotline);
                    setWebinfo(json.data.website);
                }
            } else {
                console.log('Error get api: ', err);
            }
        });
    }


    return (
        <ScrollView>
            <SafeAreaView style={styles.container}>
                {
                    showProcess == true && <ProgressApp />
                }
                <View style={styles.userInfoSectionv2}>
                    <View style={{ flexDirection: 'row', marginTop: 20 }}>
                        <Avatar
                            activeOpacity={0.2}
                            containerStyle={{ backgroundColor: '#0061a8' }}
                            rounded
                            size="large"
                            title={avata}
                        />

                        <View style={{ marginLeft: 10 }}>
                            <Text
                                style={[
                                    styles.title,
                                    {
                                        marginTop: 10,
                                        marginBottom: 5,
                                    },
                                ]}>
                                {tennhanvien}
                            </Text>

                            <View style={styles.row}>
                                <Icon
                                    type="Ionicons"
                                    name="call"
                                    style={{ fontSize: 20, color: '#777777' }}
                                />
                                <Text style={styles.caption}> {somayle}</Text>
                            </View>


                            <View style={styles.rowv2}>
                                <Icon
                                    type="MaterialIcons"
                                    name="work"
                                    style={{ fontSize: 20, color: '#777777' }}
                                />
                                <Text style={styles.caption}>{chucvu}</Text>
                            </View>


                        </View>
                    </View>
                </View>



                <View style={styles.infoBoxWrapper}>
                    <View style={styles.menuWrapper}>
                        <TouchableOpacity
                            onPress={() => {
                                navigation.navigate('DoiMatKhau');
                            }}>
                            <View style={styles.menuItem}>
                                <Icon
                                    type="Entypo"
                                    name="lock"
                                    style={{ fontSize: 25, color: '#FF6347' }}
                                />
                                <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
                            </View>
                        </TouchableOpacity>


                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(
                                    'Thông báo',
                                    'Bạn có chắc chắn muốn đăng xuất ?',
                                    [
                                        {
                                            text: 'Thoát',
                                            onPress: () => console.log('Cancel Pressed'),
                                            style: 'cancel',
                                        },
                                        {
                                            text: 'Đồng ý',
                                            onPress: () => handleLogout(),
                                        },
                                    ],
                                    { cancelable: false },
                                );
                            }}>
                            <View style={styles.menuItem}>
                                <Icon
                                    type="MaterialCommunityIcons"
                                    name="exit-to-app"
                                    style={{ fontSize: 25, color: '#FF6347' }}
                                />
                                <Text style={styles.menuItemText}>Đăng xuất</Text>
                            </View>
                        </TouchableOpacity>

                        {/* <View style={{ marginTop: 40 }}>
                            <Button onPress={() => navigation.navigate('LogScreen')} title='Show Log' />
                        </View> */}
                    </View>
                </View>

                <View>
                    <View
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Image
                            source={require('../../Toda_Images/logo.png')}
                            style={{
                                width: 100,
                                height: 85,
                                resizeMode: 'contain',
                            }}
                        />
                    </View>

                    <Text style={styles.text_ten}>{teninfo}</Text>
                    <Text style={styles.text_diachi}> - {diachi}</Text>
                    <Text style={styles.text_diachi}> - {sdt}</Text>
                    <Text style={styles.text_diachi}> - {sdtv2}</Text>
                    <Text style={styles.text_diachi}> - {webinfo}</Text>
                </View>
            </SafeAreaView>
        </ScrollView>
    );


}

var styles = StyleSheet.create({
    container: {
        flex: 1,
        width: DEVICE_WIDTH,
    },
    userInfoSectionv2: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    userInfoSection: {
        paddingHorizontal: 30,
        marginBottom: 15,
        marginLeft: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    caption: {
        fontSize: 16,
        marginLeft: 10,
        fontWeight: '500',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    rowv2: {
        flexDirection: 'row',
        marginBottom: 10,
        marginTop: 5
    },
    infoBoxWrapper: {
        borderBottomColor: '#dddddd',
        borderBottomWidth: 1,
        borderTopColor: '#dddddd',
        borderTopWidth: 1,
        flexDirection: 'row',
        marginRight: 15,
        marginLeft: 15,
    },

    infoBox: {
        width: '50%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuWrapper: {
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        width: DEVICE_WIDTH,
        paddingVertical: 15,
        paddingHorizontal: 30,
    },
    menuItemText: {
        color: '#777777',
        marginLeft: 20,
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 26,
    },
    text_ten: {
        color: '#1976d2',
        marginLeft: 15,
        fontSize: 15,
    },
    text_diachi: {
        color: '#1976d2',
        marginLeft: 15,
        fontSize: 15,
        marginTop: 5,
    },

    text: {
        marginBottom: 5,
        fontFamily: 'Avenir Next',
        color: '#3366CC',

    },
    link: {
        alignItems: 'center',
        justifyContent: 'center'

    },
});
