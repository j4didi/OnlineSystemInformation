from flask import Flask, jsonify, render_template
import psutil
import time

app = Flask(__name__)

prev_net_io = psutil.net_io_counters()
prev_disk_io = psutil.disk_io_counters()
prev_time = time.time()

def get_system_info():
    global prev_net_io, prev_disk_io, prev_time

    current_net_io = psutil.net_io_counters()
    current_disk_io = psutil.disk_io_counters()
    current_time = time.time()

    time_diff = current_time - prev_time
    if time_diff == 0:
        time_diff = 1

    download_speed = (current_net_io.bytes_recv - prev_net_io.bytes_recv) / time_diff / (1024 ** 2)
    upload_speed = (current_net_io.bytes_sent - prev_net_io.bytes_sent) / time_diff / (1024 ** 2)

    read_speed = (current_disk_io.read_bytes - prev_disk_io.read_bytes) / time_diff / (1024 ** 2)
    write_speed = (current_disk_io.write_bytes - prev_disk_io.write_bytes) / time_diff / (1024 ** 2)

    prev_net_io = current_net_io
    prev_disk_io = current_disk_io
    prev_time = current_time

    return {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_read": round(read_speed, 2),
        "disk_write": round(write_speed, 2),
        "network_download": round(download_speed, 2),
        "network_upload": round(upload_speed, 2)
    }

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/system_info')
def system_info():
    return jsonify(get_system_info())

if __name__ == '__main__':
    app.run(debug=True)
