# CedarStone Bank

CedarStone Bank is a full-stack digital lending demonstration built around four trained machine-learning artifacts. It gives customers a clear loan application and repayment experience and gives bank staff an operational view of applications, risk, segments, and portfolio health.

## Stack

- React and Vite
- FastAPI and SQLAlchemy
- PostgreSQL
- scikit-learn and joblib
- Docker Compose for local orchestration

## Model files

The API expects these files in the directory configured by `MODEL_DIR`:

```text
affordable_loan_pipeline.joblib
customer_segmentation_pipeline.joblib
loan_decision_pipeline.joblib
repayment_q_learning_policy.joblib
```

Model binaries are intentionally excluded from Git. To use the files in Downloads with Docker:

```bash
export LOCAL_MODEL_DIR="/Users/ishwarchatla/Downloads/models"
docker compose up --build
```

Open `http://localhost:5173` after the services become healthy. The Docker API and Swagger documentation are exposed on `http://localhost:8001`.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | `maya@cedarstone.demo` | `Customer123!` |
| Admin | `admin@cedarstone.demo` | `Admin123!` |

The startup seed is intended for development only. Change all credentials and secrets before any deployment.

## Run without Docker

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="sqlite:///./cedarstone.db"
export MODEL_DIR="/Users/ishwarchatla/Downloads/models"
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## API documentation

With the backend running, Swagger UI is available at `http://localhost:8000/docs`.

