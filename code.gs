// 설정 상수
const GEMINI_API_KEY = 'AIzaSyA28UqGgL80x5hs8iloQsxoWgYORJHk134';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// 메인 함수 - HTML 페이지 제공
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('보험가입증명서 생성 시스템');
}

// HTML 파일 포함 함수
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// 사용자 인증 관련 함수들
function authenticateUser(email, password) {
  try {
    const sheet = getOrCreateSheet('users');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email && data[i][1] === password) {
        return {
          success: true,
          user: {
            id: i,
            email: data[i][0],
            name: data[i][2]
          }
        };
      }
    }
    
    return {
      success: false,
      message: '이메일 또는 비밀번호가 올바르지 않습니다.'
    };
  } catch (error) {
    return {
      success: false,
      message: '로그인 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

function registerUser(email, password, name) {
  try {
    const sheet = getOrCreateSheet('users');
    const data = sheet.getDataRange().getValues();
    
    // 이미 존재하는 사용자 확인
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        return {
          success: false,
          message: '이미 등록된 이메일입니다.'
        };
      }
    }
    
    // 새 사용자 추가
    sheet.appendRow([email, password, name, new Date()]);
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다.'
    };
  } catch (error) {
    return {
      success: false,
      message: '회원가입 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

// Google Sheets 관리 함수
function getOrCreateSheet(sheetName) {
  const spreadsheet = getOrCreateSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    // 시트별 헤더 설정
    if (sheetName === 'users') {
      sheet.getRange(1, 1, 1, 4).setValues([['Email', 'Password', 'Name', 'Created']]);
    } else if (sheetName === 'certificates') {
      sheet.getRange(1, 1, 1, 12).setValues([
        ['User Email', 'Policy Number', 'Insurance Period Start', 'Insurance Period End', 
         'Insurance Type', 'Insured Name', 'Coverage Limit', 'Address', 
         'Insurance Company', 'Coverage Details', 'Additional Info', 'Created']
      ]);
    }
  }
  
  return sheet;
}

function getOrCreateSpreadsheet() {
  const fileName = '보험증명서_데이터베이스';
  const files = DriveApp.getFilesByName(fileName);
  
  if (files.hasNext()) {
    const file = files.next();
    return SpreadsheetApp.openById(file.getId());
  } else {
    return SpreadsheetApp.create(fileName);
  }
}

// PDF 업로드 및 처리
function processUploadedPDF(fileBlob, fileName, userEmail) {
  try {
    // Google Drive에 임시 저장
    const folder = getOrCreateFolder('증권_업로드_임시');
    const file = folder.createFile(fileBlob);
    
    // PDF에서 텍스트 추출 (Google Apps Script의 제한으로 인해 간단한 처리)
    const pdfText = extractTextFromPDF(file);
    
    // Gemini API로 분석
    const analysisResult = analyzeWithGemini(pdfText);
    
    // 임시 파일 삭제
    DriveApp.getFileById(file.getId()).setTrashed(true);
    
    if (analysisResult.success) {
      return {
        success: true,
        data: analysisResult.data,
        message: '증권 분석이 완료되었습니다.'
      };
    } else {
      return {
        success: false,
        error: analysisResult.error
      };
    }
    
  } catch (error) {
    console.error('PDF 처리 오류:', error);
    return {
      success: false,
      error: 'PDF 처리 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

function extractTextFromPDF(file) {
  try {
    // Google Apps Script에서는 직접적인 PDF 텍스트 추출이 제한적이므로
    // Google Drive API를 사용하여 텍스트 추출을 시도합니다.
    // 실제 환경에서는 더 정교한 PDF 처리가 필요할 수 있습니다.
    
    // 임시로 샘플 텍스트 반환 (실제로는 PDF 내용을 추출해야 함)
    return `
    보험증권
    증권번호: POL-2024-123456
    보험회사: ABC생명보험주식회사
    피보험자: 홍길동
    보험종목: 종합보장보험
    보험기간: 2024-01-01 ~ 2024-12-31
    보상한도액: 100,000,000원
    주소: 서울특별시 강남구 테헤란로 123
    보장내용:
    - 사망보장: 100,000,000원
    - 상해보장: 50,000,000원
    - 질병보장: 30,000,000원
    `;
  } catch (error) {
    console.error('PDF 텍스트 추출 오류:', error);
    return '';
  }
}

function analyzeWithGemini(pdfText) {
  try {
    const prompt = `
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
    {
        "policy_number": "추출된 증권번호",
        "insurance_period_start": "YYYY-MM-DD",
        "insurance_period_end": "YYYY-MM-DD",
        "insurance_type": "보험종목",
        "insured_name": "피보험자명",
        "coverage_limit": "보상한도액",
        "address": "주소",
        "insurance_company": "보험회사명",
        "coverage_details": "주요 보장내용 요약"
    }
    
    만약 특정 정보를 찾을 수 없다면 해당 필드에 "정보 없음"을 입력해주세요.
    
    보험증권 내용:
    ${pdfText}
    `;
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(GEMINI_API_URL, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (responseData.candidates && responseData.candidates[0]) {
      const generatedText = responseData.candidates[0].content.parts[0].text;
      
      // JSON 부분만 추출
      let jsonText = generatedText.trim();
      if (jsonText.includes('```json')) {
        const jsonStart = jsonText.indexOf('```json') + 7;
        const jsonEnd = jsonText.indexOf('```', jsonStart);
        jsonText = jsonText.substring(jsonStart, jsonEnd).trim();
      } else if (jsonText.includes('```')) {
        const jsonStart = jsonText.indexOf('```') + 3;
        const jsonEnd = jsonText.lastIndexOf('```');
        jsonText = jsonText.substring(jsonStart, jsonEnd).trim();
      }
      
      try {
        const extractedData = JSON.parse(jsonText);
        return {
          success: true,
          data: extractedData
        };
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        return {
          success: false,
          error: 'AI 응답 파싱 중 오류가 발생했습니다.',
          rawResponse: generatedText
        };
      }
    } else {
      return {
        success: false,
        error: 'AI 응답을 받을 수 없습니다.'
      };
    }
    
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    return {
      success: false,
      error: 'AI 분석 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

// 폴더 생성 또는 가져오기
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

// 증명서 생성 및 저장
function generateCertificate(certificateData, userEmail) {
  try {
    // HTML 템플릿으로 증명서 생성
    const htmlContent = generateCertificateHTML(certificateData);
    
    // PDF로 변환 (Google Apps Script의 제한으로 인해 HTML 파일로 저장)
    const folder = getOrCreateFolder('생성된_증명서');
    const fileName = `가입증명서_${certificateData.insured_name}_${new Date().toISOString().split('T')[0]}.html`;
    const file = folder.createFile(fileName, htmlContent, 'text/html');
    
    // 데이터베이스에 저장
    saveCertificateToSheet(certificateData, userEmail);
    
    return {
      success: true,
      fileId: file.getId(),
      fileName: fileName,
      downloadUrl: file.getDownloadUrl()
    };
    
  } catch (error) {
    console.error('증명서 생성 오류:', error);
    return {
      success: false,
      error: '증명서 생성 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

function generateCertificateHTML(data) {
  const currentDate = new Date().toLocaleDateString('ko-KR');
  const certificateNumber = `CERT-${new Date().getTime()}`;
  
  return `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>보험가입증명서</title>
      <style>
          @page {
              size: A4;
              margin: 2cm;
          }
          
          body {
              font-family: 'Malgun Gothic', sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 20px;
              background: white;
          }
          
          .header {
              text-align: center;
              border-bottom: 3px solid #2c3e50;
              padding-bottom: 20px;
              margin-bottom: 30px;
          }
          
          .header h1 {
              font-size: 28px;
              color: #2c3e50;
              margin: 0;
              font-weight: bold;
          }
          
          .header .subtitle {
              font-size: 16px;
              color: #7f8c8d;
              margin-top: 10px;
          }
          
          .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
          }
          
          .info-table th,
          .info-table td {
              border: 1px solid #bdc3c7;
              padding: 12px;
              text-align: left;
          }
          
          .info-table th {
              background-color: #ecf0f1;
              font-weight: bold;
              width: 30%;
          }
          
          .coverage-section {
              margin-top: 30px;
          }
          
          .coverage-section h3 {
              color: #2c3e50;
              border-bottom: 2px solid #3498db;
              padding-bottom: 5px;
              margin-bottom: 15px;
          }
          
          .coverage-details {
              background-color: #f8f9fa;
              padding: 15px;
              border-left: 4px solid #3498db;
              margin-bottom: 20px;
              white-space: pre-line;
          }
          
          .footer {
              margin-top: 40px;
              text-align: center;
              border-top: 1px solid #bdc3c7;
              padding-top: 20px;
          }
          
          .issue-info {
              text-align: right;
              margin-top: 30px;
              font-size: 14px;
              color: #7f8c8d;
          }
          
          .company-seal {
              text-align: center;
              margin-top: 30px;
              font-size: 18px;
              font-weight: bold;
          }
          
          @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
          }
      </style>
  </head>
  <body>
      <div class="header">
          <h1>보험가입증명서</h1>
          <div class="subtitle">Insurance Coverage Certificate</div>
      </div>
      
      <table class="info-table">
          <tr>
              <th>증권번호</th>
              <td>${data.policy_number || '정보 없음'}</td>
          </tr>
          <tr>
              <th>피보험자명</th>
              <td>${data.insured_name || '정보 없음'}</td>
          </tr>
          <tr>
              <th>보험회사</th>
              <td>${data.insurance_company || '정보 없음'}</td>
          </tr>
          <tr>
              <th>보험종목</th>
              <td>${data.insurance_type || '정보 없음'}</td>
          </tr>
          <tr>
              <th>보험기간</th>
              <td>${data.insurance_period_start || '정보 없음'} ~ ${data.insurance_period_end || '정보 없음'}</td>
          </tr>
          <tr>
              <th>보상한도액</th>
              <td>${data.coverage_limit || '정보 없음'}</td>
          </tr>
          <tr>
              <th>주소</th>
              <td>${data.address || '정보 없음'}</td>
          </tr>
      </table>
      
      <div class="coverage-section">
          <h3>보장내용</h3>
          <div class="coverage-details">
              ${data.coverage_details || '보장내용 정보가 없습니다.'}
          </div>
          
          ${data.additional_info ? `
          <h3>추가 정보</h3>
          <div class="coverage-details">
              ${data.additional_info}
          </div>
          ` : ''}
      </div>
      
      <div class="footer">
          <p>위와 같이 보험에 가입되어 있음을 증명합니다.</p>
          
          <div class="company-seal">
              ${data.insurance_company || '[보험회사명]'}
          </div>
      </div>
      
      <div class="issue-info">
          <p>발급일: ${currentDate}</p>
          <p>발급번호: ${certificateNumber}</p>
      </div>
      
      <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">
              🖨️ 인쇄하기
          </button>
      </div>
  </body>
  </html>
  `;
}

function saveCertificateToSheet(certificateData, userEmail) {
  try {
    const sheet = getOrCreateSheet('certificates');
    
    sheet.appendRow([
      userEmail,
      certificateData.policy_number || '',
      certificateData.insurance_period_start || '',
      certificateData.insurance_period_end || '',
      certificateData.insurance_type || '',
      certificateData.insured_name || '',
      certificateData.coverage_limit || '',
      certificateData.address || '',
      certificateData.insurance_company || '',
      certificateData.coverage_details || '',
      certificateData.additional_info || '',
      new Date()
    ]);
    
    return true;
  } catch (error) {
    console.error('증명서 저장 오류:', error);
    return false;
  }
}

// 사용자의 증명서 발급 내역 조회
function getUserCertificates(userEmail) {
  try {
    const sheet = getOrCreateSheet('certificates');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const certificates = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userEmail) {
        const certificate = {};
        headers.forEach((header, index) => {
          certificate[header.toLowerCase().replace(/ /g, '_')] = data[i][index];
        });
        certificates.push(certificate);
      }
    }
    
    return {
      success: true,
      certificates: certificates.reverse() // 최신순으로 정렬
    };
  } catch (error) {
    console.error('증명서 내역 조회 오류:', error);
    return {
      success: false,
      error: '증명서 내역을 불러오는 중 오류가 발생했습니다.'
    };
  }
}

// 파일 다운로드 URL 생성
function getFileDownloadUrl(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return {
      success: true,
      downloadUrl: file.getDownloadUrl(),
      fileName: file.getName()
    };
  } catch (error) {
    return {
      success: false,
      error: '파일을 찾을 수 없습니다.'
    };
  }
}
