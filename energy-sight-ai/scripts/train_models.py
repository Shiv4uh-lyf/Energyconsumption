"""
EnerSight AI — Model Training Script
Run this ONCE to train all models and save them to disk.

Usage:
  python scripts/train_models.py
  python scripts/train_models.py --skip-lstm
  python scripts/train_models.py --models xgboost,random_forest
"""

import sys
import json
import time
import argparse
import warnings
from pathlib import Path

# Add backend to path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "backend"))
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd

from ml.preprocessing import load_clean_data
from ml.features import engineer_features, ALL_FEATURES
from ml.splitting import chronological_split, split_summary
from ml.evaluation import rank_models, ModelMetrics, compute_metrics
from ml.forecasting import (
    NaiveForecaster, LinearRegressionForecaster, RandomForestForecaster,
    XGBoostForecaster, SARIMAForecaster, ProphetForecaster, LSTMForecaster,
    EnsembleForecaster, MODELS_DIR,
)

DATA_DIR = ROOT / "backend" / "data"
MODELS_DIR_OUT = ROOT / "backend" / "trained_models"
MODELS_DIR_OUT.mkdir(parents=True, exist_ok=True)


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--skip-lstm", action="store_true", help="Skip LSTM training (saves ~10 min)")
    p.add_argument("--models", type=str, default=None, help="Comma-separated model names to train")
    p.add_argument("--fast", action="store_true", help="Fast mode: reduced estimators for quick testing")
    return p.parse_args()


