#!/bin/bash

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 필요한 디렉토리 생성
mkdir -p uploads output

# Streamlit 앱 실행
streamlit run app.py --server.port 8501 --server.address 0.0.0.0
