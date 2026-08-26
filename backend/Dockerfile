FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir pydantic-settings "psycopg[binary]>=3.2.10" httpx openpyxl

# Sin esto, los print() de Python quedan en buffer y no aparecen en
# tiempo real en `docker logs` — imprescindible para poder diagnosticar.
# (Va DESPUÉS de las capas pesadas de arriba para no invalidar su caché.)
ENV PYTHONUNBUFFERED=1

COPY . .

RUN mkdir -p uploads/documentos uploads/firmas && \
    chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["sh", "/app/entrypoint.sh"]
