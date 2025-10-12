# hesabrasi-app

# 📊 Hesabrasi Desktop App

A desktop accounting application built with **Electron JS**, designed to manage, edit, and print user data efficiently. This app is optimized for real-world use cases, especially in social service environments.

---

## 🚀 Getting Started

Follow these steps to install and run the project locally. <br>

### ✅ Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended) <br>
- npm (comes with Node.js) <br>
- Git (for cloning the repository) <br>

---

### 📦 Installation

#### 1. Clone the repository

```bash
git clone https://github.com/SadeghZareeii/hesabrasi-app.git
cd hesabrasi-app
```

### 2. Install dependencies

```bash
npm install
```

```bash
npm install --save-dev electron    
```

```bash
npm install --save-dev electron-builder
```

### 🛠 Build Installer

To build a Windows installer:

```bash
npm run dist     
```

#### 3. Start the application

```bash
npm start
```

### 🧩 Features

• Add, edit, delete, and search user records <br>
• Print data in A4 format with embedded fonts <br>
• Backup and restore functionality <br>
• Responsive and fast UI <br>
• Font embedding via Base64 for consistent PDF output <br>
• Device settings management (e.g. Wi-Fi, email) <br>
• Table refresh and pagination <br>
• Error handling and success messages for print operations <br>

### 📁 Project Structure

hesabrasi-app/<br>
├── assets/ # Icons and images<br>
├── css/ # Stylesheets <br>
├── renderer/ # Renderer process scripts <br>
├── index.html # Main UI <br>
├── list.html # List view <br>
├── login.html # Login screen <br>
├── main.js # Electron main process<br>
├── package.json # Project metadata <br>
├── data.json # Sample data <br>
└── README.md # Documentation <br>

### 🛠 Development Notes

• Built with Electron JS and vanilla JavaScript <br>
• UI optimized for Persian-language users <br>
• Designed for long-term maintainability and print accuracy <br>
• Compatible with Windows systems <br>

### 📌 Future Improvements

• Add user authentication <br>
• Export to Excel and PDF <br> 
• Multi-language support <br>
• Dark mode toggle <br>

### 📄 License

This project is licensed under the MIT License. See the LICENSE file for details <br>

<h1> Copyright (c) 2025 Sadegh Zarei </h1> 