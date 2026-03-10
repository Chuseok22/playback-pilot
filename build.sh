#!/usr/bin/env bash
set -euo pipefail

# manifest.json에서 버전 추출
VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUTPUT_DIR="dist"
OUTPUT_FILE="${OUTPUT_DIR}/playback-pilot-v${VERSION}.zip"

echo "Building Playback Pilot v${VERSION}..."

mkdir -p "${OUTPUT_DIR}"

# 배포에 포함할 파일/폴더만 zip으로 묶음
zip -r "${OUTPUT_FILE}" \
  manifest.json \
  content_script.js \
  injected.js \
  storage.js \
  popup/ \
  overlay/ \
  icons/ \
  --exclude "*.DS_Store"

echo "Done: ${OUTPUT_FILE}"
echo "File size: $(du -sh "${OUTPUT_FILE}" | cut -f1)"
