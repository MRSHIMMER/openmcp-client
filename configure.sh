cd renderer && npm i && cd ..
cd service && npm i && cd ..
cd servers && uv sync
npm i
npm run prepare:ocr