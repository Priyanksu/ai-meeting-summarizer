# import os
# import shutil
# from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# from app.services.transcription import transcribe_audio_file
# from app.services.llm_processor import process_meeting_pipeline

# app = FastAPI(title="Local AI Meeting Summarizer Engine")

# TEMP_DIR = "./temp_audio"
# os.makedirs(TEMP_DIR, exist_ok=True)

# @app.post("/api/meetings/process")
# async def process_meeting(
#     file: UploadFile = File(...),
#     language: str = Form("en")  # 'en', 'hi', or 'as' from frontend select forms
# ):
#     if language not in ["en", "hi", "as"]:
#         raise HTTPException(status_code=400, detail="Invalid language choice. Choose 'en', 'hi', or 'as'.")
        
#     temp_file_path = os.path.join(TEMP_DIR, file.filename)
    
#     try:
#         # Save file locally temporarily to pass to whisper
#         with open(temp_file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
            
#         print(f"Received meeting audio file: {file.filename}. Starting STT...")
#         transcript = transcribe_audio_file(temp_file_path, language)
        
#         print("STT complete. Passing text to local pipeline...")
#         summary_output = process_meeting_pipeline(transcript, language)
        
#         return {
#             "status": "Success",
#             "filename": file.filename,
#             "language": language,
#             "transcript": transcript,
#             "summary": summary_output
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Processing pipeline error: {str(e)}")
        
#     finally:
#         # Cleanup: Ensure temporary audio file is deleted immediately to free up hard drive storage space
#         if os.path.exists(temp_file_path):
#             os.remove(temp_file_path)

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)


import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.models import Meeting
from app.services.transcription import transcribe_audio_file
from app.services.llm_processor import process_meeting_pipeline

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Local AI Meeting Summarizer Engine")

# Enable CORS for React Frontend (runs on port 5173 by default with Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "./temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/api/meetings/process")
async def process_meeting(
    file: UploadFile = File(...),
    language: str = Form("en"),
    db: Session = Depends(get_db)
):
    if language not in ["en", "hi", "as"]:
        raise HTTPException(status_code=400, detail="Invalid language choice. Choose 'en', 'hi', or 'as'.")
        
    temp_file_path = os.path.join(TEMP_DIR, file.filename)
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 1. Transcribe audio
        transcript = transcribe_audio_file(temp_file_path, language)
        
        # 2. Process summary
        summary_output = process_meeting_pipeline(transcript, language)
        
        # 3. Save to database
        new_meeting = Meeting(
            filename=file.filename,
            language=language,
            transcript=transcript,
            summary=summary_output
        )
        db.add(new_meeting)
        db.commit()
        db.refresh(new_meeting)
        
        return {
            "status": "Success",
            "id": new_meeting.id,
            "filename": new_meeting.filename,
            "language": new_meeting.language,
            "transcript": new_meeting.transcript,
            "summary": new_meeting.summary,
            "created_at": new_meeting.created_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
        
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/api/meetings")
def get_all_meetings(db: Session = Depends(get_db)):
    """Retrieves all past processed meetings for the frontend dashboard history."""
    return db.query(Meeting).order_by(Meeting.created_at.desc()).all()

@app.get("/api/meetings/{meeting_id}")
def get_meeting_by_id(meeting_id: int, db: Session = Depends(get_db)):
    """Retrieves a single meeting record."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting