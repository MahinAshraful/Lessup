from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
import json
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, APIC, TIT2, TPE1
import requests
import time
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="uploads")
# Configure CORS with specific origins
CORS(
    app,
    resources={
        r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}
    },
)

# Configure maximum file size (16MB)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

# Create upload folders if they don't exist
UPLOAD_FOLDER = "uploads"
AUDIO_FOLDER = os.path.join(UPLOAD_FOLDER, "audio")
COVERS_FOLDER = os.path.join(UPLOAD_FOLDER, "covers")
SOUND_EFFECTS_FOLDER = os.path.join(UPLOAD_FOLDER, "effects")

os.makedirs(AUDIO_FOLDER, exist_ok=True)
os.makedirs(COVERS_FOLDER, exist_ok=True)
os.makedirs(SOUND_EFFECTS_FOLDER, exist_ok=True)

# Database file
DB_FILE = "songs_db.json"


# Load database
def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error loading database: {e}")
            print("Creating new database file")
            # If the file is corrupted, create a new one
            db = {"songs": []}
            save_db(db)
            return db
    else:
        # If the file doesn't exist, create it
        db = {"songs": []}
        save_db(db)
        return db


# Save database
def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=2)


# Get a default cover image if none exists
def get_default_cover():
    default_cover_path = os.path.join(COVERS_FOLDER, "default_cover.jpg")

    # Create a default cover if it doesn't exist
    if not os.path.exists(default_cover_path):
        try:
            response = requests.get(
                "https://placehold.co/400x400/6c5ce7/FFFFFF?text=Lessup"
            )
            if response.status_code == 200:
                with open(default_cover_path, "wb") as f:
                    f.write(response.content)
                print(f"Created default cover at {default_cover_path}")
            else:
                print(
                    f"Failed to download default cover, status: {response.status_code}"
                )
                # Create an empty file
                with open(default_cover_path, "w") as f:
                    f.write("")
        except Exception as e:
            print(f"Error creating default cover: {str(e)}")
            # Create an empty file
            with open(default_cover_path, "w") as f:
                f.write("")

    return default_cover_path


# Check for required sound effects and create them if they don't exist
def ensure_sound_effects():
    # Create simple empty files for rain and thunder
    # In a real application, you would download or include actual sound files
    sound_effects = ["rain.mp3", "thunder.mp3"]

    for effect_file in sound_effects:
        effect_path = os.path.join(SOUND_EFFECTS_FOLDER, effect_file)
        if not os.path.exists(effect_path):
            try:
                # Create an empty MP3 file (just for testing)
                with open(effect_path, "wb") as f:
                    # Write minimal MP3 header
                    f.write(
                        b"\xff\xfb\x90\x44\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
                    )
                print(f"Created empty {effect_file} file")
            except Exception as e:
                print(f"Error creating {effect_file}: {str(e)}")


# Extract cover image from MP3 file
def extract_cover_from_mp3(mp3_path, song_id):
    print(f"Attempting to extract cover from: {mp3_path}")
    try:
        # Check if file exists
        if not os.path.exists(mp3_path):
            print(f"MP3 file does not exist: {mp3_path}")
            return f"/api/covers/default_cover.jpg"

        try:
            # Try to load with ID3
            audio = MP3(mp3_path, ID3=ID3)
            print(f"MP3 loaded successfully with tags: {audio.tags is not None}")

            # If the file has no ID3 tags, or tags is None
            if not audio.tags:
                print("No ID3 tags found")
                return f"/api/covers/default_cover.jpg"

            # Log available frame IDs for debugging
            frame_ids = [tag.FrameID for tag in audio.tags.values()]
            print(f"Available frame IDs: {frame_ids}")

            for tag in audio.tags.values():
                if tag.FrameID == "APIC":
                    cover_path = os.path.join(COVERS_FOLDER, f"{song_id}.jpg")
                    with open(cover_path, "wb") as f:
                        f.write(tag.data)
                    print(f"Cover image saved to: {cover_path}")
                    return f"/api/covers/{song_id}.jpg"

            print("No APIC (album art) frame found in ID3 tags")
        except Exception as e:
            print(f"Error processing MP3 tags: {str(e)}")

    except Exception as e:
        print(f"Error extracting cover: {str(e)}")

    # If no cover found, return path to default cover
    default_cover = get_default_cover()
    print(f"Using default cover: {default_cover}")
    return f"/api/covers/default_cover.jpg"


