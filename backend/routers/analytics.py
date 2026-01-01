from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import os
import numpy as np

from database import get_db
from models import UserDB, FileDB
from auth import get_current_user

router = APIRouter()

@router.get("/analytics/{file_id}")
def get_analytics(
    file_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_file = db.query(FileDB).filter(FileDB.id == file_id, FileDB.owner_id == current_user.id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.exists(db_file.filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    try:
        df = pd.read_csv(db_file.filepath)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV file: {str(e)}")

    analytics_data = []

    for col in df.columns:
        col_data = df[col]
        dtype = str(col_data.dtype)
        stats = {}
        
        # Determine simplified type
        simple_type = "String"
        if pd.api.types.is_numeric_dtype(col_data):
            if pd.api.types.is_integer_dtype(col_data):
                simple_type = "Integer"
            else:
                simple_type = "Float"
        elif pd.api.types.is_bool_dtype(col_data):
            simple_type = "Boolean"
        
        # Common stats
        stats["missing_values"] = int(col_data.isnull().sum())
        stats["total_count"] = int(len(col_data))

        if simple_type in ["Integer", "Float"]:
            stats["mean"] = float(col_data.mean()) if not col_data.empty else None
            stats["median"] = float(col_data.median()) if not col_data.empty else None
            stats["min"] = float(col_data.min()) if not col_data.empty else None
            stats["max"] = float(col_data.max()) if not col_data.empty else None
            stats["std"] = float(col_data.std()) if not col_data.empty else None
            
            quantiles = col_data.quantile([0.25, 0.5, 0.75]).to_dict()
            stats["25%"] = float(quantiles.get(0.25)) if not col_data.empty else None
            stats["50%"] = float(quantiles.get(0.5)) if not col_data.empty else None
            stats["75%"] = float(quantiles.get(0.75)) if not col_data.empty else None

        elif simple_type == "Boolean":
            value_counts = col_data.value_counts().to_dict()
            stats["true_count"] = int(value_counts.get(True, 0))
            stats["false_count"] = int(value_counts.get(False, 0))

        else: # String / Object
            stats["unique_count"] = int(col_data.nunique())
            if not col_data.empty:
                mode = col_data.mode()
                if not mode.empty:
                    stats["most_frequent"] = str(mode.iloc[0])
                    stats["freq_of_most_frequent"] = int(col_data.value_counts().iloc[0])

        analytics_data.append({
            "name": col,
            "type": simple_type,
            "stats": stats
        })

    return {"filename": db_file.filename, "columns": analytics_data}
