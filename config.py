import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Gemini API 설정
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # 데이터베이스 설정
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/insurance_db')
    
    # 세션 설정
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    
    # Google OAuth 설정 (선택사항)
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    
    # 파일 업로드 설정
    UPLOAD_FOLDER = 'uploads'
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # PDF 생성 설정
    OUTPUT_FOLDER = 'output'