# Initialize the app
@app.before_request
def initialize_if_needed():
    if not hasattr(app, "initialized"):
        ensure_sound_effects()
        get_default_cover()
        app.initialized = True


# Routes
@app.route("/api/songs", methods=["GET"])
def get_songs():
    db = load_db()
    return jsonify(db["songs"])


@app.route("/api/upload", methods=["POST"])
def upload_song():
    print("Received upload request")
    print("Form data:", request.form)
    print("Files:", request.files)

    try:
        if "file" not in request.files:
            print("No file part in request")
            return jsonify({"error": "No file part"}), 400

        file = request.files["file"]
        title = request.form.get("title", "Untitled")
        artist = request.form.get("artist", "Unknown Artist")

        print(f"Processing file: {file.filename}, Content type: {file.content_type}")

        if file.filename == "":
            print("File has no filename")
            return jsonify({"error": "No selected file"}), 400

        if file:
            # Generate a unique ID for the song
            song_id = str(uuid.uuid4())
            print(f"Generated song ID: {song_id}")

            # Secure the filename and save the file
            filename = secure_filename(file.filename)
            extension = os.path.splitext(filename)[1].lower()

            print(f"File extension: {extension}")

            # Handle missing or incorrect extension based on content type
            if not extension:
                if (
                    "audio/mpeg" in file.content_type
                    or "audio/mp3" in file.content_type
                ):
                    extension = ".mp3"
                elif "audio/wav" in file.content_type:
                    extension = ".wav"
                elif "audio/ogg" in file.content_type:
                    extension = ".ogg"
                else:
                    extension = ".mp3"  # Default to mp3
                print(
                    f"No extension in filename, deduced {extension} from content type"
                )

            if extension not in [".mp3", ".wav", ".ogg", ".m4a"]:
                print(f"Unsupported file format: {extension}")
                return jsonify({"error": f"Unsupported file format: {extension}"}), 400

            file_path = os.path.join(AUDIO_FOLDER, f"{song_id}{extension}")
            print(f"Saving file to: {file_path}")

            try:
                file.save(file_path)
                print(f"File saved successfully to {file_path}")
            except Exception as e:
                print(f"Error saving file: {str(e)}")
                return jsonify({"error": f"Failed to save file: {str(e)}"}), 500

            # Get cover image
            try:
                if extension == ".mp3":
                    cover_url = extract_cover_from_mp3(file_path, song_id)
                    print(f"Extracted cover: {cover_url}")
                else:
                    cover_url = f"/api/covers/default_cover.jpg"
                    print("Using default cover")
            except Exception as e:
                print(f"Error extracting cover: {str(e)}")
                cover_url = f"/api/covers/default_cover.jpg"

            # Get the duration of the audio file
            try:
                if extension == ".mp3":
                    audio = MP3(file_path)
                    duration = audio.info.length
                    print(f"MP3 duration: {duration}")
                else:
                    # For other formats, you might need other libraries
                    duration = 0  # Placeholder
                    print("Using placeholder duration for non-MP3 file")
            except Exception as e:
                duration = 0
                print(f"Error getting duration: {str(e)}")

            # Create song entry
            song = {
                "id": song_id,
                "title": title,
                "artist": artist,
                "url": f"/api/audio/{song_id}{extension}",
                "coverUrl": cover_url,
                "duration": duration,
                "uploadDate": int(time.time()),
            }

            print(f"Created song entry: {song}")

            # Add to database
            try:
                db = load_db()
                db["songs"].append(song)
                save_db(db)
                print("Song added to database")
            except Exception as e:
                print(f"Error updating database: {str(e)}")
                return jsonify({"error": f"Database error: {str(e)}"}), 500

            return jsonify(song), 201

        print("File object is falsy")
        return jsonify({"error": "Invalid file object"}), 400

    except Exception as e:
        error_message = f"Unexpected error: {str(e)}"
        print(error_message)
        import traceback

        traceback.print_exc()
        return jsonify({"error": error_message}), 500


@app.route("/api/audio/<filename>", methods=["GET"])
def get_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)


@app.route("/api/covers/<filename>", methods=["GET"])
def get_cover(filename):
    return send_from_directory(COVERS_FOLDER, filename)


@app.route("/api/effects/<filename>", methods=["GET"])
def get_effect(filename):
    return send_from_directory(SOUND_EFFECTS_FOLDER, filename)


@app.route("/", methods=["GET"])
def index():
    return "Lessup API Server is running!"


if __name__ == "__main__":
    app.run(debug=True)
