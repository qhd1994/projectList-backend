const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors'); // 이 줄을 추가합니다.

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 모든 출처에서의 요청을 허용하도록 CORS 미들웨어를 추가합니다.
app.use(cors()); // 이 줄을 추가합니다.

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('MySQL 데이터베이스 연결 실패:', err);
        return;
    }
    console.log('MySQL 데이터베이스 연결 성공!');

    // 테스트 쿼리 실행
    connection.query('SELECT 2 + 2 AS solution', (error, results, fields) => {
        if (error) {
            console.error('테스트 쿼리 실행 중 오류 발생:', error);
            return;
        }
        console.log('테스트 결과:', results[0].solution);
    });
});

// 프로젝트 목록을 가져오는 API 엔드포인트
app.get('/api/projects', (req, res) => {
    const query = 'SELECT id, title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate FROM projects';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('프로젝트를 가져오는 중 오류 발생:', error);
            res.status(500).json({ error: '데이터를 가져올 수 없습니다.' });
            return;
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중 입니다.`);
});