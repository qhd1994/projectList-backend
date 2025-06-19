const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 모든 출처에서의 요청을 허용하도록 CORS 미들웨어를 추가합니다.
app.use(cors())

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true, // 풀에 사용 가능한 연결이 없을 때 대기할지 여부
    connectionLimit: 10,       // 동시에 유지할 최대 연결 수
    queueLimit: 0              // 연결 요청 대기열의 최대 크기 (0은 무제한)
};

// --- 기존 connection.createConnection(...) 부분을 아래처럼 변경합니다. ---
const pool = mysql.createPool(dbConfig); // Connection Pool 생성

// 풀이 성공적으로 생성되었는지 확인
pool.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL 데이터베이스 풀 연결 실패:', err);
        // 필요에 따라 오류 처리 로직 추가
        return;
    }
    console.log('MySQL 데이터베이스 풀 연결 성공!');
    connection.release(); // 연결을 다시 풀로 반환 (테스트 연결이므로)
});

// 프로젝트 목록을 가져오는 API 엔드포인트
app.get('/api/projects', (req, res) => {
    // --- connection.query 대신 pool.query를 사용합니다. ---
    const query = 'SELECT id, title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate FROM projects';
    pool.query(query, (error, results) => {
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