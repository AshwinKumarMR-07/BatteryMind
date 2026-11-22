import os
import sys
import uvicorn

# Add backend directory to module search path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    print("=" * 65)
    print("  BatteryMind – Universal EV Battery Health Intelligence Platform")
    print("=" * 65)
    print("Starting Unified Server on http://localhost:8000 ...")
    print("API Documentation: http://localhost:8000/docs")
    print("Full Dashboard:    http://localhost:8000")
    print("=" * 65)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, app_dir=backend_dir)
