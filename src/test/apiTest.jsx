import React, { useEffect, useState } from "react";
import axios from "axios";

function ApiTest() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Perl APIへのGETリクエストを送信
        axios
            .get("http://localhost:8080/testResponse")
            .then((response) => {
                setMessage(response.data.message); // APIレスポンスを取得
                console.table(response.data);
                console.table(response);
            })
            .catch((error) => {
                console.error("API request failed:", error);
            });
    }, []);

    return (
        <div>
            <p>{message}</p>
        </div>
    );
}

export default ApiTest;
