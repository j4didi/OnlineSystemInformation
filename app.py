
from flask import Flask, jsonify, render_template
import psutil
import os
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

def get_processes():
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            p_info = proc.info
            io_counters = proc.io_counters()
            network_usage = sum(conn.status == 'ESTABLISHED' for conn in proc.connections(kind='inet'))

            processes.append({
                "pid": p_info['pid'],
                "name": p_info['name'],
                "cpu_percent": p_info['cpu_percent'],
                "memory_percent": p_info['memory_percent'],
                "disk_usage": round(io_counters.read_bytes / (1024 ** 2), 2),  # مصرف دیسک
                "network_usage": round(network_usage / (1024 ** 2), 2),  # مصرف شبکه
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    return processes


@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/system_info')
def system_info():
    return jsonify(get_system_info())

@app.route('/api/processes')
def processes():
    return jsonify(get_processes())

@app.route('/api/end_task/<int:pid>', methods=['POST'])
def end_task(pid):
    try:
        os.kill(pid, 9)
        return jsonify({"message": f"Process {pid} terminated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
