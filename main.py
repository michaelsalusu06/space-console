import os
import sqlite3
import subprocess
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

os.chdir(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)


def init_db():
    conn = sqlite3.connect("data.db")
    with open("data.sql", "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()


def run_engines(total_astro, distance=100):
    csharp_exe = os.path.join("bin", "Debug", "net10.0", "DeepSpaceResourceTranslationMatrix.exe")
    if os.path.exists(csharp_exe):
        subprocess.run([csharp_exe, str(total_astro), str(distance)])
    subprocess.run(["java", "report"])


def get_current_state(translation=""):
    init_db()
    conn = sqlite3.connect("data.db")
    cur = conn.cursor()

    cur.execute("SELECT mass FROM Inventory WHERE material = 'Astrophage'")
    total_astro = cur.fetchone()[0]

    cur.execute("SELECT mass FROM Inventory WHERE material = 'Xenonite'")
    total_xeno = cur.fetchone()[0]

    cur.execute("SELECT phrases, translations FROM Dictionary ORDER BY phrases ASC")
    dictionary = [{"phrase": row[0], "translation": row[1]} for row in cur.fetchall()]
    conn.close()

    if not os.path.exists("pipeline.txt") or not os.path.exists("Captains_Log.txt"):
        run_engines(total_astro)

    pipeline_content = ""
    if os.path.exists("pipeline.txt"):
        with open("pipeline.txt", "r", encoding="utf-8") as pf:
            pipeline_content = pf.read().strip()

    log_content = ""
    if os.path.exists("Captains_Log.txt"):
        with open("Captains_Log.txt", "r", encoding="utf-8") as lf:
            log_content = lf.read().strip()

    return {
        "astrophage": total_astro,
        "xenonite": total_xeno,
        "dictionary": dictionary,
        "translation": translation,
        "pipeline": pipeline_content,
        "log": log_content
    }


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/style.css")
def css():
    return send_from_directory(".", "style.css")


@app.route("/script.js")
def js():
    return send_from_directory(".", "script.js")


@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory("assets", filename)


@app.route("/download-log")
def download_log():
    if not os.path.exists("Captains_Log.txt"):
        get_current_state()
    return send_from_directory(".", "Captains_Log.txt", as_attachment=True)

@app.route("/state", methods=["GET"])
def state():
    return jsonify(get_current_state())

@app.route("/update", methods=["POST"])
def update():
    init_db()
    data = request.get_json() or {}
    astrophage = int(data.get("astrophage", 0))
    xenonite = int(data.get("xenonite", 0))
    distance = int(data.get("distance", 100))
    message = str(data.get("message", "")).strip().lower()
    new_phrase = str(data.get("newPhrase", "")).strip().lower()
    new_translation = str(data.get("newTranslation", "")).strip()

    if astrophage < 0 or xenonite < 0 or distance <= 0:
        return jsonify({"error": "Fuel amounts cannot be negative and distance must be positive"}), 400

    conn = sqlite3.connect("data.db")
    cur = conn.cursor()

    cur.execute("UPDATE Inventory SET mass = mass + ? WHERE material = 'Astrophage'", (astrophage,))
    cur.execute("UPDATE Inventory SET mass = mass + ? WHERE material = 'Xenonite'", (xenonite,))

    if new_phrase and new_translation:
        cur.execute(
            "INSERT OR REPLACE INTO Dictionary (phrases, translations) VALUES (?, ?)",
            (new_phrase, new_translation)
        )

    conn.commit()

    cur.execute("SELECT mass FROM Inventory WHERE material = 'Astrophage'")
    total_astro = cur.fetchone()[0]

    translation = ""
    if message != "":
        cur.execute("SELECT translations FROM Dictionary WHERE phrases = ?", (message,))
        exact = cur.fetchone()
        if exact:
            translation = exact[0]
        else:
            words = message.split()
            translated_words = []
            for w in words:
                cur.execute("SELECT translations FROM Dictionary WHERE phrases = ?", (w,))
                row = cur.fetchone()
                if row:
                    translated_words.append(row[0])
                else:
                    translated_words.append("[" + w + "?]")
            translation = " ".join(translated_words)

        stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open("messages.txt", "a", encoding="utf-8") as mf:
            mf.write(f"[{stamp}] {message} -> {translation}\n")

    conn.close()

    run_engines(total_astro, distance)

    return jsonify(get_current_state(translation))


if __name__ == "__main__":
    init_db()
    inv = get_current_state()
    app.run(debug=True)
