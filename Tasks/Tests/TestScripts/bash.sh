
#!/usr/bin/env bash

# Create workspace without capacity
fab create ws3-test-Workspace capacityname=none

# Navigate into workspace
fab cd ws3-test-Workspace
fab cd ..
# Remove workspace
fab rm ws3-test-Workspace

# Print confirmation
echo "Shell script test run"
