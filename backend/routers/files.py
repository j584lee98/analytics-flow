from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import shutil
import os

from database import get_db
from models import UserDB, FileDB
from schemas import FileResponse, FileUpdate
from auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    # Check for duplicate filename for this user
    existing_file = db.query(FileDB).filter(
        FileDB.owner_id == current_user.id,
        FileDB.filename == file.filename
    ).first()

    if existing_file:
        raise HTTPException(status_code=400, detail="File with this name already exists")

    file_location = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")

    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    db_file = FileDB(
        filename=file.filename,
        filepath=file_location,
        owner_id=current_user.id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return db_file


@router.get("/files", response_model=List[FileResponse])
def get_files(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(FileDB).filter(FileDB.owner_id == current_user.id).all()


@router.get("/files/{file_id}", response_model=FileResponse)
def get_file(
    file_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_file = db.query(FileDB).filter(FileDB.id == file_id, FileDB.owner_id == current_user.id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    return db_file


@router.put("/files/{file_id}", response_model=FileResponse)
def update_file(
    file_id: str,
    file_update: FileUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_file = db.query(FileDB).filter(FileDB.id == file_id, FileDB.owner_id == current_user.id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    if not file_update.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Filename must end with .csv")

    # Check if new filename already exists
    if file_update.filename != db_file.filename:
        existing_file = db.query(FileDB).filter(
            FileDB.owner_id == current_user.id,
            FileDB.filename == file_update.filename
        ).first()
        if existing_file:
            raise HTTPException(status_code=400, detail="File with this name already exists")

        # Rename file on disk
        old_path = db_file.filepath
        new_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file_update.filename}")
        try:
            os.rename(old_path, new_path)
            db_file.filepath = new_path
        except OSError:
            raise HTTPException(status_code=500, detail="Error renaming file on disk")

    db_file.filename = file_update.filename
    db.commit()
    db.refresh(db_file)
    return db_file


@router.delete("/files/{file_id}")
def delete_file(
    file_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_file = db.query(FileDB).filter(FileDB.id == file_id, FileDB.owner_id == current_user.id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    # Delete file from disk
    if os.path.exists(db_file.filepath):
        os.remove(db_file.filepath)

    db.delete(db_file)
    db.commit()
    return {"message": "File deleted successfully"}
