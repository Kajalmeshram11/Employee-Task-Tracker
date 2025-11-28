from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from datetime import datetime
from database import init_db

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Database helper
def get_db_connection():
    conn = sqlite3.connect('employee_tracker.db')
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database on startup
with app.app_context():
    init_db()

# ============ EMPLOYEE ENDPOINTS ============

@app.route('/api/employees', methods=['GET'])
def get_employees():
    """Get all employees"""
    conn = get_db_connection()
    employees = conn.execute('SELECT * FROM employees ORDER BY name').fetchall()
    conn.close()
    return jsonify([dict(emp) for emp in employees])

@app.route('/api/employees/<int:id>', methods=['GET'])
def get_employee(id):
    """Get a specific employee"""
    conn = get_db_connection()
    employee = conn.execute('SELECT * FROM employees WHERE id = ?', (id,)).fetchone()
    conn.close()
    
    if employee is None:
        return jsonify({'error': 'Employee not found'}), 404
    
    return jsonify(dict(employee))

@app.route('/api/employees', methods=['POST'])
def create_employee():
    """Create a new employee"""
    data = request.get_json()
    
    # Validation
    required_fields = ['name', 'email', 'department', 'position']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            'INSERT INTO employees (name, email, department, position) VALUES (?, ?, ?, ?)',
            (data['name'], data['email'], data['department'], data['position'])
        )
        conn.commit()
        employee_id = cursor.lastrowid
        
        # Fetch and return the created employee
        employee = conn.execute('SELECT * FROM employees WHERE id = ?', (employee_id,)).fetchone()
        conn.close()
        
        return jsonify(dict(employee)), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 400

# ============ TASK ENDPOINTS ============

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks with employee information"""
    conn = get_db_connection()
    tasks = conn.execute('''
        SELECT t.*, e.name as employee_name 
        FROM tasks t
        JOIN employees e ON t.employee_id = e.id
        ORDER BY t.created_at DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(task) for task in tasks])

@app.route('/api/tasks/<int:id>', methods=['GET'])
def get_task(id):
    """Get a specific task"""
    conn = get_db_connection()
    task = conn.execute('''
        SELECT t.*, e.name as employee_name 
        FROM tasks t
        JOIN employees e ON t.employee_id = e.id
        WHERE t.id = ?
    ''', (id,)).fetchone()
    conn.close()
    
    if task is None:
        return jsonify({'error': 'Task not found'}), 404
    
    return jsonify(dict(task))

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    data = request.get_json()
    
    # Validation
    required_fields = ['title', 'description', 'employee_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate employee exists
    conn = get_db_connection()
    employee = conn.execute('SELECT * FROM employees WHERE id = ?', (data['employee_id'],)).fetchone()
    if employee is None:
        conn.close()
        return jsonify({'error': 'Employee not found'}), 404
    
    # Set defaults
    status = data.get('status', 'pending')
    due_date = data.get('due_date', None)
    
    cursor = conn.execute(
        'INSERT INTO tasks (title, description, employee_id, status, due_date) VALUES (?, ?, ?, ?, ?)',
        (data['title'], data['description'], data['employee_id'], status, due_date)
    )
    conn.commit()
    task_id = cursor.lastrowid
    
    # Fetch and return the created task
    task = conn.execute('''
        SELECT t.*, e.name as employee_name 
        FROM tasks t
        JOIN employees e ON t.employee_id = e.id
        WHERE t.id = ?
    ''', (task_id,)).fetchone()
    conn.close()
    
    return jsonify(dict(task)), 201

@app.route('/api/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    """Update an existing task"""
    data = request.get_json()
    
    conn = get_db_connection()
    
    # Check if task exists
    task = conn.execute('SELECT * FROM tasks WHERE id = ?', (id,)).fetchone()
    if task is None:
        conn.close()
        return jsonify({'error': 'Task not found'}), 404
    
    # If employee_id is being updated, validate it exists
    if 'employee_id' in data:
        employee = conn.execute('SELECT * FROM employees WHERE id = ?', (data['employee_id'],)).fetchone()
        if employee is None:
            conn.close()
            return jsonify({'error': 'Employee not found'}), 404
    
    # Build update query dynamically
    update_fields = []
    values = []
    
    allowed_fields = ['title', 'description', 'employee_id', 'status', 'due_date']
    for field in allowed_fields:
        if field in data:
            update_fields.append(f'{field} = ?')
            values.append(data[field])
    
    if not update_fields:
        conn.close()
        return jsonify({'error': 'No valid fields to update'}), 400
    
    # Add updated_at
    update_fields.append('updated_at = ?')
    values.append(datetime.now().isoformat())
    
    # Add id for WHERE clause
    values.append(id)
    
    query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = ?"
    conn.execute(query, values)
    conn.commit()
    
    # Fetch and return updated task
    task = conn.execute('''
        SELECT t.*, e.name as employee_name 
        FROM tasks t
        JOIN employees e ON t.employee_id = e.id
        WHERE t.id = ?
    ''', (id,)).fetchone()
    conn.close()
    
    return jsonify(dict(task))

@app.route('/api/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    """Delete a task"""
    conn = get_db_connection()
    
    # Check if task exists
    task = conn.execute('SELECT * FROM tasks WHERE id = ?', (id,)).fetchone()
    if task is None:
        conn.close()
        return jsonify({'error': 'Task not found'}), 404
    
    conn.execute('DELETE FROM tasks WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Task deleted successfully'}), 200

# ============ DASHBOARD ENDPOINT ============

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard statistics"""
    conn = get_db_connection()
    
    # Total tasks
    total_tasks = conn.execute('SELECT COUNT(*) as count FROM tasks').fetchone()['count']
    
    # Completed tasks
    completed_tasks = conn.execute(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'"
    ).fetchone()['count']
    
    # In progress tasks
    in_progress_tasks = conn.execute(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'"
    ).fetchone()['count']
    
    # Pending tasks
    pending_tasks = conn.execute(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'"
    ).fetchone()['count']
    
    # Completion rate
    completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    
    # Tasks by employee
    tasks_by_employee = conn.execute('''
        SELECT e.id as employee_id, e.name as employee_name, COUNT(t.id) as task_count
        FROM employees e
        LEFT JOIN tasks t ON e.id = t.employee_id
        GROUP BY e.id, e.name
        ORDER BY task_count DESC
    ''').fetchall()
    
    conn.close()
    
    return jsonify({
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'in_progress_tasks': in_progress_tasks,
        'pending_tasks': pending_tasks,
        'completion_rate': completion_rate,
        'tasks_by_employee': [dict(row) for row in tasks_by_employee]
    })

# ============ ERROR HANDLERS ============

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============ RUN SERVER ============

if __name__ == '__main__':
    print("🚀 Starting Employee Task Tracker API...")
    print("📊 Server running on http://localhost:5000")
    print("📚 API Documentation:")
    print("   GET    /api/employees      - Get all employees")
    print("   POST   /api/employees      - Create employee")
    print("   GET    /api/tasks          - Get all tasks")
    print("   POST   /api/tasks          - Create task")
    print("   PUT    /api/tasks/:id      - Update task")
    print("   DELETE /api/tasks/:id      - Delete task")
    print("   GET    /api/dashboard      - Get dashboard stats")
    app.run(debug=True, port=5000)