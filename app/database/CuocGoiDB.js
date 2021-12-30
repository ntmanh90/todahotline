import {openDatabase} from 'react-native-sqlite-storage';
import storeData from '../hooks/storeData';
import moment from 'moment';
import keyStoreData from '../utils/keyStoreData';
var db = openDatabase({name: 'UserDatabase.db'});

const initTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS CuocGoi (id_cuoc_goi integer primary key not null, ho_ten text , so_dien_thoai text, so_lan_goi integer, anh_dai_dien text, kieu_cuoc_goi integer, ngay_goi text)',
    );
  });

  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS ChiTietCuocGoi (id_ct_cuoc_goi integer primary key not null, id_cuoc_goi integer , ngay_goi text, thoi_gian_dam_thoai integer,  kieu_cuoc_goi integer)',
    );
  });

  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Log (id integer primary key not null, logType text , logTime real )',
    );
  });

  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS DanhBa (id_danh_ba integer primary key not null, ho_ten text , so_dien_thoai text, anh_dai_dien text,  kieu_danh_ba integer)',
    );
  });

  storeData.getStoreDataValue(keyStoreData.isCreateTableSqlite, true);
};

const addCuocGoi = (sdt, type) => {
  let ho_ten_danh_ba = '';
  let anh_dai_dien_danh_ba = '';
  let id_cuoc_goi = 0;
  var dateNow = moment(new Date()).format('YYYY/MM/DD, HH:mm:ss');

  console.log('dateNow', dateNow);
  db.transaction(tx => {
    tx.executeSql(
      "SELECT * FROM DanhBa WHERE REPLACE(so_dien_thoai, ' ', '') = ?",
      [sdt],
      (tx, {rows}) => {
        //console.log('SQLlite list DanhBa: ', rows);
        if (rows.length > 0) {
          // console.log('SQLlite list DanhBa: ', rows);
          ho_ten_danh_ba = rows.item(0).ho_ten;
          anh_dai_dien_danh_ba = rows.item(0).anh_dai_dien;
        }
      },
      (tx, error) => {
        console.log(error);
      },
    );

    tx.executeSql(
      'SELECT * FROM CuocGoi ORDER  By id_cuoc_goi DESC LIMIT 2 ',
      [],
      (tx, {rows}) => {
        if (
          rows.length > 0 &&
          rows.item(0).so_dien_thoai == sdt &&
          rows.item(0).kieu_cuoc_goi == type
        ) {
          id_cuoc_goi = rows.item(0).id_cuoc_goi;
          console.log('id_cuoc_goi 0', rows.item(0).id_cuoc_goi);

          tx.executeSql(
            'UPDATE CuocGoi SET so_lan_goi = so_lan_goi + 1, ngay_goi = ? where id_cuoc_goi = ?',
            [dateNow, id_cuoc_goi],
            (tx, results) => {
              // console.log('SQLite Results UPDATE cuocgoi', results.rowsAffected);

              tx.executeSql(
                'INSERT INTO ChiTietCuocGoi (id_cuoc_goi, ngay_goi, kieu_cuoc_goi) VALUES (?,?,?)',
                [id_cuoc_goi, dateNow, type],
                (tx, results) => {
                  // console.log('SQLite Results add ChiTietCuocGoi', results.insertId);
                },
                error => {
                  console.log('SQLlite error add ChiTietCuocGoi: ', error);
                },
              );
            },
            error => {
              console.log('SQLlite error UPDATE cuocgoi: ', error);
            },
          );
        } else {
          if (ho_ten_danh_ba === '' || ho_ten_danh_ba === null) {
            ho_ten_danh_ba = sdt;
          }
          if (anh_dai_dien_danh_ba === '' || anh_dai_dien_danh_ba === null) {
            anh_dai_dien_danh_ba = ho_ten_danh_ba.substring(0, 1);
          }
          console.log(ho_ten_danh_ba, anh_dai_dien_danh_ba);

          tx.executeSql(
            'INSERT INTO CuocGoi (ho_ten, so_dien_thoai, so_lan_goi, anh_dai_dien, kieu_cuoc_goi, ngay_goi) VALUES (?,?,?,?,?,?)',
            [ho_ten_danh_ba, sdt, 1, anh_dai_dien_danh_ba, type, dateNow],
            (tx, results) => {
              id_cuoc_goi = results.insertId;
              // console.log('SQLite Results add CuocGoi', results.insertId);

              tx.executeSql(
                'INSERT INTO ChiTietCuocGoi (id_cuoc_goi, ngay_goi, kieu_cuoc_goi) VALUES (?,?,?)',
                [id_cuoc_goi, dateNow, type],
                (tx, results) => {
                  // console.log('SQLite Results add ChiTietCuocGoi', results.insertId);
                },
                error => {
                  console.log('SQLlite error add ChiTietCuocGoi: ', error);
                },
              );
            },
            error => {
              console.log('SQLlite error add CuocGoi: ', error);
            },
          );
        }
      },
      (tx, error) => {
        console.log(error);
      },
    );
  });
};

const deleteCuocGoi = id => {
  db.transaction(tx => {
    tx.executeSql(
      'DELETE FROM  CuocGoi where id_cuoc_goi = ?',
      [id],
      (tx, results) => {
        // console.log('SQL delete CuocGoi: ', results.rowsAffected);
        if (results.rowsAffected > 0) {
          tx.executeSql(
            'DELETE FROM ChiTietCuocGoi where id_cuoc_goi = ?',
            [id_cuoc_goi],
            (tx, results) => {
              console.log('SQL delete ChiTietCuocGoi: ', results.rowsAffected);
            },
          );
        }
      },
    );
  });
};

export default {initTable, addCuocGoi, deleteCuocGoi};
