// renderer/app.js

const { ipcRenderer } = require("electron");

// --- State ---
let data = [];
let currentPage = 1;
const itemsPerPage = 5;
let editIndex = null;

// --- Bootstrap ---
window.onload = async () => {
  // Load data once
  try {
    data = await ipcRenderer.invoke("load-data");
  } catch (e) {
    console.error("Load data error:", e);
    data = [];
  }
  // Newest first
  data = Array.isArray(data) ? data : [];

  initLoginPage();
  initIndexPage();
  initListPage();
  initPrintPage();
  initPasswordModal();
};

// --- Login page ---
function initLoginPage() {
  const pwdInput = document.getElementById("passwordInput");
  const loginBtn = document.getElementById("loginBtn");
  const errorMsg = document.getElementById("errorMsg");

  if (!pwdInput || !loginBtn) return;

  const goToForm = () => {
    location.href = "index.html";
  };

  const handleLogin = async () => {
    const input = pwdInput.value || "";
    errorMsg.textContent = "";
    const ok = await ipcRenderer.invoke("check-password", input);
    if (ok) {
      goToForm();
    } else {
      errorMsg.textContent = "رمز اشتباه است ❌";
    }
  };

  loginBtn.addEventListener("click", handleLogin);
  pwdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
}

// --- Index (form) page ---
function initIndexPage() {
  const loader = document.getElementById("loader");
  const formContainer = document.getElementById("form-container");
  const form = document.getElementById("form");

  if (!form || !formContainer) return;

  if (loader) loader.style.display = "none";
  formContainer.style.display = "flex";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target));
    // explicit id
    formData.id = Date.now();

    // Add newest on top
    data.unshift(formData);

    try {
      await ipcRenderer.invoke("save-data", data);
      alert("اطلاعات ذخیره شد ✅");
      e.target.reset();
    } catch (err) {
      console.error("Save data error:", err);
      alert("خطا در ذخیره اطلاعات ❌");
    }
  });

  document.getElementById("goToList")?.addEventListener("click", () => {
    location.href = "list.html";
  });

  document.getElementById("backupBtn")?.addEventListener("click", async () => {
    try {
      const backupPath = await ipcRenderer.invoke("backup-data");
      alert(backupPath ? "اطلاعات ذخیره شد ✅\n" : "فایل داده‌ای یافت نشد ❌");
    } catch (err) {
      console.error("Backup error:", err);
      alert("خطا درذخیره اطلاعات ❌");
    }
  });
  document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  console.log(
    document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
  );
}

// دکمه انتخاب فایل جدید
document
  .getElementById("reset-backup-btn")
  .addEventListener("click", async () => {
    const result = await dialog.showOpenDialog({
      title: "انتخاب فایل جدید",
      filters: [{ name: "JSON Files", extensions: ["json"] }],
      properties: ["openFile"],
    });

    let newFilePath = null;
    if (!result.canceled && result.filePaths.length > 0) {
      newFilePath = result.filePaths[0];
    }

    ipcRenderer.invoke("resetBackup", newFilePath).then((res) => {
      if (res.success) {
        loadData();
        renderTable();
        alert(res.message);
      } else {
        alert("خطا ❌: " + res.error);
      }
    });
  });

// --- List page ---
async function initListPage() {
  data = await ipcRenderer.invoke("load-data"); // 👈

  const table = document.getElementById("table");
  const fieldRow = document.getElementById("field-row");
  const dataRows = document.getElementById("data-rows");
  const searchInput = document.getElementById("search");
  const editModal = document.getElementById("edit-modal");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (!table || !fieldRow || !dataRows) return;

  // Navigation
  document.getElementById("goBackBtn")?.addEventListener("click", () => {
    location.href = "index.html";
  });

  // Search
  searchInput?.addEventListener("input", () => {
    currentPage = 1;
    renderTable();
  });

  // Edit modal buttons
  cancelEditBtn?.addEventListener("click", () => {
    editModal.style.display = "none";
    editIndex = null;
  });

  saveEditBtn?.addEventListener("click", async () => {
    const form = document.getElementById("edit-form");
    if (editIndex == null || !form) return;

    // ساخت آیتم جدید از روی فرم
    const updatedItem = {};
    const inputs = form.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      updatedItem[input.name] = input.value;
    });

    // شناسه قبلی رو نگه داریم
    updatedItem.id = data[editIndex].id;

    // آیتم قدیمی رو حذف کن
    data.splice(editIndex, 1);

    // آیتم جدید رو بذار آخر آرایه (مثل Add)
    data.push(updatedItem);

    try {
      await ipcRenderer.invoke("save-data", data);
      editModal.style.display = "none";
      renderTable();
      editIndex = null;
    } catch (err) {
      console.error("Edit save error:", err);
      alert("خطا در ذخیره ویرایش ❌");
    }
  });

  renderTable();
}

