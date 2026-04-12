
#!/usr/bin/env bash

# $1 is the first argument, $2 is the second, etc.

echo "First argument: $1"
echo "Second argument: $2"

# You can check if an argument exists
if [[ -z "$1" ]]; then
    echo "No first argument provided!"
else
    echo "You passed '$1' as the first argument."
fi
