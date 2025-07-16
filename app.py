import streamlit as st
import os
from datetime import datetime
import tempfile

# 커스텀 모듈 import
from auth import AuthManager
from database import DatabaseManager
from gemini_analyzer import GeminiAnalyzer
from pdf_generator import PDFGenerator
from config import Config

# 페이지 설정
st.set_page_config(
    page_title="보험가입증명서 생성 시스템",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS 스타일
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .info-card {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #007bff;
        margin: 1rem 0;
    }
    
    .success-message {
        background: #d4edda;
        color: #155724;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #c3e6cb;
    }
    
    .error-message {
        background: #f8d7da;
        color: #721c24;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #f5c6cb;
    }
</style>
""", unsafe_allow_html=True)

# 전역 객체 초기화
@st.cache_resource
def init_managers():
    auth_manager = AuthManager()
    db_manager = DatabaseManager()
    gemini_analyzer = GeminiAnalyzer()
    pdf_generator = PDFGenerator()
    
    # 데이터베이스 테이블 초기화
    db_manager.init_tables()
    
    return auth_manager, db_manager, gemini_analyzer, pdf_generator

auth_manager, db_manager, gemini_analyzer, pdf_generator = init_managers()

def show_login_page():
    """로그인 페이지"""
    st.markdown('<div class="main-header"><h1>🛡️ 보험가입증명서 생성 시스템</h1></div>', unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["로그인", "회원가입"])
    
    with tab1:
        st.subheader("로그인")
        
        with st.form("login_form"):
            email = st.text_input("이메일", placeholder="example@email.com")
            password = st.text_input("비밀번호", type="password")
            submit_button = st.form_submit_button("로그인")
            
            if submit_button:
                if email and password:
                    result = auth_manager.login_user(email, password)
                    if result['success']:
                        st.success(result['message'])
                        st.rerun()
                    else:
                        st.error(result['message'])
                else:
                    st.error("이메일과 비밀번호를 입력해주세요.")
    
    with tab2:
        st.subheader("회원가입")
        
        with st.form("register_form"):
            name = st.text_input("이름")
            email = st.text_input("이메일", placeholder="example@email.com")
            password = st.text_input("비밀번호", type="password")
            password_confirm = st.text_input("비밀번호 확인", type="password")
            submit_button = st.form_submit_button("회원가입")
            
            if submit_button:
                if name and email and password and password_confirm:
                    if password == password_confirm:
                        result = auth_manager.register_user(email, password, name)
                        if result['success']:
                            st.success(result['message'])
                        else:
                            st.error(result['message'])
                    else:
                        st.error("비밀번호가 일치하지 않습니다.")
                else:
                    st.error("모든 필드를 입력해주세요.")

def show_upload_page():
    """증권 업로드 페이지"""
    st.header("📄 보험증권 업로드")
    
    uploaded_file = st.file_uploader(
        "보험증권 PDF 파일을 업로드하세요",
        type=['pdf'],
        help="PDF 형식의 보험증권 파일만 업로드 가능합니다."
    )
    
    if uploaded_file is not None:
        st.success(f"파일 업로드 완료: {uploaded_file.name}")
        
        if st.button("증권 분석 시작", type="primary"):
            with st.spinner("Gemini AI가 증권을 분석하고 있습니다..."):
                # 임시 파일로 저장
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                    tmp_file.write(uploaded_file.getvalue())
                    tmp_file_path = tmp_file.name
                
                try:
                    # Gemini API로 분석
                    result = gemini_analyzer.process_insurance_pdf(tmp_file_path)
                    
                    if result['success']:
                        st.session_state.extracted_data = result['data']
                        st.session_state.current_step = 'edit'
                        st.success("증권 분석이 완료되었습니다!")
                        st.rerun()
                    else:
                        st.error(f"분석 중 오류가 발생했습니다: {result['error']}")
                        if 'raw_response' in result:
                            st.text_area("원본 응답", result['raw_response'], height=200)
                
                finally:
                    # 임시 파일 삭제
                    os.unlink(tmp_file_path)

def show_edit_page():
    """정보 편집 페이지"""
    st.header("✏️ 증권 정보 편집")
    
    if 'extracted_data' not in st.session_state:
        st.error("추출된 데이터가 없습니다. 먼저 증권을 업로드해주세요.")
        return
    
    data = st.session_state.extracted_data
    
    st.subheader("기본 정보")
    
    col1, col2 = st.columns(2)
    
    with col1:
        policy_number = st.text_input("증권번호", value=data.get('policy_number', ''))
        insured_name = st.text_input("피보험자명", value=data.get('insured_name', ''))
        insurance_company = st.text_input("보험회사", value=data.get('insurance_company', ''))
        insurance_type = st.text_input("보험종목", value=data.get('insurance_type', ''))
    
    with col2:
        insurance_period_start = st.date_input(
            "보험기간 시작일",
            value=datetime.strptime(data.get('insurance_period_start', '2024-01-01'), '%Y-%m-%d').date() if data.get('insurance_period_start') != '정보 없음' else datetime.now().date()
        )
        insurance_period_end = st.date_input(
            "보험기간 종료일",
            value=datetime.strptime(data.get('insurance_period_end', '2024-12-31'), '%Y-%m-%d').date() if data.get('insurance_period_end') != '정보 없음' else datetime.now().date()
        )
        coverage_limit = st.text_input("보상한도액", value=data.get('coverage_limit', ''))
        address = st.text_area("주소", value=data.get('address', ''), height=100)
    
    st.subheader("보장내용")
    coverage_details = st.text_area(
        "주요 보장내용",
        value=data.get('coverage_details', ''),
        height=150,
        help="Gemini AI가 추출한 보장내용을 확인하고 필요시 수정하세요."
    )
    
    st.subheader("추가 정보")
    additional_info = st.text_area(
        "추가 입력사항",
        placeholder="특약사항, 면책조항, 기타 중요 정보를 입력하세요.",
        height=100
    )
    
    # 편집된 데이터 저장
    edited_data = {
        'policy_number': policy_number,
        'insured_name': insured_name,
        'insurance_company': insurance_company,
        'insurance_type': insurance_type,
        'insurance_period_start': insurance_period_start.strftime('%Y-%m-%d'),
        'insurance_period_end': insurance_period_end.strftime('%Y-%m-%d'),
        'coverage_limit': coverage_limit,
        'address': address,
        'coverage_details': coverage_details,
        'additional_info': additional_info
    }
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("미리보기 생성", type="primary"):
            st.session_state.certificate_data = edited_data
            st.session_state.current_step = 'preview'
            st.rerun()
    
    with col2:
        if st.button("이전 단계로"):
            st.session_state.current_step = 'upload'
            st.rerun()

def show_preview_page():
    """미리보기 페이지"""
    st.header("📋 가입증명서 미리보기")
    
    if 'certificate_data' not in st.session_state:
        st.error("증명서 데이터가 없습니다.")
        return
    
    data = st.session_state.certificate_data
    
    # 미리보기 HTML 생성
    preview_html = f"""
    <div style="border: 2px solid #007bff; padding: 2rem; border-radius: 10px; background: white;">
        <h2 style="text-align: center; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 1rem;">
            보험가입증명서
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
            <tr>
                <td style="border: 1px solid #ddd; padding: 0.5rem; background: #f8f9fa; font-weight: bold; width: 30%;">증권번호</td>
                <td style="border: 1px solid #ddd; padding: 0.5rem;">{data.get('policy_number', '정보 없음')}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 0.5rem; background: #f8f9fa; font-weight: bold;">피보험자명</td>
                <td style="border: 1px solid #ddd; padding: 0.5rem;">{data.get('insured_name', '정보 없음')}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 0.5rem; background: #f8f9fa; font-weight: bold;">보험회사</td>
                <td style="border: 1px solid #ddd; padding: 0.5rem;">{data.get('insurance_company', '정보 없음')}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 0.5rem; background: #f8f9fa; font-weight: bold;">보험종목</td>
                <td style="border: 1px solid #ddd; padding: 0.5rem;">{data.get('insurance_type', '정보 없음')}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 0.5rem; background: #f8f9fa; font-weight: bold;">보험기간</td>
                <td style="border: 1px solid #ddd; padding: 0.5rem;">{data.get('insurance_period_start')} ~ {data.get('insurance_period_end')}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 0.5rem; background: #f8f9fa; font-weight: bold;">보상한도액</td>
                <td style="border: 1px solid #ddd; padding: 0.5rem;">{data.get('coverage_limit', '정보 없음')}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 0.5rem; background: #f8f9fa; font-weight: bold;">주소</td>
                <td style="border: 1px solid #ddd; padding: 0.5rem;">{data.get('address', '정보 없음')}</td>
            </tr>
        </table>
        
        <h3 style="color: #2c3e50; border-bottom: 1px solid #3498db; padding-bottom: 0.5rem;">보장내용</h3>
        <div style="background: #f8f9fa; padding: 1rem; border-left: 4px solid #3498db; margin: 1rem 0;">
            {data.get('coverage_details', '보장내용 정보가 없습니다.')}
        </div>
        
        {f'''
        <h3 style="color: #2c3e50; border-bottom: 1px solid #3498db; padding-bottom: 0.5rem;">추가 정보</h3>
        <div style="background: #f8f9fa; padding: 1rem; border-left: 4px solid #3498db; margin: 1rem 0;">
            {data.get('additional_info')}
        </div>
        ''' if data.get('additional_info') else ''}
        
        <div style="text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd;">
            <p>위와 같이 보험에 가입되어 있음을 증명합니다.</p>
            <p style="font-size: 1.2rem; font-weight: bold; margin-top: 1rem;">{data.get('insurance_company', '[보험회사명]')}</p>
        </div>
        
        <div style="text-align: right; margin-top: 2rem; font-size: 0.9rem; color: #666;">
            <p>발급일: {datetime.now().strftime('%Y년 %m월 %d일')}</p>
        </div>
    </div>
    """
    
    st.markdown(preview_html, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("수정하기"):
            st.session_state.current_step = 'edit'
            st.rerun()
    
    with col2:
        if st.button("PDF 생성 및 다운로드", type="primary"):
            with st.spinner("PDF를 생성하고 있습니다..."):
                result = pdf_generator.generate_pdf(data)
                
                if result['success']:
                    # 데이터베이스에 저장
                    user = auth_manager.get_current_user()
                    if user:
                        save_data = data.copy()
                        save_data['pdf_path'] = result['pdf_path']
                        db_manager.save_certificate(user['id'], save_data)
                    
                    # PDF 파일 다운로드 제공
                    with open(result['pdf_path'], 'rb') as pdf_file:
                        st.download_button(
                            label="📥 PDF 다운로드",
                            data=pdf_file.read(),
                            file_name=result['filename'],
                            mime='application/pdf'
                        )
                    
                    st.success("PDF가 성공적으로 생성되었습니다!")
                else:
                    st.error(f"PDF 생성 중 오류가 발생했습니다: {result['error']}")
    
    with col3:
        if st.button("발급 내역 보기"):
            st.session_state.current_step = 'history'
            st.rerun()

def show_history_page():
    """발급 내역 페이지"""
    st.header("📂 발급 내역")
    
    user = auth_manager.get_current_user()
    if not user:
        st.error("로그인이 필요합니다.")
        return
    
    certificates = db_manager.get_user_certificates(user['id'])
    
    if not certificates:
        st.info("발급된 증명서가 없습니다.")
        return
    
    for i, cert in enumerate(certificates):
        with st.expander(f"증명서 #{i+1} - {cert['insured_name']} ({cert['created_at'].strftime('%Y-%m-%d %H:%M')})"):
            col1, col2 = st.columns(2)
            
            with col1:
                st.write(f"**증권번호:** {cert['policy_number']}")
                st.write(f"**피보험자명:** {cert['insured_name']}")
                st.write(f"**보험회사:** {cert['insurance_company']}")
                st.write(f"**보험종목:** {cert['insurance_type']}")
            
            with col2:
                st.write(f"**보험기간:** {cert['insurance_period_start']} ~ {cert['insurance_period_end']}")
                st.write(f"**보상한도액:** {cert['coverage_limit']}")
                st.write(f"**발급일:** {cert['created_at'].strftime('%Y-%m-%d %H:%M')}")
            
            if cert['pdf_path'] and os.path.exists(cert['pdf_path']):
                with open(cert['pdf_path'], 'rb') as pdf_file:
                    st.download_button(
                        label="📥 PDF 다운로드",
                        data=pdf_file.read(),
                        file_name=f"certificate_{cert['insured_name']}_{cert['created_at'].strftime('%Y%m%d')}.pdf",
                        mime='application/pdf',
                        key=f"download_{cert['id']}"
                    )

def main():
    """메인 애플리케이션"""
    
    # 세션 상태 초기화
    if 'current_step' not in st.session_state:
        st.session_state.current_step = 'upload'
    
    # 로그인 확인
    if not auth_manager.is_logged_in():
        show_login_page()
        return
    
    # 사이드바
    with st.sidebar:
        user = auth_manager.get_current_user()
        st.write(f"👤 **{user['name']}님 환영합니다!**")
        st.write(f"📧 {user['email']}")
        
        st.divider()
        
        # 네비게이션
        if st.button("📄 증권 업로드", use_container_width=True):
            st.session_state.current_step = 'upload'
            st.rerun()
        
        if st.button("✏️ 정보 편집", use_container_width=True, disabled='extracted_data' not in st.session_state):
            st.session_state.current_step = 'edit'
            st.rerun()
        
        if st.button("📋 미리보기", use_container_width=True, disabled='certificate_data' not in st.session_state):
            st.session_state.current_step = 'preview'
            st.rerun()
        
        if st.button("📂 발급 내역", use_container_width=True):
            st.session_state.current_step = 'history'
            st.rerun()
        
        st.divider()
        
        if st.button("🚪 로그아웃", use_container_width=True):
            auth_manager.logout_user()
            st.rerun()
    
    # 메인 컨텐츠
    if st.session_state.current_step == 'upload':
        show_upload_page()
    elif st.session_state.current_step == 'edit':
        show_edit_page()
    elif st.session_state.current_step == 'preview':
        show_preview_page()
    elif st.session_state.current_step == 'history':
        show_history_page()

if __name__ == "__main__":
    main()
