// Axiosをインポート
import axios from 'axios';

// Axiosインスタンスを作成
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// BBSデータを取得する関数
export const fetchBbsData = (method, endpoint, sendJson) => {
    const axiosMethod = axiosInstance[method];

    if (axiosMethod) {
        return axiosMethod(endpoint, sendJson)
            .then(response => {
                console.table(response.data);
                return response.data;
            })
            .catch(error => {
                console.error('Error:', error);
                throw error;
            });
    } else {
        throw new Error('Unsupported method');
    }
};