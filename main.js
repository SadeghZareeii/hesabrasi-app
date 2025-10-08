// main.js
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
const dataFile = path.join(__dirname, "data.json");
const passwordFile = path.join(__dirname, "password.json");

// مسیر آیکون (dev یا نصب‌شده)
const appIcon = path.join(__dirname, "assets/icon.ico");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    icon: appIcon, // لوگوی اپ
  });

  // Start from login page (consistent with your flow)
  mainWindow.loadFile("login.html");
}

app.whenReady().then(createWindow);

// Data: load
ipcMain.handle("load-data", async () => {
  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, "utf8");
      return JSON.parse(raw);
    }
    return [];
  } catch (err) {
    console.error("Load error:", err);
    return [];
  }
});

// Data: save
ipcMain.handle("save-data", async (_, newData) => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(newData, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Save error:", err);
    return false;
  }
});

// Data: backup
// ipcMain.handle("backup-data", async () => {
//   try {
//     if (!fs.existsSync(dataFile)) return null;
//     const backupPath = path.join(__dirname, `backup-${Date.now()}.json`);
//     fs.copyFileSync(dataFile, backupPath);
//     return backupPath;
//   } catch (err) {
//     console.error("Backup error:", err);
//     return null;
//   }
// });

// Data: backup with user-selected path
ipcMain.handle("backup-data", async () => {
  try {
    if (!fs.existsSync(dataFile)) return null;

    // باز کردن دیالوگ انتخاب مسیر
    const { filePath } = await dialog.showSaveDialog({
      title: "ذخیره بکاپ",
      defaultPath: path.join(
        app.getPath("documents"),
        `backup-${Date.now()}.json`
      ),
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    });

    if (!filePath) {
      return { ok: false, cancelled: true };
    }

    // کپی فایل اصلی به مسیر انتخابی
    fs.copyFileSync(dataFile, filePath);

    return { ok: true, filePath };
  } catch (err) {
    console.error("Backup error:", err);
    return {
      ok: false,
      cancelled: false,
      message: err?.message || "Unknown error",
    };
  }
});

// Password: check
ipcMain.handle("check-password", async (_, input) => {
  try {
    if (!fs.existsSync(passwordFile)) {
      fs.writeFileSync(
        passwordFile,
        JSON.stringify({ password: "1234" }),
        "utf8"
      );
    }
    const { password } = JSON.parse(fs.readFileSync(passwordFile, "utf8"));
    return input === password;
  } catch (err) {
    console.error("Password check error:", err);
    return false;
  }
});

// Password: change
ipcMain.handle("change-password", async (_, newPass) => {
  try {
    fs.writeFileSync(
      passwordFile,
      JSON.stringify({ password: newPass }),
      "utf8"
    );
    return true;
  } catch (err) {
    console.error("Change password error:", err);
    return false;
  }
});

// تولید و باز کردن گزارش HTML در مرورگر
ipcMain.handle("generate-html-report", async (_, item, fileNameSuggestion) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: "ذخیره گزارش HTML",
      defaultPath: path.join(app.getPath("documents"), fileNameSuggestion),
      filters: [{ name: "HTML Files", extensions: ["html", "htm"] }],
    });

    if (!filePath) return { ok: false, cancelled: true };

    // escape برای جلوگیری از مشکل کاراکترها
    const escape = (v) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // ساخت ردیف‌ها
    let rows = "";
    Object.entries(item || {}).forEach(([k, v]) => {
      if (k === "id") return;
      rows += `
    <div class="row">
      <div class="label">${escape(k)}</div>
      <div class="value">${escape(v)}</div>
    </div>`;
    });

    const html = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<title>گزارش مددجو</title>
<style>

body {
  padding: 70px;
}
.bism {
    text-align: center;
    font-size: 25px;
}
    .title-h1 {
    text-align: center;
    font-size: 15px;
}
.report-container {justify-items: stretch;
  display: grid;
  grid-template-columns: repeat(2,1fr);
  align-items: center;
  justify-content: center;
  width: 100%;
  border: 1px solid #000;
  border-radius: 4px;
  overflow: hidden;
  font-family: Tahoma, Vazir, Arial, sans-serif;
}

.row {
  display: flex;
  border-bottom: 1px solid #000;
  align-items: flex-start;
  flex-wrap: wrap;
}

.row:last-child {
  border-bottom: none;
}


.label {
    flex: 0 0 30%;
    font-weight: bold;
    background: #f7f7f7;
    padding: 8px;
    border: 1px solid #000;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    font-size: 10px;
    justify-content: flex-start; 

}

.value {
  flex: 1;
  padding: 8px;
  word-wrap: break-word;
  white-space: pre-wrap; /* متن طولانی بشکنه */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  font-size: 18px;
  justify-content: flex-start;
}
  .footer{
    text-align: center;
    margin: 25px;
    font-size: 25px;
  }

  button#printBtn {
    width: 80px;
    height: 45px;
    font-size: 19px;
    position: fixed;
    left: 100px;
    border-radius: 15px;
    background-color: #007bff;
    color: #fff;
  }
</style>
</head>
<body>
  <h1 class="bism">بسم تعالی</h1>
  <div class="title-h1">
    <h1>فرم ثبت اطلاعات دریافت و پرداخت<br>مساعدت‌های کانون فرهنگی هنری مسجد حضرت ولی عصر (عج)</h1>
    <h2>گزارش مددجو</h2>
  </div>

  <div class="report-container">
    ${rows}
  </div>

  <div class="footer">روابط عمومی مسجد حضرت ولی عصر (عج)</div>
   <button onclick="window.print()" id="printBtn">🖨 چاپ</button>
</body>
</html>`;

    fs.writeFileSync(filePath, html, "utf8");
    shell.openPath(filePath);

    return { ok: true, filePath };
  } catch (err) {
    console.error("Generate HTML report error:", err);
    return {
      ok: false,
      cancelled: false,
      message: err?.message || "Unknown error",
    };
  }
});
