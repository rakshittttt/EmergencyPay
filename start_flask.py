#!/usr/bin/env python3

import subprocess
import sys
import os

def main():
    # Build the frontend first
    print("Building frontend...")
    build_result = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True)
    
    if build_result.returncode != 0:
        print("Frontend build failed:")
        print(build_result.stderr)
        sys.exit(1)
    
    print("Frontend built successfully!")
    
    # Start the Flask app
    print("Starting Flask application...")
    os.execv(sys.executable, [sys.executable, 'app.py'])

if __name__ == '__main__':
    main()