def main():
    args = parse_args()
    print("=" * 60)
    print("  EnerSight AI — Model Training Pipeline")
    print("=" * 60)
    
    # ── Step 1: Load & Clean Data ──
    print("\n[1/7] Loading and cleaning data...")
    try:
        df, meta = load_clean_data(DATA_DIR)
    except FileNotFoundError:
        print("  No data found. Running data generator...")
        from scripts.generate_demo_data import generate_demo_data
        generate_demo_data(output_dir=str(DATA_DIR))
        df, meta = load_clean_data(DATA_DIR)
    
    is_demo = meta.get("is_demo", True)
    print(f"  Loaded {len(df)} rows. Demo data: {is_demo}")
    if is_demo:
        print("  ⚠  Using SYNTHETIC DEMO DATA — not real-world measurements")
    
    # ── Step 2: Feature Engineering ──
    print("\n[2/7] Engineering features...")
    feat_df = engineer_features(df, drop_na=True)
    feature_cols = [c for c in ALL_FEATURES if c in feat_df.columns]
    print(f"  {len(feature_cols)} features, {len(feat_df)} samples after lag removal")
    
    # ── Step 3: Chronological Split ──
    print("\n[3/7] Chronological train/val/test split...")
    split = chronological_split(feat_df, feature_cols=feature_cols)
    summary = split_summary(split)
    print(f"  Train: {summary['train_samples']:,} | Val: {summary['val_samples']:,} | Test: {summary['test_samples']:,}")
    print(f"  Train ends: {summary['train_end']}")
    print(f"  Val ends: {summary['val_end']}")
    print(f"  Test ends: {summary['test_end']}")
    
    # ── Step 4: Determine models to train ──
    all_models_to_train = ["naive", "linear_regression", "random_forest", "xgboost", "sarima", "prophet"]
    if not args.skip_lstm:
        all_models_to_train.append("lstm")
    
    if args.models:
        all_models_to_train = [m.strip() for m in args.models.split(",")]
    
    print(f"\n[4/7] Training models: {all_models_to_train}")
    
    all_metrics: list[ModelMetrics] = []
    trained_models = {}
    
    # ── Step 5: Train each model ──
    for model_name in all_models_to_train:
        print(f"\n  ▶ Training {model_name}...")
        t_start = time.time()
        
        try:
            if model_name == "naive":
                model = NaiveForecaster()
                model.train(split.X_train, split.y_train)
            
            elif model_name == "linear_regression":
                model = LinearRegressionForecaster()
                model.train(split.X_train, split.y_train)
            
            elif model_name == "random_forest":
                n_est = 100 if args.fast else 200
                model = RandomForestForecaster(n_estimators=n_est)
                model.train(split.X_train, split.y_train)
            
            elif model_name == "xgboost":
                n_est = 100 if args.fast else 300
                model = XGBoostForecaster(n_estimators=n_est)
                model.train(split.X_train, split.y_train)
            
            elif model_name == "sarima":
                model = SARIMAForecaster()
                model.train(split.X_train, split.y_train)
            
            elif model_name == "prophet":
                model = ProphetForecaster()
                # Prophet needs timestamps — pass them from training slice
                ts_train = feat_df["timestamp"].iloc[:len(split.X_train)].reset_index(drop=True)
                model.train(split.X_train, split.y_train, timestamps=ts_train)
            
            elif model_name == "lstm":
                epochs = 10 if args.fast else 30
                model = LSTMForecaster(epochs=epochs)
                model.train(split.X_train, split.y_train)
            
            else:
                print(f"  ⚠ Unknown model: {model_name}, skipping")
                continue
            
            # Evaluate on test set
            import time as _time
            t0 = _time.perf_counter()
            
            if model_name == "prophet":
                ts_test = feat_df["timestamp"].iloc[len(split.X_train) + len(split.X_val):].reset_index(drop=True)
                X_test_prophet = split.X_test.copy()
                X_test_prophet["timestamp"] = ts_test.values
                preds = model.predict(X_test_prophet)
            else:
                preds = model.predict(split.X_test)
            
            inf_ms = (_time.perf_counter() - t0) * 1000
            
            metrics = compute_metrics(
                model_name=model_name,
                y_true=split.y_test.values,
                y_pred=preds,
                train_time_s=getattr(model, "_train_time", 0),
                inference_time_ms=inf_ms,
                n_train=len(split.X_train),
            )
            
            print(f"    MAE={metrics.mae:.4f}  RMSE={metrics.rmse:.4f}  "
                  f"MAPE={metrics.mape or 'N/A'}%  R²={metrics.r2:.4f}  "
                  f"Train={metrics.train_time_s:.1f}s")
            
            all_metrics.append(metrics)
            trained_models[model_name] = model
            
            # Save model
            save_path = MODELS_DIR_OUT / f"{model_name}.joblib"
            import joblib
            joblib.dump(model, save_path)
            print(f"    ✓ Saved → {save_path}")
        
        except Exception as e:
            print(f"    ✗ FAILED: {e}")
            import traceback
            traceback.print_exc()
    
    # ── Step 6: Build Ensemble ──
    if len(trained_models) >= 2 and "ensemble" not in (args.models or ""):
        print("\n  ▶ Building Weighted Ensemble...")
        
        # Weight by inverse-MAE on validation set
        val_metrics = []
        for name, model in trained_models.items():
            if name in ["naive"]:
                continue
            try:
                if name == "prophet":
                    ts_val = feat_df["timestamp"].iloc[len(split.X_train):len(split.X_train)+len(split.X_val)].reset_index(drop=True)
                    X_val_p = split.X_val.copy()
                    X_val_p["timestamp"] = ts_val.values
                    val_preds = model.predict(X_val_p)
                else:
                    val_preds = model.predict(split.X_val)
                
                from ml.evaluation import mean_absolute_error
                val_mae = mean_absolute_error(split.y_val.values, val_preds)
                val_metrics.append((name, val_mae))
            except Exception as e:
                print(f"    ⚠ Val eval failed for {name}: {e}")
        
        if val_metrics:
            # Inverse MAE weights (lower MAE = higher weight)
            weights = [1.0 / (mae + 1e-8) for _, mae in val_metrics]
            models_for_ensemble = [trained_models[n] for n, _ in val_metrics]
            
            ensemble = EnsembleForecaster()
            ensemble.set_models_and_weights(models_for_ensemble, weights)
            ensemble._n_train = len(split.X_train)
            
            # Evaluate ensemble
            ens_preds = ensemble.predict(split.X_test)
            import time as _time
            t0 = _time.perf_counter()
            ens_preds = ensemble.predict(split.X_test)
            inf_ms = (_time.perf_counter() - t0) * 1000
            
            ens_metrics = compute_metrics(
                "ensemble", split.y_test.values, ens_preds,
                train_time_s=0.0, inference_time_ms=inf_ms, n_train=len(split.X_train),
            )
            print(f"    MAE={ens_metrics.mae:.4f}  RMSE={ens_metrics.rmse:.4f}  R²={ens_metrics.r2:.4f}")
            all_metrics.append(ens_metrics)
            
            import joblib
            joblib.dump(ensemble, MODELS_DIR_OUT / "ensemble.joblib")
            print(f"    ✓ Saved ensemble")
            
            used = [n for n, _ in val_metrics]
            wt_display = dict(zip(used, [round(w / sum(weights), 3) for w in weights]))
            print(f"    Weights: {wt_display}")
    
    # ── Step 7: Save Metrics ──
    print("\n[5/7] Ranking models...")
    ranked = rank_models(all_metrics)
    print("\n  Final Rankings (by MAE):")
    print(f"  {'Rank':<5} {'Model':<22} {'MAE':<10} {'RMSE':<10} {'MAPE':<10} {'R²':<8}")
    print("  " + "-" * 65)
    for i, m in enumerate(ranked):
        mape_str = f"{m.mape:.2f}%" if m.mape is not None else "N/A"
        print(f"  {i+1:<5} {m.model_name:<22} {m.mae:<10.4f} {m.rmse:<10.4f} {mape_str:<10} {m.r2:<8.4f}")
    
    metrics_data = [m.to_dict() for m in all_metrics]
    with open(MODELS_DIR_OUT / "metrics.json", "w") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"\n  ✓ Metrics saved → {MODELS_DIR_OUT / 'metrics.json'}")
    
    # Save split info
    split_info = {
        **split_summary(split),
        "feature_cols": feature_cols,
        "is_demo": is_demo,
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    with open(MODELS_DIR_OUT / "training_info.json", "w") as f:
        json.dump(split_info, f, indent=2)
    
    print("\n" + "=" * 60)
    print(f"  Training complete! {len(all_metrics)} models trained.")
    print(f"  Best model: {ranked[0].model_name} (MAE={ranked[0].mae:.4f})")
    print("  Start the API: cd backend && uvicorn app.main:app --reload")
    print("=" * 60)


if __name__ == "__main__":
    main()
