// server.js

// 1. dotenv를 사용하여 .env 파일의 환경 변수 로드
require('dotenv').config();

// 2. Express 앱 설정
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Railway는 PORT 환경 변수를 제공

// 3. MySQL 연결 설정 (mysql2 라이브러리 사용)
const mysql = require('mysql2/promise'); // Promise 기반 API 사용 권장

// .env 파일에서 DATABASE_URL 환경 변수 가져오기
const databaseUrl = process.env.DATABASE_URL;

// 데이터베이스 연결 풀 생성 (여러 연결을 효율적으로 관리)
let pool;
async function connectToDatabase() {
    try {
        if (!databaseUrl) {
            // DATABASE_URL이 설정되지 않았다면, 연결 시도 자체를 하지 않음.
            // 로컬에서 테스트 시 Railway 내부 DB URL에 연결할 수 없으므로 pool을 null로 설정
            console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다. (또는 로컬에서 Railway 내부 DB 연결 불가)');
            pool = null; // pool을 null로 설정하여 데이터베이스 미연결 상태를 나타냄
            return; // 서버가 종료되지 않도록 함수 종료
        }
        pool = mysql.createPool(databaseUrl);
        console.log('MySQL 데이터베이스 연결 시도...');

        // 연결 테스트 (선택 사항) - 실제 연결은 이 쿼리에서 이루어짐
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        console.log('MySQL 데이터베이스 연결 성공! 테스트 결과:', rows[0].solution);

    } catch (error) {
        console.error('MySQL 데이터베이스 연결 실패:', error.message);
        // !!! 중요: 로컬에서 테스트할 때 서버가 즉시 종료되지 않도록 process.exit(1)을 주석 처리하거나 삭제합니다.
        // Railway에 배포 시에는 이 오류가 발생하지 않으므로 process.exit(1)이 필요할 수 있지만,
        // 현재 로컬 개발 환경에서는 서버가 계속 실행되도록 합니다.
        pool = null; // 데이터베이스 연결 실패 시 pool을 null로 설정
        // process.exit(1); // 이 줄을 주석 처리하거나 삭제합니다.
    }
}

// 4. 미들웨어 설정 (필요시)
app.use(express.json()); // JSON 형식의 요청 본문 파싱

// 모든 프로젝트를 가져오는 API 엔드포인트
app.get('/api/projects', async (req, res) => {
    try {
        // 데이터베이스 연결 풀(pool)이 유효한지 먼저 확인합니다.
        if (!pool) {
            return res.status(503).json({ 
                message: '데이터베이스 연결이 준비되지 않았습니다. 서버가 로컬에서 실행 중이거나 데이터베이스 연결에 실패했습니다.',
                error: 'DATABASE_NOT_CONNECTED_LOCALLY'
            });
        }

        const [rows] = await pool.query('SELECT * FROM projects ORDER BY createdAt DESC');
        res.json(rows); // JSON 형태로 데이터를 응답
    } catch (error) {
        console.error('프로젝트를 가져오는 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류: 프로젝트를 가져올 수 없습니다.' });
    }
});

// 6. 서버 시작 함수
async function startServer() {
    await connectToDatabase(); // 데이터베이스 먼저 연결 시도
    app.listen(port, () => {
        console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
        // 데이터베이스 연결 여부와 관계없이 서버는 시작됩니다.
        if (!pool) {
            console.log('주의: 데이터베이스에 연결할 수 없으므로 /api/projects 엔드포인트는 오류를 반환할 수 있습니다.');
        }
    });
}

// 서버 시작
startServer();

// 연결 풀 내보내기 (다른 파일에서 DB 연결 객체를 재사용할 수 있도록)
module.exports = {
    pool
};
