# 📄 Real-Time Collaborative Text Editor

A production-grade, Google Docs-style real-time collaborative text editor built with Django, Django Channels, React, and WebSocket Operational Transformation (OT).

![Editor Preview](https://ssl.gstatic.com/docs/templates/thumbnails/docs-blank-googlecolors.png)

## ✨ Features
*   **Real-Time Collaboration**: Flawless text synchronization using Operational Transformation (`diff-match-patch`) via WebSockets to instantly resolve multi-user editing conflicts.
*   **Live Multiplayer Cursors**: See exactly where other people are typing with dynamically colored, name-tagged glowing cursors exactly like Google Docs.
*   **Time Machine History**: Every 10 seconds of active typing is snapshotted to the database. Open the right-side History Drawer to view and instantly restore past versions of your document.
*   **Secure Authentication & Ownership**: Django JWT token authorization locks down your documents. Only the Owner and directly invited (`Shared`) collaborators can view or edit documents.
*   **Minimalist Premium UI**: A highly polished, modern interface with smooth hover transitions, blurred frosted-glass toolbars, and a clean reading view inspired by Notion and Google Docs.

## 🛠️ Tech Stack
**Frontend:**
*   React 19 (Vite)
*   React Router DOM
*   ReactQuill + Quill-Cursors
*   Tailwind / Vanilla CSS
*   Axios for REST APIs
*   Native WebSocket API hooking

**Backend:**
*   Django 6.0 + Django REST Framework
*   Django Channels + Daphne (ASGI) for WebSockets
*   Redis / InMemory Channel Layers
*   Google's `diff-match-patch` Python Port for OT

---

## 🚀 Local Setup Guide

### 1. Backend Setup
1. Open a terminal in the `backend/` directory.
2. Initialize the Python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   source venv/bin/activate  # Mac/Linux
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   pip install daphne  # Django Channels ASGI Server
   ```
4. Run the database migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
5. Start the backend development server (it will automatically boot into Daphne ASGI mode):
   ```bash
   python manage.py runserver
   ```

### 2. Frontend Setup
1. Open a new terminal in the `frontend/` directory.
2. Install the Node modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
The frontend will be available at `http://localhost:5173/`. 

## 🔒 Usage
1. First, **Register** an account on the login page.
2. You will be redirected to the Dashboard. Click the visual **Start a new document** card.
3. Once inside your new document, copy the URL or click **Share** to invite another user. Note: The target user must also have an account registered.
4. Have the invited user log in on a separate browser window and open the document. You will see their cursor pop onto your screen!

## 📜 License
MIT License.
