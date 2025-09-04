FROM python:3.11-slim

WORKDIR /usr/src/app

# Instalar dependências Python
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código do backend
COPY backend/app ./app
COPY backend/migrations ./migrations
# Copiar arquivos de regras e mapeamento
COPY domain ./domain
COPY mapeamento.xlsx.yaml ./mapeamento.xlsx.yaml

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]