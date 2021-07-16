import React, { useState, useEffect } from 'react';
import { View, Platform, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import TabTrenMay from './tabBookTrenMay';
import TabHeThong from './tabBookHeThong';
import TabKhachHang from './tabBookKhachHang';
import typeDanhBa from '../../utils/kieuDanhBa';

export default function phoneBookScreen({ navigation }) {
  const [type, setType] = useState(0);

  const renderView = () => {
    if (type == typeDanhBa.TrenMay) {
      return (
        <TabTrenMay />
      )
    } else if (type == typeDanhBa.HeThong) {
      return (
        <TabHeThong />
      )
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', paddingTop: 10, backgroundColor: "#fff" }}>
        <TouchableOpacity style={{ flex: 1, alignItems: 'center' }}
          onPress={() => {
            setType(typeDanhBa.TrenMay)
          }}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{
              color: type == 0 ? '#1976d2' : '#000',
              fontWeight: type == 0 ? '600' : 'normal',
              paddingBottom: 10,
            }}>TRÊN MÁY</Text>

          <View style={{
            width: '100%', height: 5,
            backgroundColor: type == 0 ? '#1976d2' : '#fff',
          }} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, alignItems: 'center' }}
          onPress={() => {
            setType(typeDanhBa.HeThong)
          }}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{
              color: type == 1 ? '#1976d2' : '#000',
              fontWeight: type == 1 ? 'bold' : 'normal',
              paddingBottom: 10,
            }}>HỆ THỐNG</Text>
          <View
            style={{
              width: '100%',
              height: 5,
              backgroundColor: type == 1 ? '#1976d2' : '#fff',
            }} />
        </TouchableOpacity>

        {/* <TouchableOpacity style={{ flex: 1, alignItems: 'center' }}
          onPress={() => {
            setType(typeDanhBa.KhachHang)
          }}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{
              color: type == 2 ? '#1976d2' : '#000',
              fontWeight: type == 2 ? 'bold' : 'normal',
              paddingBottom: 10,
            }}>KHÁCH HÀNG</Text>
          <View
            style={{
              width: '100%',
              height: 5,
              backgroundColor: type == 2 ? '#1976d2' : '#fff',
            }} />
        </TouchableOpacity> */}

      </View>
      {renderView()}


    </SafeAreaView>

  );
}
