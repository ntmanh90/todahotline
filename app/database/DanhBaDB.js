import { openDatabase } from 'react-native-sqlite-storage';
var db = openDatabase({ name: 'UserDatabase.db' });

const addDanhBa = (ten, sdt, anh_dai_dien, type) => {
  db.transaction((tx) => {
    tx.executeSql(
      //DanhBa: id_danh_ba integer primary key not null, ho_ten text , so_dien_thoai text, anh_dai_dien text,  kieu_danh_ba integer)
      'INSERT INTO DanhBa (ho_ten, so_dien_thoai, anh_dai_dien,kieu_danh_ba) VALUES (?,?,?,?)',
      [ten, sdt, anh_dai_dien, type],
      (tx, results) => {
        console.log('Results addContact', sdt, results.rowsAffected);
      },
      (error) => {
        console.log('error addContact', msg.message);;
      },
    );
  });
}

const listDanhBa = () => {
  db.transaction((tx) => {
    tx.executeSql(
      //DanhBa: id_danh_ba integer primary key not null, ho_ten text , so_dien_thoai text, anh_dai_dien text,  kieu_danh_ba integer)
      'SELECT * FROM DanhBa',
      [],
      (tx, { rows }) => {
        console.log('Results list DanhBa', rows.length);
      },
      (error) => {
        console.log('error list DanhBa', msg.message);;
      },
    );
  });
}

const updateDanhBa = (id, ten, sdt) => {
  db.transaction((tx) => {
    tx.executeSql(
      'UPDATE DanhBa set ho_ten=?, so_dien_thoai=? where id_danh_ba=?',
      [ten, sdt, id],
      (tx, results) => {
        console.log('Results updateContact', results.rowsAffected);
      },
      (error) => {
        console.log('error updateContact', error);
      },
    );
  });
}

const deleteDanhBa = (id) => {
  db.transaction((tx) => {
    tx.executeSql(
      'DELETE FROM  DanhBa where id_danh_ba=?',
      [id],
      (tx, results) => {
        console.log('Results deleteDanhBa', results.rowsAffected);
      },
      (error) => {
        console.log('error deleteDanhBa', error);
      },
    );
  });
}

export default { addDanhBa, deleteDanhBa, updateDanhBa, listDanhBa };