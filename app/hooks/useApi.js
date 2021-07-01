import React, { useState } from 'react'

export default useApi = (apiFunc) => {
    const [data, setData] = useState([]);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const request = async (...args) => {
        //console.log('param request: ', args);
        setLoading(true);
        const response = await apiFunc(...args);
        // console.log('response api', response);
        setLoading(false);

        setError(!response.data.flag);

        setData(response.data);

        return response;
    };

    return { data, error, loading, request };
}