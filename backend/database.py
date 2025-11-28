import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect('employee_tracker.db')
    cursor = conn.cursor()
    
    # Create employees table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            department TEXT NOT NULL,
            position TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create tasks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            employee_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    
    # Insert sample data
    cursor.execute("SELECT COUNT(*) FROM employees")
    if cursor.fetchone()[0] == 0:
        # Sample employees
        employees = [
            ('John Doe', 'john.doe@company.com', 'Engineering', 'Senior Developer'),
            ('Jane Smith', 'jane.smith@company.com', 'Design', 'UX Designer'),
            ('Mike Johnson', 'mike.j@company.com', 'Engineering', 'DevOps Engineer'),
            ('Sarah Williams', 'sarah.w@company.com', 'Marketing', 'Marketing Manager'),
            ('David Brown', 'david.b@company.com', 'Engineering', 'Frontend Developer')
        ]
        
        cursor.executemany(
            'INSERT INTO employees (name, email, department, position) VALUES (?, ?, ?, ?)',
            employees
        )
        
        # Sample tasks
        tasks = [
            ('Implement user authentication', 'Add JWT-based authentication to the API', 1, 'in_progress', '2025-12-15'),
            ('Design dashboard mockups', 'Create Figma mockups for the new dashboard', 2, 'completed', '2025-12-01'),
            ('Set up CI/CD pipeline', 'Configure GitHub Actions for automated deployments', 3, 'in_progress', '2025-12-20'),
            ('Create marketing campaign', 'Launch Q4 product marketing campaign', 4, 'pending', '2025-12-30'),
            ('Fix responsive issues', 'Resolve mobile layout problems on task page', 5, 'completed', '2025-11-25'),
            ('Database optimization', 'Optimize slow queries and add indexes', 1, 'pending', '2025-12-18'),
            ('User research interviews', 'Conduct 10 user interviews for new features', 2, 'in_progress', '2025-12-10'),
            ('Security audit', 'Perform comprehensive security audit', 3, 'pending', '2026-01-05'),
            ('Social media strategy', 'Develop social media content calendar', 4, 'in_progress', '2025-12-12'),
            ('Component library', 'Build reusable React component library', 5, 'pending', '2025-12-22')
        ]
        
        cursor.executemany(
            'INSERT INTO tasks (title, description, employee_id, status, due_date) VALUES (?, ?, ?, ?, ?)',
            tasks
        )
        
        conn.commit()
    
    conn.close()
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()