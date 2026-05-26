# MongoDB Community Server Binary

This directory must contain the MongoDB Community Server binary before building the Windows installer.

## Steps

1. Go to: https://www.mongodb.com/try/download/community
2. Select: Version **7.0**, Platform **Windows**, Package **zip**
3. Download and extract the zip
4. Copy **only** these files into `electron/resources/mongodb/bin/`:
   - `mongod.exe`
   - `mongod.pdb` (optional, for crash debugging)
   - Any required `.dll` files from the same bin/ folder

## Why not included in the repo?
The binary is ~70 MB and platform-specific. It is excluded from git via `.gitignore`.

## Directory structure expected
```
electron/resources/mongodb/bin/mongod.exe
```
