"""
EnerSight AI — UCI Dataset Downloader
Attempts to download the UCI Household Electric Power Consumption dataset.
Falls back to synthetic demo data if download fails.
"""

import sys
import os
import zipfile
import requests
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).parent.parent / "backend" / "data"

# UCI dataset URL (direct download)
UCI_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00235/household_power_consumption.zip"
KAGGLE_URL = None  # Optional kaggle mirror


def download_uci_dataset(output_dir: Path = DATA_DIR) -> bool:
    """
    Download and preprocess UCI Household Electric Power Consumption dataset.
    Returns True on success, False on failure.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    zip_path = output_dir / "uci_raw.zip"
    raw_path = output_dir / "household_power_consumption.txt"
    out_path = output_dir / "consumption.csv"
    
    if out_path.exists():
        print(f"[DATA] Already exists: {out_path}")
        return True
    
    print("[DATA] Attempting to download UCI Household Power Consumption dataset...")
    try:
        response = requests.get(UCI_URL, stream=True, timeout=60)
        response.raise_for_status()
        
        total = int(response.headers.get("content-length", 0))
        downloaded = 0
        
        with open(zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = downloaded / total * 100
                    print(f"\r[DATA] Download: {pct:.1f}%", end="", flush=True)
        print()
        
        print("[DATA] Extracting...")
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(output_dir)
        zip_path.unlink()
        
        print("[DATA] Preprocessing UCI dataset...")
        df = preprocess_uci(raw_path, out_path)
        print(f"[DATA] Saved {len(df)} hourly rows to {out_path}")
        return True
        
    except Exception as e:
        print(f"\n[DATA] Download failed: {e}")
        return False


def preprocess_uci(raw_path: Path, out_path: Path) -> pd.DataFrame:
    """
    Preprocess the raw UCI dataset into hourly consumption CSV.
    UCI format: Date;Time;Global_active_power;...
    """
    print("[DATA] Reading raw file (this may take a moment for 2M rows)...")
    df = pd.read_csv(
        raw_path,
        sep=";",
        na_values=["?", "", "NA"],
        low_memory=False,
        dtype=str,
    )
    
    # Parse datetime
    df["timestamp"] = pd.to_datetime(
        df["Date"] + " " + df["Time"], format="%d/%m/%Y %H:%M:%S", errors="coerce"
    )
    df = df.dropna(subset=["timestamp"])
    
    # Parse consumption (kW → kWh per minute, then sum to hour)
    df["Global_active_power"] = pd.to_numeric(df["Global_active_power"], errors="coerce")
    df = df.dropna(subset=["Global_active_power"])
    
    # Convert kW (minute readings) to kWh
    df["consumption_kwh"] = df["Global_active_power"] / 60.0
    
    # Resample to hourly
    df = df.set_index("timestamp")
    hourly = df["consumption_kwh"].resample("h").sum()
    
    # Remove hours with very few minutes of data (< 30 min)
    minute_counts = df["consumption_kwh"].resample("h").count()
    hourly = hourly[minute_counts >= 30]
    
    result = hourly.reset_index()
    result.columns = ["timestamp", "consumption_kwh"]
    result["consumption_kwh"] = result["consumption_kwh"].round(4)
    result["is_demo"] = False
    
    result.to_csv(out_path, index=False)
    return result


if __name__ == "__main__":
    success = download_uci_dataset()
    if not success:
        print("[DATA] Falling back to synthetic demo data generation...")
        sys.path.insert(0, str(Path(__file__).parent))
        from generate_demo_data import generate_demo_data
        generate_demo_data(output_dir=str(DATA_DIR))