// Fields definition (19)
function getAllFields() {
  return [
    "نام",
    "نام خانوادگی",
    "نام پدر",
    "شماره شناسنامه",
    "شماره ملی",
    "تاریخ تولد",
    "شماره تماس",
    "نوع مساعدت",
    "مقدار مساعدت",
    "نیازها",
    "تعداد نفرات خانواده",
    "تعداد تحت پوشش",
    "نوع بیماری",
    "وضعیت شغلی",
    "نوع بیماری/نیاز",
    "نام ضمیر اهدا کننده",
    "تاریخ انجام",
    "آدرس",
    "توضیحات",
  ];
}

// Render table
function renderTable() {
  const fieldRow = document.getElementById("field-row");
  const dataRows = document.getElementById("data-rows");
  const search = document.getElementById("search")?.value?.toLowerCase() || "";
  const fields = getAllFields();

  if (!fieldRow || !dataRows) return;

  fieldRow.innerHTML = "";
  dataRows.innerHTML = "";

  // فیلتر بر اساس جستجو
  const filtered = data.filter((item) =>
    Object.values(item).some((val) =>
      (val ?? "").toString().toLowerCase().includes(search)
    )
  );

  // نگه‌داشتن ایندکس واقعی و نمایش جدیدترین بالا
  const ordered = filtered.map((item) => ({
    item,
    originalIndex: data.indexOf(item),
  }));
  // .reverse();

  // صفحه‌بندی
  const pageItems = ordered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // هدر ستون‌ها
  for (let i = 0; i < itemsPerPage; i++) {
    const th = document.createElement("th");
    th.textContent = pageItems[i]
      ? `مددجو ${i + 1 + (currentPage - 1) * itemsPerPage}`
      : "خالی";
    fieldRow.appendChild(th);
  }

  // ردیف‌های داده
  fields.forEach((field) => {
    const tr = document.createElement("tr");

    for (let i = 0; i < itemsPerPage; i++) {
      const td = document.createElement("td");

      const safeField = field
        .replace(/\s+/g, "-")
        .replace(/[^\w\u0600-\u06FF-]/g, "");

      td.setAttribute("title", field);
      td.classList.add(`value-${safeField}`);

      td.textContent = pageItems[i]?.item?.[field] || "";
      tr.appendChild(td);
    }

    dataRows.appendChild(tr);
  });

  // ردیف اکشن‌ها (ویرایش / حذف / چاپ)
  const actionRow = document.createElement("tr");
  for (let i = 0; i < itemsPerPage; i++) {
    const td = document.createElement("td");
    if (pageItems[i]) {
      const globalIndex = pageItems[i].originalIndex;
      td.innerHTML = `
        <button onclick="editItem(${globalIndex})">ویرایش</button>
        <button onclick="deleteItem(${globalIndex})">حذف</button>
        <button onclick="printItem(${globalIndex})">مشاهده اطلاعات/چاپ</button>
      `;
    }
    actionRow.appendChild(td);
  }
  dataRows.appendChild(actionRow);

  renderPagination(filtered.length);
}

// Pagination
function renderPagination(totalItems) {
  const container = document.getElementById("pagination");
  if (!container) return;
  container.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (currentPage > 1) {
    const prev = document.createElement("button");
    prev.textContent = "«";
    prev.onclick = () => {
      currentPage--;
      renderTable();
    };
    container.appendChild(prev);
  }

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = i;
      renderTable();
    };
    container.appendChild(btn);
  }

  if (currentPage < totalPages) {
    const next = document.createElement("button");
    next.textContent = "»";
    next.onclick = () => {
      currentPage++;
      renderTable();
    };
    container.appendChild(next);
  }
}

