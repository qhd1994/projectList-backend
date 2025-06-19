-- database.sql

-- 'projects' 테이블이 이미 존재한다면 삭제합니다.
-- 이는 개발 단계에서 테이블 구조를 변경하거나 데이터를 초기화할 때 유용합니다.
-- 운영 환경에서는 데이터를 보호하기 위해 매우 신중하게 사용해야 합니다.
DROP TABLE IF EXISTS projects;

-- 'projects' 테이블 생성
-- 웹페이지에 표시될 프로젝트 정보를 저장합니다.
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '프로젝트 제목',
    description TEXT COMMENT '프로젝트 상세 설명',
    technologies VARCHAR(255) COMMENT '사용 기술 (콤마로 구분)',
    startDate DATE COMMENT '프로젝트 시작일',
    endDate DATE COMMENT '프로젝트 종료일 (진행중이면 NULL)',
    projectLink VARCHAR(255) COMMENT '배포된 프로젝트 URL',
    githubLink VARCHAR(255) COMMENT 'GitHub 저장소 URL',
    imageUrl VARCHAR(255) COMMENT '프로젝트 대표 이미지 URL',
    status VARCHAR(50) DEFAULT '진행중' COMMENT '프로젝트 상태 (예: 진행중, 완료, 계획중, 중단됨)',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '레코드 생성 시간',
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '레코드 마지막 업데이트 시간'
);

-- 테스트 데이터 삽입
-- 이 프로젝트 웹페이지 자체의 정보를 첫 번째 데이터로 삽입합니다.
INSERT INTO projects (title, description, technologies, startDate, endDate, projectLink, githubLink, imageUrl, status) VALUES
('Project List 웹페이지',
 '개인 프로젝트 목록을 효과적으로 관리하고 사용자에게 멋지게 보여주기 위해 개발된 웹 애플리케이션입니다. 백엔드 API와 두 가지 프론트엔드(조회용, 관리용)로 구성됩니다.',
 'Node.js, Express, MySQL, React, Next.js, Railway, GitHub',
 '2024-06-19', NULL, -- 현재 개발 중이므로 endDate는 NULL
 'https://your-projectlist-frontend-public-url.vercel.app', -- 나중에 배포 후 실제 URL로 변경
 'https://github.com/your_github_id/projectList-backend', -- 백엔드 GitHub URL
 'https://via.placeholder.com/400x250/663399/FFFFFF?text=Project+List+App', -- 예시 이미지 URL
 '진행중'),

-- 밑으로는 데이터 확인용 추후 삭제
('온라인 쇼핑몰 프론트엔드',
 '최신 웹 기술을 활용하여 사용자 친화적인 쇼핑 경험을 제공하는 프론트엔드 애플리케이션입니다. 백엔드 API와 연동됩니다.',
 'React, Redux Toolkit, Tailwind CSS, API Integration',
 '2024-03-01', '2024-07-30',
 'https://online-shop-demo.com', 'https://github.com/your_github_id/online-shop-frontend',
 'https://via.placeholder.com/400x250/FFC107/333333?text=Online+Shop', '진행중'),

('개인 포트폴리오 웹사이트',
 '개발자로서의 저의 역량과 프로젝트 경험을 소개하는 웹사이트입니다. 반응형 디자인과 깔끔한 UI를 목표로 개발 중입니다.',
 'React, Next.js, Styled Components, Vercel',
 '2024-05-20', NULL,
 'https://my-portfolio-site.vercel.app', 'https://github.com/your_github_id/my-portfolio',
 'https://via.placeholder.com/400x250/007BFF/FFFFFF?text=Portfolio+Site', '진행중'),

('스마트 도서 관리 시스템',
 '도서 대여/반납 및 재고 관리를 위한 웹 기반 시스템입니다. 백엔드는 RESTful API로, 프론트엔드는 React로 구현되었습니다.',
 'Node.js, Express, MySQL, React, Redux',
 '2023-11-01', '2024-03-15',
 'https://book-management-demo.com', 'https://github.com/your_github_id/book-manager',
 'https://via.placeholder.com/400x250/28A745/FFFFFF?text=Book+System', '완료'),

('식당 예약 서비스 앱',
 '사용자가 편리하게 식당을 검색하고 예약할 수 있는 모바일 웹 애플리케이션입니다. 지도 API 연동 기능을 포함합니다.',
 'Spring Boot, JPA, React Native, Google Maps API',
 '2024-01-10', '2024-07-30',
 'https://restaurant-reserve.app', 'https://github.com/your_github_id/restaurant-app',
 'https://via.placeholder.com/400x250/FFC107/333333?text=Restaurant+App', '계획중');