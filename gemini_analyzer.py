import google.generativeai as genai
import pdfplumber
import fitz  as PyMuPDF
import json
from config import Config

class GeminiAnalyzer:
    def __init__(self):
        genai.configure(api_key=Config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('models/gemini-1.5-pro')
    
    def extract_text_from_pdf(self, pdf_file):
        """PDF에서 텍스트 추출"""
        text_content = ""
        
        try:
            # pdfplumber를 사용한 텍스트 추출
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n"
            
            # 텍스트가 충분하지 않으면 PyMuPDF 시도
            if len(text_content.strip()) < 100:
                doc = PyMuPDF.open(pdf_file)
                text_content = ""
                for page_num in range(doc.page_count):
                    page = doc[page_num]
                    text_content += page.get_text() + "\n"
                doc.close()
            
            return text_content
            
        except Exception as e:
            print(f"PDF 텍스트 추출 오류: {e}")
            return ""
    
    def analyze_insurance_document(self, pdf_text):
        """Gemini API를 사용하여 보험증권 분석"""
        
        prompt = f"""
        다음은 보험증권 문서의 내용입니다. 이 문서에서 다음 정보를 정확히 추출해주세요.
        
        추출할 정보:
        1. 증권번호 (Policy Number)
        2. 보험기간 시작일 (Insurance Period Start Date) - YYYY-MM-DD 형식
        3. 보험기간 종료일 (Insurance Period End Date) - YYYY-MM-DD 형식
        4. 보험종목 (Insurance Type)
        5. 피보험자 이름 (Insured Name)
        6. 보상한도액 (Coverage Limit)
        7. 주소 (Address)
        8. 보험회사 (Insurance Company)
        9. 주요 보장내용 (Coverage Details) - 요약 형태로
        
        응답은 반드시 다음 JSON 형식으로만 제공해주세요:
        {{
            "policy_number": "추출된 증권번호",
            "insurance_period_start": "YYYY-MM-DD",
            "insurance_period_end": "YYYY-MM-DD",
            "insurance_type": "보험종목",
            "insured_name": "피보험자명",
            "coverage_limit": "보상한도액",
            "address": "주소",
            "insurance_company": "보험회사명",
            "coverage_details": "주요 보장내용 요약"
        }}
        
        만약 특정 정보를 찾을 수 없다면 해당 필드에 "정보 없음"을 입력해주세요.
        
        보험증권 내용:
        {pdf_text}
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            # JSON 응답 파싱
            response_text = response.text.strip()
            
            # JSON 부분만 추출 (```json 태그가 있는 경우 처리)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.rfind("```")
                response_text = response_text[json_start:json_end].strip()
            
            # JSON 파싱
            extracted_data = json.loads(response_text)
            
            return {
                'success': True,
                'data': extracted_data
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 오류: {e}")
            print(f"응답 텍스트: {response.text}")
            return {
                'success': False,
                'error': f'JSON 파싱 오류: {str(e)}',
                'raw_response': response.text
            }
        except Exception as e:
            print(f"Gemini API 호출 오류: {e}")
            return {
                'success': False,
                'error': f'API 호출 오류: {str(e)}'
            }
    
    def process_insurance_pdf(self, pdf_file):
        """PDF 파일 전체 처리 프로세스"""
        # 1. PDF에서 텍스트 추출
        pdf_text = self.extract_text_from_pdf(pdf_file)
        
        if not pdf_text.strip():
            return {
                'success': False,
                'error': 'PDF에서 텍스트를 추출할 수 없습니다.'
            }
        
        # 2. Gemini API로 정보 분석
        analysis_result = self.analyze_insurance_document(pdf_text)
        
        return analysis_result
