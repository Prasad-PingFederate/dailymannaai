import os

with open("versions_to_export.txt", "r") as f:
    target_versions = [line.strip() for line in f if line.strip()]

exported_files = os.listdir("export")
exported_versions = set()
for f in exported_files:
    if f.endswith(".json"):
        v = f[:-5]
        exported_versions.add(v)
    elif f.endswith(".json.done"):
        v = f[:-10]
        exported_versions.add(v)

missing_export = [v for v in target_versions if v not in exported_versions]

with open("migration_progress.done", "r") as f:
    done_files = set(line.strip() for line in f if line.strip())

to_push = []
for f in exported_files:
    if f in done_files:
        continue
    if f.endswith(".json") or f.endswith(".json.done"):
        to_push.append(f)

print(f"Target versions: {len(target_versions)}")
print(f"Missing export: {len(missing_export)}")
print(f"Files to push: {len(to_push)}")
if missing_export:
    print(f"Sample missing export: {missing_export[:5]}")
