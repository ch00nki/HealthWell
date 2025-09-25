from google.cloud import storage
import os

# Adjust these variables
BUCKET_NAME = "healthwell-flan_t5_diagnosis"   # <-- change to your GCS bucket
MODEL_DIR = ""  # folder in bucket, in this case, root!
LOCAL_DIR = "flan_t5_large_diagnosis_v2"  # folder where it will be saved on VM

def download_directory(bucket_name, source_folder, destination_folder):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=source_folder)

    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)

    for blob in blobs:
        # Remove the prefix (folder path in bucket)
        rel_path = blob.name.replace(source_folder, "").lstrip("/")
        local_path = os.path.join(destination_folder, rel_path)

        # If it's a "folder"
        if blob.name.endswith("/"):
            continue

        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        print(f"Downloading {blob.name} to {local_path}")
        blob.download_to_filename(local_path)

if __name__ == "__main__":
    download_directory(BUCKET_NAME, MODEL_DIR, LOCAL_DIR)
