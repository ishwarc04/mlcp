from functools import lru_cache
from pathlib import Path
from threading import Lock

import joblib
import numpy as np
import pandas as pd

from app.core.config import settings


CLASSIFICATION_FEATURES = [
    "age", "monthly_income", "employment_years", "credit_score", "existing_loan_count",
    "existing_emi", "debt_to_income_ratio", "credit_utilization_ratio", "savings_balance",
    "checking_balance", "late_payments_2y", "defaults_5y", "credit_history_years",
    "requested_loan_amount", "loan_term_months", "interest_rate", "dependents",
    "residence_years", "education_level", "employment_type",
]

REGRESSION_FEATURES = [
    "age", "monthly_income", "monthly_expenses", "existing_emi", "debt_to_income_ratio",
    "credit_score", "employment_years", "savings_balance", "checking_balance",
    "credit_history_years", "late_payments_2y", "existing_loan_count",
    "requested_loan_amount", "loan_term_months", "interest_rate", "dependents",
    "residence_years", "property_ownership", "employment_type", "education_level",
]

SEGMENT_FEATURES = [
    "monthly_income", "monthly_expenses", "savings_balance", "credit_score",
    "debt_to_income_ratio", "credit_utilization_ratio", "existing_loan_count", "existing_emi",
    "late_payments_2y", "defaults_5y", "credit_history_years", "average_monthly_balance",
    "transaction_count_monthly", "digital_payment_ratio", "investment_balance",
    "emergency_fund_months", "loan_frequency_5y", "repayment_consistency",
    "income_stability_score", "financial_literacy_score",
]


class MLService:
    filenames = {
        "classification": "loan_decision_pipeline.joblib",
        "regression": "affordable_loan_pipeline.joblib",
        "segmentation": "customer_segmentation_pipeline.joblib",
        "repayment": "repayment_q_learning_policy.joblib",
    }

    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.models: dict[str, object] = {}
        self.errors: dict[str, str] = {}
        self._lock = Lock()

    def load(self, name: str):
        if name in self.models:
            return self.models[name]
        with self._lock:
            if name in self.models:
                return self.models[name]
            path = self.model_dir / self.filenames[name]
            try:
                self.models[name] = joblib.load(path)
                self.errors.pop(name, None)
                return self.models[name]
            except Exception as exc:
                self.errors[name] = f"{type(exc).__name__}: {exc}"
                return None

    def status(self, load: bool = False) -> dict[str, bool]:
        if load:
            for name in self.filenames:
                self.load(name)
        return {
            name: name in self.models or (self.model_dir / filename).is_file()
            for name, filename in self.filenames.items()
        }

    def assess_loan(self, payload: dict) -> dict:
        classifier = self.load("classification")
        regressor = self.load("regression")
        if classifier is None or regressor is None:
            missing = [name for name, model in (("classification", classifier), ("regression", regressor)) if model is None]
            raise RuntimeError(f"Required model unavailable: {', '.join(missing)}")

        class_frame = pd.DataFrame([{key: payload[key] for key in CLASSIFICATION_FEATURES}])
        reg_frame = pd.DataFrame([{key: payload[key] for key in REGRESSION_FEATURES}])
        decision = str(classifier.predict(class_frame)[0])
        probabilities = classifier.predict_proba(class_frame)[0]
        class_names = [str(value) for value in classifier.classes_]
        probability_map = {name: float(value) for name, value in zip(class_names, probabilities)}
        confidence = probability_map.get(decision, float(np.max(probabilities)))
        affordable_amount = max(0.0, float(regressor.predict(reg_frame)[0]))

        risk_band = {"Approved": "Low", "Manual Review": "Moderate", "Rejected": "High"}.get(decision, "Moderate")
        reasons = self._reasons(payload, decision, affordable_amount)
        return {
            "decision": decision,
            "confidence": confidence,
            "affordable_amount": affordable_amount,
            "risk_band": risk_band,
            "probabilities": probability_map,
            "reasons": reasons,
        }

    def segment(self, payload: dict) -> dict:
        artifact = self.load("segmentation")
        if artifact is None:
            raise RuntimeError("Segmentation model unavailable")
        frame = pd.DataFrame([{key: payload[key] for key in SEGMENT_FEATURES}])
        pipeline = artifact["pipeline"] if isinstance(artifact, dict) else artifact
        cluster = int(pipeline.predict(frame)[0])
        name_map = artifact.get("cluster_name_map", {}) if isinstance(artifact, dict) else {}
        segment_name = str(name_map.get(cluster, name_map.get(str(cluster), f"Segment {cluster}")))
        return {"cluster": cluster, "segment": segment_name}

    def repayment_action(self, payload: dict) -> dict:
        artifact = self.load("repayment")
        if artifact is None:
            raise RuntimeError("Repayment policy unavailable")

        missed_band = 0 if payload["missed_payments"] == 0 else (1 if payload["missed_payments"] <= 2 else 2)
        state = (
            int(payload["risk_level"]),
            missed_band,
            int(payload["days_past_due"] > 60),
            int(payload["payment_history_score"] < 70),
            int(payload["hardship_score"] >= 0.65),
            int(payload["partial_payment_capacity"] < 0.30),
            int(payload["days_to_next_salary"] <= 7),
            int(payload["available_balance"] < payload["monthly_emi"]),
        )
        state_to_id = artifact["state_to_id"]
        state_id = state_to_id.get(state)
        if state_id is None:
            return {"action": "Human Review", "confidence": 0.0, "known_state": False}
        q_values = np.asarray(artifact["q_table"])[state_id]
        action_id = int(np.argmax(q_values))
        action = str(artifact["action_names"][action_id])
        spread = float(q_values[action_id] - np.partition(q_values, -2)[-2]) if len(q_values) > 1 else float(q_values[action_id])
        confidence = float(1 / (1 + np.exp(-spread)))
        return {"action": action, "confidence": confidence, "known_state": True}

    @staticmethod
    def _reasons(payload: dict, decision: str, affordable_amount: float) -> list[str]:
        reasons = []
        if payload["credit_score"] >= 720:
            reasons.append("Strong credit history supports the assessment")
        elif payload["credit_score"] < 620:
            reasons.append("Credit score is below the preferred range")
        if payload["debt_to_income_ratio"] > 0.50:
            reasons.append("Existing debt uses a high share of monthly income")
        if payload["late_payments_2y"] > 1:
            reasons.append("Recent late payments increased repayment risk")
        if affordable_amount < payload["requested_loan_amount"] * 0.85:
            reasons.append("A lower amount better matches the current affordability profile")
        if not reasons:
            reasons.append(f"The combined affordability and risk profile supports {decision.lower()}")
        return reasons[:3]


@lru_cache
def get_ml_service() -> MLService:
    return MLService(settings.model_dir)

