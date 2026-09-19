"""
EnerSight AI — Explainability Module
SHAP-based feature importance for tree models + linear models.
"""

import warnings
import numpy as np
import pandas as pd
from typing import Optional

warnings.filterwarnings("ignore")


def get_feature_importance(model, feature_names: list[str]) -> list[dict]:
    """
    Get feature importances for models that support it (RF, XGBoost).
    Returns sorted list of {feature, importance, rank}.
    """
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        if hasattr(model, "model") and hasattr(model.model, "feature_importances_"):
            importances = model.model.feature_importances_
    elif hasattr(model, "model") and hasattr(model.model, "feature_importances_"):
        importances = model.model.feature_importances_
    else:
        return []
    
    # For Pipeline models (LR has scaler + ridge)
    if hasattr(model, "model") and hasattr(model.model, "named_steps"):
        try:
            coefs = model.model.named_steps["ridge"].coef_
            importances = np.abs(coefs)
        except Exception:
            pass
    
    pairs = sorted(
        zip(feature_names, importances),
        key=lambda x: x[1],
        reverse=True,
    )
    
    return [
        {
            "feature": feat,
            "importance": round(float(imp), 6),
            "importance_pct": round(float(imp / (sum(i for _, i in pairs) + 1e-8) * 100), 2),
            "rank": rank + 1,
        }
        for rank, (feat, imp) in enumerate(pairs)
    ]


def get_shap_values(
    model,
    X_sample: pd.DataFrame,
    feature_names: list[str],
    max_samples: int = 200,
) -> Optional[list[dict]]:
    """
    Compute SHAP values for tree-based and linear models.
    Returns per-feature mean absolute SHAP contribution.
    """
    try:
        import shap
    except ImportError:
        return None
    
    X = X_sample.fillna(0).head(max_samples)
    
    try:
        # Determine underlying estimator
        estimator = model
        if hasattr(model, "model"):
            estimator = model.model
        
        # Handle Pipeline
        if hasattr(estimator, "named_steps"):
            inner = estimator.named_steps.get("ridge") or list(estimator.named_steps.values())[-1]
            X_transformed = estimator[:-1].transform(X.values)
            explainer = shap.LinearExplainer(inner, X_transformed)
            shap_vals = explainer.shap_values(X_transformed)
        elif hasattr(estimator, "get_booster"):
            # XGBoost
            explainer = shap.TreeExplainer(estimator)
            shap_vals = explainer.shap_values(X.values)
        elif hasattr(estimator, "estimators_"):
            # Random Forest
            explainer = shap.TreeExplainer(estimator)
            shap_vals = explainer.shap_values(X.values)
        else:
            return None
        
        mean_abs_shap = np.abs(shap_vals).mean(axis=0)
        total = mean_abs_shap.sum() + 1e-8
        
        pairs = sorted(
            zip(feature_names, mean_abs_shap),
            key=lambda x: x[1],
            reverse=True,
        )
        
        return [
            {
                "feature": feat,
                "mean_abs_shap": round(float(val), 6),
                "contribution_pct": round(float(val / total * 100), 2),
                "rank": rank + 1,
                "description": _feature_description(feat),
            }
            for rank, (feat, val) in enumerate(pairs[:20])  # top 20
        ]
    
    except Exception as e:
        print(f"[SHAP] Error computing SHAP values: {e}")
        return None


def _feature_description(feat: str) -> str:
    """Human-readable description of predictive influence."""
    desc_map = {
        "lag_168": "Same hour last week — strong weekly periodicity signal",
        "lag_24": "Same hour yesterday — dominant daily pattern",
        "lag_1": "One hour ago — short-term autocorrelation",
        "rolling_mean_24": "24h rolling average — recent consumption baseline",
        "rolling_mean_168": "Weekly rolling average — seasonal baseline",
        "hour": "Hour of day — captures within-day usage cycle",
        "hour_sin": "Cyclical hour encoding — smooth circular time representation",
        "hour_cos": "Cyclical hour encoding — smooth circular time representation",
        "is_weekend": "Weekend flag — typically lower consumption on weekends",
        "day_of_week": "Day of week — weekly demand pattern",
        "month": "Month — annual seasonality signal",
        "is_evening_peak": "Evening peak period flag (17:00–21:00)",
        "rolling_std_24": "24h consumption variability — volatility signal",
    }
    return desc_map.get(feat, f"Predictive feature: {feat}")


def build_explainability_report(
    model,
    X_test: pd.DataFrame,
    feature_names: list[str],
) -> dict:
    """Build complete explainability report for a model."""
    report = {
        "model_name": getattr(model, "name", "unknown"),
        "feature_importance": [],
        "shap_values": None,
        "note": "Importances represent predictive influence, not causation.",
    }
    
    fi = get_feature_importance(model, feature_names)
    if fi:
        report["feature_importance"] = fi
    
    shap_vals = get_shap_values(model, X_test, feature_names)
    if shap_vals:
        report["shap_values"] = shap_vals
    
    return report
