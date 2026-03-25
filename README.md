<div align="center">
  <img src="https://ssl.gstatic.com/docs/templates/thumbnails/docs-blank-googlecolors.png" width="100" />
  <h1>📝 Real-Time Collaborative Text Editor</h1>
  <p>A production-grade, Google Docs-style rich text editor allowing multiple users to instantly edit documents together seamlessly in real-time.</p>
  
  [![React](https://img.shields.io/badge/React-19-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Django](https://img.shields.io/badge/Django-6.0-092E20.svg?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
  [![Django Channels](https://img.shields.io/badge/Channels-WebSockets-red.svg?style=for-the-badge&logo=python)]()
  [![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
</div>

<br />

<img width="1918" height="493" alt="image" src="https://github.com/user-attachments/assets/36afb091-2a08-4532-949b-ecc44669df8b" />


## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| **⚡ Real-Time Collaboration** | Flawless text synchronization using Operational Transformation (`diff-match-patch`) via WebSockets to instantly resolve multi-user editing conflicts. |
| **🖱️ Multiplayer Cursors** | See exactly where other people are typing with dynamically colored, name-tagged glowing cursors exactly like Google Docs. |
| **🕒 Time Machine History** | Every 10 seconds of active typing is snapshotted to the database. Open the right-side History Drawer to view and instantly restore past versions of your document. |
| **🔐 Secure Authentication** | Django JWT token authorization locks down your documents. Only the Owner and directly invited (`Shared`) collaborators can view or edit documents. |
| **💅 Minimalist Premium UI** | A highly polished, modern interface with smooth hover transitions, blurred frosted-glass toolbars, and a clean reading view inspired by Notion and Google Docs. |

---

## 🛠️ Technology Stack Architecture

### 🌐 Frontend (Client)
- **Framework**: React 19 (via Vite)
- **Routing**: React Router DOM (v7)
- **Editor Core**: ReactQuill (`v2` Snow Theme)
- **Presence**: `quill-cursors` for live caret positions
- **Styling**: Vanilla CSS with modern Flexbox & custom Google-style presets
- **Networking**: `Axios` and Native WebSockets

### ⚙️ Backend (Server)
- **Framework**: Django 6.0 & DRF (Django REST Framework)
- **Real-Time Hub**: Django Channels + Daphne ASGI Server
- **Database**: MySQL Backend with JSONFields for incremental patches
- **Algorithm**: Google's `diff-match-patch` Python Port for Conflict Resolution Engine

<br />

<img width="1916" height="873" alt="image" src="https://github.com/user-attachments/assets/b899b048-49b1-49dc-9013-3de4a9ed6c59" />


---

## 🚀 Local Setup Guide

Follow these instructions to run the application locally.

### 1. Database & Backend Setup
Open a terminal in the `backend/` directory:

```bash
# Initialize Virtual Environment
python -m venv venv

# Activate Environment
.\venv\Scripts\activate   # Windows
source venv/bin/activate  # Mac/Linux

# Install Core Dependencies & Application Server
pip install -r requirements.txt
pip install daphne diff-match-patch

# Run Database Migrations
python manage.py makemigrations
python manage.py migrate

# Boot the Development Server (Auto-defaults to Daphne ASGI)
python manage.py runserver
```

### 2. Frontend Setup
Open a new terminal in the `frontend/` directory:

```bash
# Install NodeJS dependencies
npm install

# Start the Vite Hot-Reloading Server
npm run dev
```
Navigate your browser to `http://localhost:5173/`!

---

## 🎮 How to Collaborate
1. **Register** a new account on the startup Login page.
2. Click the central **Start a new document** card on your shiny new Dashboard.
3. Once the editor boots up, click **Share** in the top right to securely invite another registered user's username.
4. Open a second browser window, log in as the invited user, and open the document.
5. Type on both screens and watch your **cursors dance in real-time!**

<br />

<div align="center">
  <i>Designed and built for instantaneous collaboration.</i>
</div>
