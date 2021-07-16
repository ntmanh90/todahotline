import React, { useState } from 'react'
import { openDatabase } from 'react-native-sqlite-storage';
var db = openDatabase({ name: 'UserDatabase.db' });

export default useGetHoTenDanhBa = () => {
    const [hoTen, setHoTen] = useState('');

    const getHoTenTheoSoDienThoai = async (sdt) => {
        setHoTen(sdt);

        console.log('getHoTenTheoSoDienThoai: ', sdt);

        await db.transaction((tx) => {
            tx.executeSql("SELECT * FROM DanhBa WHERE so_dien_thoai = ?", [sdt],
                (tx, { rows }) => {
                    console.log('getHoTenTheoSoDienThoai', rows);
                    if (rows.length > 0) {

                        let termHoTen = rows.item(0).ho_ten;
                        console.log('termHoTen: ', termHoTen);
                        setHoTen(termHoTen);
                    }
                },
                (tx, error) => {
                    console.log('Error list cuoc goi: ', error);
                }
            );
        });
        return sdt;
    };

    return { hoTen, getHoTenTheoSoDienThoai };
}