from flask import Flask, jsonify, render_template
import psutil

app = Flask(__name__)

def get_system_info():
    net_io = psutil.net_io_counters()
    return {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
        "network_usage": (net_io.bytes_sent + net_io.bytes_recv) / (1024**2),
    }

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/system_info')
def system_info():
    return jsonify(get_system_info())

if __name__ == '__main__':
    app.run(debug=True)
