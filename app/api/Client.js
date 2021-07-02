
const RequestGET = async (url, callback) => {
    console.log("url: ", url);
    fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            console.log("response: ", responseJson)

            callback(null, responseJson);
        })
        .catch((error) => {
            callback(error, null);
        })
        .finally();
}

const RequestPOST = async (url, params, callback) => {
    console.log("url: ", url);
    console.log("params: ", params)
    fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            console.log("response: ", responseJson)

            callback(null, responseJson);
        })
        .catch((error) => {
            callback(error, null);
        })
        .finally();
}


export default {
    RequestGET,
    RequestPOST,
}