from flask import Flask, jsonify, render_template
import psutil
import os
import time

app = Flask(__name__)

prev_net_io = psutil.net_io_counters()
prev_disk_io = psutil.disk_io_counters()
prev_time = time.time()

prev_proc_io = {}
num_cores = psutil.cpu_count(logical=True)

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
    global prev_proc_io
    processes = []
    current_time = time.time()

    time.sleep(1)

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            p_info = proc.info
            pid = p_info['pid']
            io_counters = proc.io_counters()

            if pid in prev_proc_io:
                prev_read, prev_write, prev_proc_time = prev_proc_io[pid]
                diff_time = current_time - prev_proc_time
                if diff_time == 0:
                    diff_time = 1
                disk_read_rate = (io_counters.read_bytes - prev_read) / diff_time / (1024 ** 2)
                disk_write_rate = (io_counters.write_bytes - prev_write) / diff_time / (1024 ** 2)
            else:
                disk_read_rate = 0
                disk_write_rate = 0

            prev_proc_io[pid] = (io_counters.read_bytes, io_counters.write_bytes, current_time)

            cpu_usage = p_info['cpu_percent'] / num_cores

            processes.append({
                "pid": pid,
                "name": p_info['name'],
                "cpu_percent": round(cpu_usage, 2),
                "memory_percent": round(p_info['memory_percent'], 2),
                "disk_read": round(disk_read_rate, 2),
                "disk_write": round(disk_write_rate, 2),
                "network_download": 0,
                "network_upload": 0,
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    processes.sort(key=lambda x: x["cpu_percent"], reverse=True)
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
