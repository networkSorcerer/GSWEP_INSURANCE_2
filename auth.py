import bcrypt
import streamlit as st
from database import DatabaseManager

class AuthManager:
    def __init__(self):
        self.db = DatabaseManager()
    
    def hash_password(self, password):
        """비밀번호 해시화"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password, hashed_password):
        """비밀번호 검증"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def register_user(self, email, password, name):
        """사용자 등록"""
        # 이미 존재하는 사용자인지 확인
        existing_user = self.db.get_user_by_email(email)
        if existing_user:
            return {'success': False, 'message': '이미 등록된 이메일입니다.'}
        
        # 비밀번호 해시화
        hashed_password = self.hash_password(password)
        
        # 사용자 생성
        if self.db.create_user(email, hashed_password, name):
            return {'success': True, 'message': '회원가입이 완료되었습니다.'}
        else:
            return {'success': False, 'message': '회원가입 중 오류가 발생했습니다.'}
    
    def login_user(self, email, password):
        """사용자 로그인"""
        user = self.db.get_user_by_email(email)
        
        if not user:
            return {'success': False, 'message': '존재하지 않는 사용자입니다.'}
        
        if self.verify_password(password, user['password_hash']):
            # 세션에 사용자 정보 저장
            st.session_state.user_id = user['id']
            st.session_state.user_email = user['email']
            st.session_state.user_name = user['name']
            st.session_state.logged_in = True
            
            return {'success': True, 'message': '로그인 성공', 'user': user}
        else:
            return {'success': False, 'message': '비밀번호가 올바르지 않습니다.'}
    
    def logout_user(self):
        """사용자 로그아웃"""
        for key in ['user_id', 'user_email', 'user_name', 'logged_in']:
            if key in st.session_state:
                del st.session_state[key]
    
    def is_logged_in(self):
        """로그인 상태 확인"""
        return st.session_state.get('logged_in', False)
    
    def get_current_user(self):
        """현재 로그인한 사용자 정보 반환"""
        if self.is_logged_in():
            return {
                'id': st.session_state.get('user_id'),
                'email': st.session_state.get('user_email'),
                'name': st.session_state.get('user_name')
            }
        return None
