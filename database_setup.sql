-- PostgreSQL 데이터베이스 설정

-- 데이터베이스 생성
CREATE DATABASE insurance_db;

-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 증명서 발급 내역 테이블
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    policy_number VARCHAR(255),
    insurance_period_start DATE,
    insurance_period_end DATE,
    insurance_type VARCHAR(255),
    insured_name VARCHAR(255),
    coverage_limit VARCHAR(255),
    address TEXT,
    insurance_company VARCHAR(255),
    coverage_details TEXT,
    additional_info TEXT,
    pdf_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_created_at ON certificates(created_at);
