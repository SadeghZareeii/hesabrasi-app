const { ipcRenderer } = require("electron");

document.getElementById("loginBtn").addEventListener("click", async () => {
  const input = document.getElementById("passwordInput").value;
  const isValid = await ipcRenderer.invoke("check-password", input);

  if (isValid) {
    location.href = "index.html";
  } else {
    document.getElementById("errorMsg").textContent = "رمز اشتباه است!";
  }
});

window.addEventListener("keyup", async (e) => {
  if (e.key === "Enter") {
    const input = document.getElementById("passwordInput").value;
    const isValid = await ipcRenderer.invoke("check-password", input);

    if (isValid) {
      location.href = "index.html";
    } else {
      document.getElementById("errorMsg").textContent = "رمز اشتباه است!";
      document.getElementById("passwordInput").value = "";
    }
  }
});

window.onload = async () => document.querySelector("input").focus();
