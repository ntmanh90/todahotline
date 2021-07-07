import AsyncStorage from '@react-native-async-storage/async-storage';

const getStoreDataObject = async (key) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key)
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error(e);
        return null;
        // error reading value
    }
}

const setStoreDataObject = async (key, value) => {
    // console.log('setStoreDataValue: ', key, value);
    try {
        const jsonValue = JSON.stringify(value)
        await AsyncStorage.setItem(key, jsonValue)
    } catch (e) {
        console.error(e);
        return null;
        // saving error
    }
}

const setStoreDataValue = async (key, value) => {
    // console.log('setStoreDataValue: ', key, value);
    try {
        await AsyncStorage.setItem(key, value.toString());
    } catch (e) {
        console.error(e);
        return null;
        // saving error
    }
}

const getStoreDataValue = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key)
        if (value !== null) {
            return value;
        }
    } catch (e) {
        console.error(e, key);
        return null;
        // error reading value
    }
}
export default {
    getStoreDataValue,
    getStoreDataObject,
    setStoreDataObject,
    setStoreDataValue
}