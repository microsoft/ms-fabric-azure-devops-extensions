@echo off
REM %1 is the first argument, %2 is the second, etc.

echo First argument: %1
echo Second argument: %2

REM You can check if an argument exists
if "%1"=="" (
    echo No first argument provided!
) else (
    echo You passed %1 as the first argument.
)