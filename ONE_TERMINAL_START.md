
# EARPMS One-Terminal Development Launch

From the extracted `earpms-flask` folder, open PowerShell and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\run-earpms.ps1
```

This single PowerShell terminal starts both:
- Flask API: http://127.0.0.1:5000
- React/Vite: http://127.0.0.1:5173
- SQLite development database: `backend/earpms_dev.db`
- Demo/Quick Access logins: enabled

The script checks/installs dependencies if needed, starts both servers, monitors them, and stops both when you press Ctrl+C.

If dependencies are already installed, use:

```powershell
.\run-earpms.ps1 -NoInstall
```

Do not use this launcher for production. Production should use PostgreSQL, Gunicorn, and a proper reverse proxy.
