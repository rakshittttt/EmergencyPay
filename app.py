
from flask import Flask, request, jsonify, render_template, session, send_from_directory
from flask_socketio import SocketIO, emit
import os
import json
import sqlite3
import hashlib
import secrets
from datetime import datetime
import threading
import time

app = Flask(__name__, 
           static_folder='dist/public',
           template_folder='dist/public')
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', 'dev-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*")

# Database setup
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            balance REAL DEFAULT 1000.0,
            emergency_balance REAL DEFAULT 500.0,
            keypair TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER,
            receiver_id INTEGER,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            transaction_type TEXT DEFAULT 'online',
            description TEXT,
            signature TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (receiver_id) REFERENCES users (id)
        )
    ''')
    
    # Merchants table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS merchants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            category TEXT,
            is_essential BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Insert default user and merchants
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO users (name, phone, balance, emergency_balance) 
            VALUES (?, ?, ?, ?)
        ''', ('Rahul Kumar', '9876543210', 2500.0, 500.0))
        
        cursor.execute('''
            INSERT INTO users (name, phone, balance, emergency_balance) 
            VALUES (?, ?, ?, ?)
        ''', ('MedPlus Pharmacy', '9876543211', 5000.0, 1000.0))
        
        cursor.execute('''
            INSERT INTO merchants (user_id, name, category, is_essential) 
            VALUES (?, ?, ?, ?)
        ''', (2, 'MedPlus Pharmacy', 'Healthcare', 1))
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# Connection status management
CONNECTION_STATUS_FILE = 'connection-status.json'

def load_connection_status():
    try:
        with open(CONNECTION_STATUS_FILE, 'r') as f:
            data = json.load(f)
            return data.get('status', 'online')
    except:
        return 'online'

def save_connection_status(status):
    with open(CONNECTION_STATUS_FILE, 'w') as f:
        json.dump({'status': status}, f)

# Routes
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/user')
def get_user():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = 1')
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'id': user[0],
            'name': user[1],
            'phone': user[2],
            'balance': user[3],
            'emergency_balance': user[4]
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/merchants')
def get_merchants():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT m.id, m.user_id, m.name, m.category, m.is_essential 
        FROM merchants m
    ''')
    merchants = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': m[0],
        'user_id': m[1],
        'name': m[2],
        'category': m[3],
        'is_essential': bool(m[4])
    } for m in merchants])

@app.route('/api/transactions/<int:user_id>')
def get_transactions(user_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.*, u1.name as sender_name, u2.name as receiver_name
        FROM transactions t
        LEFT JOIN users u1 ON t.sender_id = u1.id
        LEFT JOIN users u2 ON t.receiver_id = u2.id
        WHERE t.sender_id = ? OR t.receiver_id = ?
        ORDER BY t.created_at DESC
    ''', (user_id, user_id))
    transactions = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': t[0],
        'sender_id': t[1],
        'receiver_id': t[2],
        'amount': t[3],
        'status': t[4],
        'transaction_type': t[5],
        'description': t[6],
        'created_at': t[8],
        'sender_name': t[9],
        'receiver_name': t[10]
    } for t in transactions])

@app.route('/api/transaction', methods=['POST'])
def create_transaction():
    data = request.json
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Insert transaction
    cursor.execute('''
        INSERT INTO transactions (sender_id, receiver_id, amount, status, transaction_type, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data['sender_id'],
        data['receiver_id'],
        data['amount'],
        data.get('status', 'completed'),
        data.get('transaction_type', 'online'),
        data.get('description', '')
    ))
    
    transaction_id = cursor.lastrowid
    
    # Update balances
    if data.get('status') == 'completed':
        cursor.execute('UPDATE users SET balance = balance - ? WHERE id = ?', 
                      (data['amount'], data['sender_id']))
        cursor.execute('UPDATE users SET balance = balance + ? WHERE id = ?', 
                      (data['amount'], data['receiver_id']))
    
    conn.commit()
    conn.close()
    
    # Emit real-time update
    socketio.emit('transaction_update', {
        'transaction_id': transaction_id,
        'status': data.get('status', 'completed')
    })
    
    return jsonify({'id': transaction_id, 'status': 'success'})

@app.route('/api/system/network-status')
def get_network_status():
    status = load_connection_status()
    return jsonify({'status': status})

@app.route('/api/system/network-status', methods=['POST'])
def set_network_status():
    data = request.json
    status = data.get('status', 'online')
    save_connection_status(status)
    
    # Emit to all connected clients
    socketio.emit('network_status_changed', {'status': status})
    
    return jsonify({'status': status})

@app.route('/api/bluetooth/scan', methods=['POST'])
def bluetooth_scan():
    # Simulate bluetooth device discovery
    devices = [
        {'id': 'device_1', 'name': 'Priya Sharma', 'distance': 2.3},
        {'id': 'device_2', 'name': 'Amit Patel', 'distance': 4.1},
        {'id': 'device_3', 'name': 'Deepak Store', 'distance': 1.8}
    ]
    return jsonify(devices)

@app.route('/api/bluetooth/payment', methods=['POST'])
def bluetooth_payment():
    data = request.json
    
    # Simulate offline payment processing
    transaction_data = {
        'id': secrets.randbelow(10000),
        'sender_id': data['sender_id'],
        'receiver_id': data.get('receiver_id', 999),  # Mock receiver
        'amount': data['amount'],
        'status': 'pending_sync',
        'transaction_type': 'bluetooth',
        'description': f"Bluetooth payment to {data.get('receiver_name', 'Unknown')}"
    }
    
    # Store in database
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO transactions (sender_id, receiver_id, amount, status, transaction_type, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        transaction_data['sender_id'],
        transaction_data['receiver_id'],
        transaction_data['amount'],
        transaction_data['status'],
        transaction_data['transaction_type'],
        transaction_data['description']
    ))
    conn.commit()
    conn.close()
    
    return jsonify(transaction_data)

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    print(f'Socket connected: {request.sid}')
    emit('network_status', {'status': load_connection_status()})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Socket disconnected: {request.sid}')

# Serve static files
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 3000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)
