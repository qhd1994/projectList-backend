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

// 4. MySQL 연결 설정 (mysql2/promise 라이브러리 사용
const mysql = require('mysql2/promise');

// .env 파일 또는 Railway 환경 변수에서 DATABASE_URL 가져오기
const databaseUrl = process.env.DATABASE_URL;

// 데이터베이스 연결 풀 생성 (여러 연결을 효율적으로 관리)
let pool;
async function connectToDatabase() {
    try {
        if (!databaseUrl) {
            console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다. (로컬에서 Railway 내부 DB에 직접 연결 불가)');
            pool = null; // pool을 null로 설정하여 데이터베이스 미연결 상태를 나타냄
            return; 
        }
        pool = mysql.createPool(databaseUrl);
        console.log('MySQL 데이터베이스 연결 시도...');

        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        console.log('MySQL 데이터베이스 연결 성공! 테스트 결과:', rows[0].solution);

    } catch (error) {
        console.error('MySQL 데이터베이스 연결 실패:', error.message);
        pool = null;
    }
}

// 5. Express 미들웨어 설정
app.use(express.json()); // JSON 형식의 요청 본문 파싱

// 6. API 엔드포인트 정의

// 프로젝트 목록 조회 (GET) - 기존 기능 유지 및 최신순 정렬
app.get('/api/projects', async (req, res) => {
    try {
        if (!pool) {
            return res.status(503).json({ 
                message: '데이터베이스 연결이 준비되지 않았습니다. 서버가 로컬에서 실행 중이거나 데이터베이스 연결에 실패했습니다.',
                error: 'DATABASE_NOT_CONNECTED_LOCALLY'
            });
        }
        const query = 'SELECT id, title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate FROM projects ORDER BY startDate DESC, id DESC';
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('프로젝트를 가져오는 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류: 프로젝트를 가져올 수 없습니다.' });
    }
});

// 새로운 프로젝트 추가 (POST)
app.post('/api/projects', async (req, res) => {
    try {
        if (!pool) {
            return res.status(503).json({ 
                message: '데이터베이스 연결이 준비되지 않았습니다.',
                error: 'DATABASE_NOT_CONNECTED'
            });
        }
        const { title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate } = req.body;
        // 필수 필드 유효성 검사 (간단 예시)
        if (!title || !description || !technologies || !status) {
            return res.status(400).json({ message: '필수 필드(title, description, technologies, status)를 모두 입력해야 합니다.' });
        }

        const query = `
            INSERT INTO projects (title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate]);
        
        res.status(201).json({ 
            message: '프로젝트가 성공적으로 추가되었습니다.', 
            projectId: result.insertId,
            project: { id: result.insertId, title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate }
        });
    } catch (error) {
        console.error('프로젝트 추가 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류: 프로젝트를 추가할 수 없습니다.' });
    }
});

// 특정 프로젝트 조회 (GET by ID) - 관리자 페이지에서 개별 프로젝트 편집 시 필요
app.get('/api/projects/:id', async (req, res) => {
    try {
        if (!pool) {
            return res.status(503).json({ 
                message: '데이터베이스 연결이 준비되지 않았습니다.',
                error: 'DATABASE_NOT_CONNECTED'
            });
        }
        const projectId = req.params.id;
        const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('특정 프로젝트 조회 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류: 프로젝트를 조회할 수 없습니다.' });
    }
});

// 프로젝트 업데이트 (PUT)
app.put('/api/projects/:id', async (req, res) => {
    try {
        if (!pool) {
            return res.status(503).json({ 
                message: '데이터베이스 연결이 준비되지 않았습니다.',
                error: 'DATABASE_NOT_CONNECTED'
            });
        }
        const projectId = req.params.id;
        const { title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate } = req.body;
        
        // 필수 필드 유효성 검사
        if (!title || !description || !technologies || !status) {
            return res.status(400).json({ message: '필수 필드(title, description, technologies, status)를 모두 입력해야 합니다.' });
        }

        const query = `
            UPDATE projects
            SET title = ?, description = ?, technologies = ?, imageUrl = ?, projectLink = ?, githubLink = ?, status = ?, startDate = ?, endDate = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [title, description, technologies, imageUrl, projectLink, githubLink, status, startDate, endDate, projectId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '업데이트할 프로젝트를 찾을 수 없거나 변경된 내용이 없습니다.' });
        }
        res.json({ message: '프로젝트가 성공적으로 업데이트되었습니다.' });
    } catch (error) {
        console.error('프로젝트 업데이트 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류: 프로젝트를 업데이트할 수 없습니다.' });
    }
});

// 프로젝트 삭제 (DELETE)
app.delete('/api/projects/:id', async (req, res) => {
    try {
        if (!pool) {
            return res.status(503).json({ 
                message: '데이터베이스 연결이 준비되지 않았습니다.',
                error: 'DATABASE_NOT_CONNECTED'
            });
        }
        const projectId = req.params.id;
        const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '삭제할 프로젝트를 찾을 수 없습니다.' });
        }
        res.json({ message: '프로젝트가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('프로젝트 삭제 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류: 프로젝트를 삭제할 수 없습니다.' });
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
