@echo off
setlocal

set "MAVEN_VERSION=3.9.6"
set "MAVEN_DIR=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%MAVEN_VERSION%"
set "MAVEN_ZIP=%USERPROFILE%\.m2\wrapper\apache-maven-%MAVEN_VERSION%-bin.zip"
set "MAVEN_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip"
set "MVN_CMD=%MAVEN_DIR%\bin\mvn.cmd"

if exist "%MVN_CMD%" goto :run

echo [mvnw] Maven %MAVEN_VERSION% not found. Downloading...
if not exist "%USERPROFILE%\.m2\wrapper" mkdir "%USERPROFILE%\.m2\wrapper"

powershell -NoProfile -Command ^
  "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_ZIP%'"
if errorlevel 1 (
  echo [mvnw] Download failed. Install Maven manually: https://maven.apache.org/download.cgi
  exit /b 1
)

powershell -NoProfile -Command ^
  "Expand-Archive -Force -Path '%MAVEN_ZIP%' -DestinationPath '%USERPROFILE%\.m2\wrapper\dists\'"
if errorlevel 1 (
  echo [mvnw] Extraction failed.
  exit /b 1
)
echo [mvnw] Maven %MAVEN_VERSION% ready.

:run
"%MVN_CMD%" %*
endlocal
