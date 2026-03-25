import pymysql

try:
    conn = pymysql.connect(host='127.0.0.1', user='root', password='root', port=3306)
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS collab_editor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    print("Database created successfully")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
