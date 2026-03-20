import os

export_dir = "export"
if not os.path.exists(export_dir):
    print("Export directory does not exist.")
    exit()

files = os.listdir(export_dir)
json_files = [f for f in files if f.endswith(".json") and not f.endswith(".done")]
done_files = [f for f in files if f.endswith(".done")]

print(f"📊 Migration Progress Summary:")
print(f"📂 Pending Upload: {len(json_files)} files")
print(f"✅ Completed:      {len(done_files)} files")
print(f"🚀 Total Languages: {len(json_files) + len(done_files)}")

if json_files:
    print(f"\n🔜 Next in Queue: {json_files[:10]}")
