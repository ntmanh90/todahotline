import { Platform } from 'react-native'
import Contacts from 'react-native-contacts';
import DanhBaDB from '../database/DanhBaDB';
import KieuDanhBa from './kieuDanhBa';
import { openDatabase } from 'react-native-sqlite-storage';
var db = openDatabase({ name: 'UserDatabase.db' });

var IOS = Platform.OS === 'ios';

const addDanhBa = () => {
    Contacts.getAll()
        .then((contacts) => {
            console.log('da duoc cap quyen danh ba', contacts.length);
            contacts.forEach((contact) => {
                // console.log('contact', contact);
                if (contact.phoneNumbers.length > 0) {
                    if (IOS) {
                        DanhBaDB.addDanhBa(contact.familyName + " " + contact.givenName, contact.phoneNumbers[0].number, contact.givenName.substring(0, 1), KieuDanhBa.HeThong);
                    }
                    else {
                        DanhBaDB.addDanhBa(contact.displayName, contact.phoneNumbers[0].number, contact.displayName.substring(0, 1), KieuDanhBa.HeThong);
                    }
                }
            });
        })
}

const themDanhBa = async () => {
    addDanhBa();
}

export default { themDanhBa }
