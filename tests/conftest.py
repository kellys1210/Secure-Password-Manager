import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set JWT_SECRET for testing if not already set
if not os.getenv("JWT_SECRET"):
    os.environ["JWT_SECRET"] = "test-jwt-secret-key-for-testing-purposes-only"
