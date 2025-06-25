// server.js

// 1. dotenv를 사용하여 .env 파일의 환경 변수 로
const dotenv = require('dotenv');
dotenv.config();

// 2. Express 앱 설정
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Railway는 PORT 환경 변수를 제공

// 3. CORS 미들웨어 설정
const cors = require('cors');
app.use(cors()); // 모든 출처에서의 요청을 허용하도록 CORS 미들웨어 추가

// 4. MySQL 연결 설정 (mysql2/promise 라이브러리 사용)
// Promise 기반 API를 사용하여 async/await 문법으로 비동기 처리를 간결하게 할 수 있습니다.
const mysql = require('mysql2/promise');

// .env 파일 또는 Railway 환경 변수에서 DATABASE_URL 가져오기
const databaseUrl = process.env.DATABASE_URL;

// 데이터베이스 연결 풀 생성 (여러 연결을 효율적으로 관리)
let pool;
async function connectToDatabase() {
    try {
        if (!databaseUrl) {
            // DATABASE_URL이 설정되지 않았다면 (예: 로컬에서 Railway 내부 DB에 직접 연결 시도 시)
            console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다. (로컬에서 Railway 내부 DB에 직접 연결 불가)');
            pool = null; // pool을 null로 설정하여 데이터베이스 미연결 상태를 나타냄
            // 로컬 개발 환경에서 서버가 종료되지 않도록 여기서 return 합니다.
            return; 
        }
        // DATABASE_URL을 사용하여 연결 풀 생성
        // mysql2/promise는 CONNECTION_STRING을 직접 파싱할 수 있습니다.
        pool = mysql.createPool(databaseUrl);
        console.log('MySQL 데이터베이스 연결 시도...');

        // 연결 테스트: 실제 연결이 잘 되는지 확인하는 쿼리
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        console.log('MySQL 데이터베이스 연결 성공! 테스트 결과:', rows[0].solution);

    } catch (error) {
        console.error('MySQL 데이터베이스 연결 실패:', error.message);
        pool = null; // 데이터베이스 연결 실패 시 pool을 null로 설정
        // !!! 중요: Railway 배포 환경에서는 서버가 시작되지 않도록 process.exit(1)을 사용할 수 있지만,
        // 현재 로컬 개발/테스트 중에는 오류가 나더라도 서버를 계속 실행하는 것이 편리합니다.
        // process.exit(1); 
    }
}

// 5. Express 미들웨어 설정
app.use(express.json()); // JSON 형식의 요청 본문 파싱 (CRUD 기능 구현 시 필요)

// 6. API 엔드포인트 정의

// 프로젝트 목록을 가져오는 API 엔드포인트 (GET)
// 최신 프로젝트가 우선으로 나오도록 startDate와 id 기준으로 내림차순 정렬
app.get('/api/projects', async (req, res) => {
    try {
        // 데이터베이스 연결 풀(pool)이 유효한지 먼저 확인합니다.
        if (!pool) {
            return res.status(503).json({ 
                message: '데이터베이스 연결이 준비되지 않았습니다. 서버가 로컬에서 실행 중이거나 데이터베이스 연결에 실패했습니다.',
                error: 'DATABASE_NOT_CONNECTED_LOCALLY'
            });
        }

        // startDate를 기준으로 내림차순 정렬 (최신 프로젝트 우선), 그 다음 id를 기준으로 내림차순 정렬
        const query = 'SELECT id, title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate FROM projects ORDER BY startDate DESC, id DESC';
        const [rows] = await pool.query(query); // pool.query는 Promise를 반환합니다.
        res.json(rows); // JSON 형태로 데이터를 응답
    } catch (error) {
        console.error('프로젝트를 가져오는 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류: 프로젝트를 가져올 수 없습니다.' });
    }
});

// 7. 서버 시작
async function startServer() {
    await connectToDatabase(); // 데이터베이스 연결 시도를 기다립니다.
    app.listen(port, () => {
        console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
        // 데이터베이스 연결 여부와 관계없이 서버는 시작됩니다.
        if (!pool) {
            console.log('주의: 데이터베이스에 연결할 수 없으므로 /api/projects 엔드포인트는 오류를 반환할 수 있습니다.');
        }
    });
}

// 서버 시작 함수 호출
startServer();

// 8. (선택 사항) 연결 풀 내보내기 - 다른 모듈에서 DB 풀을 사용할 경우
module.exports = {
    pool
};