// --- Print page ---
// renderer/app.js (بخش چاپ را جایگزین کن)
function initPrintPage() {
  if (!location.href.includes("print.html")) return;

  const container = document.getElementById("print-area");
  if (!container) return;

  let item = null;
  try {
    item = JSON.parse(localStorage.getItem("printData"));
  } catch (_) {
    item = null;
  }

  // فقط برای پیش‌نمایش داخل اپ (اختیاری)، می‌تونی حذفش کنی چون فایل HTML بیرون ساخته میشه
  if (item && typeof item === "object") {
    let html = `
      <h1 class="bism">بسم تعالی</h1>
      <div style="text-align:center; margin-bottom:20px;">
        <h1>فرم ثبت اطلاعات دریافت و پرداخت <br> مساعدت‌های کانون فرهنگی هنری مسجد حضرت ولی عصر (عج)</h1>
        <h2 class="report-title">گزارش مددجو</h2>
      </div>
      <table style="width:100%; border-collapse:collapse; direction:rtl; unicode-bidi:bidi-override; font-family:Tahoma, Vazir, Arial, sans-serif;" border="1">
        <tbody>
    `;
    Object.entries(item).forEach(([key, value]) => {
      if (key === "id") return;

      // ساختن اسم کلاس امن
      const safeKey = key
        .replace(/\s+/g, "-")
        .replace(/[^\w\u0600-\u06FF-]/g, "");

      html += `
    <tr class="row-${safeKey}">
      <td class="label-${safeKey}" style="padding:8px; font-weight:bold;">${escapeHtml(
        key
      )}</td>
      <td class="value-${safeKey}" style="padding:8px;">${escapeHtml(
        value ?? ""
      )}</td>
    </tr>`;
    });
    html += `</tbody></table>
      <div style="text-align:center; margin-top:30px; font-weight:bold;">
        روابط عمومی مسجد حضرت ولی عصر (عج)
      </div>`;
    container.innerHTML = html;
  } else {
    container.innerHTML = "<p>هیچ اطلاعاتی برای چاپ وجود ندارد ❌</p>";
  }

  // دکمه چاپ: ساخت HTML و باز کردن در مرورگر
  document.getElementById("printBtn")?.addEventListener("click", async () => {
    if (!item) return;
    const safeName = `${sanitizeFileName(item["نام"] || "مددجو")}-${
      item["id"] || Date.now()
    }.html`;

    const res = await ipcRenderer.invoke(
      "generate-html-report",
      item,
      safeName
    );

    if (res?.ok) {
      alert("گزارش HTML ذخیره شد و در مرورگر باز شد:\n" + res.filePath);
    } else if (res?.cancelled) {
      alert("ذخیره‌سازی لغو شد ❌");
    } else {
      alert("خطا در ساخت گزارش HTML ❌\n" + (res?.message || ""));
    }
  });

  document.getElementById("goBackBtn")?.addEventListener("click", () => {
    location.href = "list.html";
  });

  document.getElementById("page-title").textContent = item["نام"]
    ? `گزارش ${item["نام"]}`
    : "گزارش مددجو";

  // اختیاری: پاک کردن دیتا پس از بارگذاری
  localStorage.removeItem("printData");
}

// ابزارهای کمکی
function escapeHtml(val) {
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function sanitizeFileName(name) {
  return String(name)
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();
}

// --- Password modal (index page) ---
function initPasswordModal() {
  const openBtn = document.getElementById("openPasswordModal");
  const modal = document.getElementById("password-modal");
  const closeBtn = document.getElementById("closePasswordModal");
  const changeBtn = document.getElementById("changePasswordBtn");
  const newPassEl = document.getElementById("newPassword");
  const msgEl = document.getElementById("passwordChangeMsg");

  if (!openBtn || !modal) return;

  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    if (msgEl) msgEl.textContent = "";
    if (newPassEl) newPassEl.value = "";
  });

  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  changeBtn?.addEventListener("click", async () => {
    if (!newPassEl || !msgEl) return;
    const newPass = newPassEl.value.trim();
    if (!newPass) {
      msgEl.textContent = "رمز خالی است!";
      return;
    }
    try {
      const ok = await ipcRenderer.invoke("change-password", newPass);
      msgEl.textContent = ok
        ? "رمز با موفقیت تغییر کرد ✅"
        : "خطا در تغییر رمز ❌";
      if (ok) newPassEl.value = "";
    } catch (err) {
      console.error("Change password error:", err);
      msgEl.textContent = "خطای داخلی ❌";
    }
  });
}
