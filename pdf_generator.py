import weasyprint
from datetime import datetime
import os
from config import Config

class PDFGenerator:
    def __init__(self):
        self.output_folder = Config.OUTPUT_FOLDER
        if not os.path.exists(self.output_folder):
            os.makedirs(self.output_folder)
    
    def generate_certificate_html(self, certificate_data):
        """가입증명서 HTML 템플릿 생성"""
        
        html_template = f"""
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>보험가입증명서</title>
            <style>
                @page {{
                    size: A4;
                    margin: 2cm;
                }}
                
                body {{
                    font-family: 'Malgun Gothic', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }}
                
                .header {{
                    text-align: center;
                    border-bottom: 3px solid #2c3e50;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }}
                
                .header h1 {{
                    font-size: 28px;
                    color: #2c3e50;
                    margin: 0;
                    font-weight: bold;
                }}
                
                .header .subtitle {{
                    font-size: 16px;
                    color: #7f8c8d;
                    margin-top: 10px;
                }}
                
                .info-section {{
                    margin-bottom: 25px;
                }}
                
                .info-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }}
                
                .info-table th,
                .info-table td {{
                    border: 1px solid #bdc3c7;
                    padding: 12px;
                    text-align: left;
                }}
                
                .info-table th {{
                    background-color: #ecf0f1;
                    font-weight: bold;
                    width: 30%;
                }}
                
                .coverage-section {{
                    margin-top: 30px;
                }}
                
                .coverage-section h3 {{
                    color: #2c3e50;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 5px;
                    margin-bottom: 15px;
                }}
                
                .coverage-details {{
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-left: 4px solid #3498db;
                    margin-bottom: 20px;
                }}
                
                .footer {{
                    margin-top: 40px;
                    text-align: center;
                    border-top: 1px solid #bdc3c7;
                    padding-top: 20px;
                }}
                
                .issue-info {{
                    text-align: right;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #7f8c8d;
                }}
                
                .company-seal {{
                    text-align: center;
                    margin-top: 30px;
                    font-size: 18px;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>보험가입증명서</h1>
                <div class="subtitle">Insurance Coverage Certificate</div>
            </div>
            
            <div class="info-section">
                <table class="info-table">
                    <tr>
                        <th>증권번호</th>
                        <td>{certificate_data.get('policy_number', '정보 없음')}</td>
                    </tr>
                    <tr>
                        <th>피보험자명</th>
                        <td>{certificate_data.get('insured_name', '정보 없음')}</td>
                    </tr>
                    <tr>
                        <th>보험회사</th>
                        <td>{certificate_data.get('insurance_company', '정보 없음')}</td>
                    </tr>
                    <tr>
                        <th>보험종목</th>
                        <td>{certificate_data.get('insurance_type', '정보 없음')}</td>
                    </tr>
                    <tr>
                        <th>보험기간</th>
                        <td>{certificate_data.get('insurance_period_start', '정보 없음')} ~ {certificate_data.get('insurance_period_end', '정보 없음')}</td>
                    </tr>
                    <tr>
                        <th>보상한도액</th>
                        <td>{certificate_data.get('coverage_limit', '정보 없음')}</td>
                    </tr>
                    <tr>
                        <th>주소</th>
                        <td>{certificate_data.get('address', '정보 없음')}</td>
                    </tr>
                </table>
            </div>
            
            <div class="coverage-section">
                <h3>보장내용</h3>
                <div class="coverage-details">
                    {certificate_data.get('coverage_details', '보장내용 정보가 없습니다.')}
                </div>
                
                {f'''
                <h3>추가 정보</h3>
                <div class="coverage-details">
                    {certificate_data.get('additional_info', '')}
                </div>
                ''' if certificate_data.get('additional_info') else ''}
            </div>
            
            <div class="footer">
                <p>위와 같이 보험에 가입되어 있음을 증명합니다.</p>
                
                <div class="company-seal">
                    {certificate_data.get('insurance_company', '[보험회사명]')}
                </div>
            </div>
            
            <div class="issue-info">
                <p>발급일: {datetime.now().strftime('%Y년 %m월 %d일')}</p>
                <p>발급번호: CERT-{datetime.now().strftime('%Y%m%d')}-{hash(str(certificate_data)) % 10000:04d}</p>
            </div>
        </body>
        </html>
        """
        
        return html_template
    
    def generate_pdf(self, certificate_data, filename=None):
        """HTML을 PDF로 변환"""
        try:
            if not filename:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                insured_name = certificate_data.get('insured_name', 'unknown').replace(' ', '_')
                filename = f"certificate_{insured_name}_{timestamp}.pdf"
            
            html_content = self.generate_certificate_html(certificate_data)
            
            # PDF 생성
            pdf_path = os.path.join(self.output_folder, filename)
            weasyprint.HTML(string=html_content).write_pdf(pdf_path)
            
            return {
                'success': True,
                'pdf_path': pdf_path,
                'filename': filename
            }
            
        except Exception as e:
            print(f"PDF 생성 오류: {e}")
            return {
                'success': False,
                'error': str(e)
            }
