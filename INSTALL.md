# Installation Guide

It looks like **Go** and **Node.js** are not currently installed on your system. These are required to run the backend and frontend respectively.

Since you have `winget` (Windows Package Manager) available, you can install them easily using the commands below.

## 1. Install Go (Golang)

Open a **new** PowerShell terminal as **Administrator** and run:

```powershell
winget install -e --id GoLang.Go
```

Or download the installer from: [https://go.dev/dl/](https://go.dev/dl/)

## 2. Install Node.js (includes npm)

In the same **Administrator** terminal, run:

```powershell
winget install -e --id OpenJS.NodeJS.LTS
```

Or download the installer from: [https://nodejs.org/en/download/](https://nodejs.org/en/download/)

## 3. Restart Terminal

**Important:** After installation, you MUST **close this terminal/IDE and reopen it** for the new commands (`go` and `npm`) to be recognized.

## 4. Verify Installation

After restarting, verify everything is working:

```powershell
go version
npm --version
```

## 5. Troubleshooting

### PowerShell "Script Disabled" Error

If you see an error like `running scripts is disabled on this system`, run this command in PowerShell to allow scripts for your user:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or, use the Command Prompt (`cmd`) instead of PowerShell, or run `npm.cmd` explicitly:

```powershell
npm.cmd run dev
```

## 6. Run the Project

Once installed, you can use the provided `setup.bat` script to initialize everything:

```powershell
.\setup.bat
```
