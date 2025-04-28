rm -rf dist
tsc
electron-builder
du -h dist/OpenMCP-0.0.1-arm64.dmg