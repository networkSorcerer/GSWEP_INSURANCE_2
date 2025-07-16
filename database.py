import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from datetime import datetime
from config import Config

class DatabaseManager:
    def __init__(self):
        self.connection_string = Config.DATABASE_URL
    
    def get_connection(self):
        try:
            conn = psycopg2.connect(self.connection_string)
            return conn
        except Exception as e:
            print(f"데이터베이스 연결 오류: {e}")
            return None
    
    def init_tables(self):
        """데이터베이스 테이블 초기화"""
        conn = self.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            # 사용자 테이블
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # 증명서 발급 내역 테이블
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS certificates (
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
                )
            """)
            
            conn.commit()
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            print(f"테이블 생성 오류: {e}")
            return False
    
    def create_user(self, email, password_hash, name):
        """사용자 생성"""
        conn = self.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s)",
                (email, password_hash, name)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            print(f"사용자 생성 오류: {e}")
            return False
    
    def get_user_by_email(self, email):
        """이메일로 사용자 조회"""
        conn = self.get_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            cursor.close()
            conn.close()
            return dict(user) if user else None
        except Exception as e:
            print(f"사용자 조회 오류: {e}")
            return None
    
    def save_certificate(self, user_id, certificate_data):
        """증명서 정보 저장"""
        conn = self.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO certificates 
                (user_id, policy_number, insurance_period_start, insurance_period_end,
                 insurance_type, insured_name, coverage_limit, address, insurance_company,
                 coverage_details, additional_info, pdf_path)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                certificate_data.get('policy_number'),
                certificate_data.get('insurance_period_start'),
                certificate_data.get('insurance_period_end'),
                certificate_data.get('insurance_type'),
                certificate_data.get('insured_name'),
                certificate_data.get('coverage_limit'),
                certificate_data.get('address'),
                certificate_data.get('insurance_company'),
                certificate_data.get('coverage_details'),
                certificate_data.get('additional_info'),
                certificate_data.get('pdf_path')
            ))
            conn.commit()
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            print(f"증명서 저장 오류: {e}")
            return False
    
    def get_user_certificates(self, user_id):
        """사용자의 증명서 발급 내역 조회"""
        conn = self.get_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT * FROM certificates 
                WHERE user_id = %s 
                ORDER BY created_at DESC
            """, (user_id,))
            certificates = cursor.fetchall()
            cursor.close()
            conn.close()
            return [dict(cert) for cert in certificates]
        except Exception as e:
            print(f"증명서 내역 조회 오류: {e}")
            return []
