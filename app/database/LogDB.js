import { openDatabase } from 'react-native-sqlite-storage';
var db = openDatabase({ name: 'UserDatabase.db' });

const addLog = (desLog) => {
  console.log('addLog: ', desLog);
  let date = new Date();
  let time = date.getTime();
  console.log('time', time);

  db.transaction((tx) => {

    tx.executeSql(
      'SELECT * FROM Log',
      [],
      (tx, { rows }) => {
        if (rows.length > 1000) {
          tx.executeSql(
            'DELETE FROM  Log',
            [],
            (tx, results) => {
              console.log('Results deleteLog', results.rowsAffected);
            },
            (error) => {
              console.log('error deleteLog', error);
            },
          );
        }
      },
      (tx, error) => {
        console.log('error addLog', tx, error);
      },
    );

    tx.executeSql(
      'INSERT INTO Log (logType, logTime) VALUES (?,?)',
      [desLog, time],
      (tx, results) => {
        console.log('Results addLog', results.rowsAffected);
      },
      (tx, error) => {
        console.log('error addLog', tx, error);
      },
    );
  });
}


const deleteLog = (id) => {
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

export default { addLog, deleteLog };