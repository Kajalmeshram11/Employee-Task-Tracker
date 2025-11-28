import React, { useState, useEffect } from 'react';
import { User, CheckCircle, Clock, AlertCircle, Plus, Edit2, Trash2, Filter, BarChart3, Users } from 'lucide-react';
import './App.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend} from 'recharts';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeView, setActiveView] = useState('dashboard');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
}, [theme]);
  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);
// Chart data (depends on dashboard API)
const statusChartData = dashboard ? [
  {
    name: 'Completed',
    value: dashboard.completed_tasks || 0,
  },
  {
    name: 'In Progress',
    value: dashboard.in_progress_tasks || 0,
  },
  {
    name: 'Pending',
    value: Math.max(
      (dashboard.total_tasks || 0) -
      (dashboard.completed_tasks || 0) -
      (dashboard.in_progress_tasks || 0),
      0
    ),
  },
] : [];

const employeeChartData = dashboard
  ? dashboard.tasks_by_employee.map((emp) => ({
      name: emp.employee_name,
      tasks: emp.task_count,
    }))
  : [];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empRes, taskRes, dashRes] = await Promise.all([
        fetch(`${API_BASE_URL}/employees`),
        fetch(`${API_BASE_URL}/tasks`),
        fetch(`${API_BASE_URL}/dashboard`)
      ]);

      if (!empRes.ok || !taskRes.ok || !dashRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const empData = await empRes.json();
      const taskData = await taskRes.json();
      const dashData = await dashRes.json();

      setEmployees(empData);
      setTasks(taskData);
      setDashboard(dashData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running on port 5000.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (!res.ok) throw new Error('Failed to add task');

      await fetchAllData();
      setShowTaskModal(false);
    } catch (err) {
      alert('Error adding task: ' + err.message);
    }
  };

  const handleUpdateTask = async (id, taskData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (!res.ok) throw new Error('Failed to update task');

      await fetchAllData();
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

const handleDeleteTask = async (id) => {
  if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete task');

      await fetchAllData();
    } catch (err) {
      alert('Error deleting task: ' + err.message);
    }
  };

  const handleAddEmployee = async (empData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData)
      });

      if (!res.ok) throw new Error('Failed to add employee');

      await fetchAllData();
      setShowEmployeeModal(false);
    } catch (err) {
      alert('Error adding employee: ' + err.message);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const employeeMatch = selectedEmployee === 'all' || task.employee_id === parseInt(selectedEmployee);
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    return employeeMatch && statusMatch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-center mb-4">
            <AlertCircle className="w-16 h-16 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Connection Error</h2>
          </div>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-indigo-600">Employee Task Tracker</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-5 h-5 inline mr-2" />
                Dashboard
              </button>
              <button
  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
  className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 hover:bg-gray-200"
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}
>
  {theme === 'light' ? '🌙' : '☀️'}
  {theme === 'light' ? 'Dark' : 'Light'}
</button>
              <button
                onClick={() => setActiveView('tasks')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'tasks'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Tasks
              </button>
              <button
                onClick={() => setActiveView('employees')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'employees'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Employees
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeView === 'dashboard' && dashboard && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Tasks"
                value={dashboard.total_tasks}
                icon={<CheckCircle className="w-8 h-8" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Completed"
                value={dashboard.completed_tasks}
                icon={<CheckCircle className="w-8 h-8" />}
                color="bg-green-500"
              />
              <StatCard
                title="In Progress"
                value={dashboard.in_progress_tasks}
                icon={<Clock className="w-8 h-8" />}
                color="bg-yellow-500"
              />
              <StatCard
                title="Completion Rate"
                value={`${dashboard.completion_rate}%`}
                icon={<BarChart3 className="w-8 h-8" />}
                color="bg-indigo-500"
              />
            </div>
<div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-xl font-bold text-gray-800 mb-4">
    Tasks by Status
  </h3>

  <div className="h-72">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={statusChartData}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        {/* Soft Grid */}
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" vertical={false} />

        {/* Axis */}
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />

        {/* Smooth Tooltip */}
     <Tooltip
  cursor={{ fill: "rgba(255,255,255,0.08)" }}
  contentStyle={{
    background: "#ffffff",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
  }}
  labelStyle={{
    color: "#111827",   // "Completed"
    fontWeight: 600,
  }}
  itemStyle={{
    color: "#111827",   // "value : 2"
    fontSize: 12,
  }}
/>
        <Legend />

        {/* 🔥 Gradient Definition */}
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>

          <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>

          <linearGradient id="grad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>

        {/* 🔥 Stylish Gradient Bars */}
        <Bar
          dataKey="value"
          radius={[10, 10, 0, 0]}
          fill="url(#grad1)"
          animationDuration={900}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Tasks by Employee</h3>
                <div className="space-y-3">
                  {dashboard.tasks_by_employee.map(emp => (
                    <div key={emp.employee_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{emp.employee_name}</span>
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {emp.task_count} tasks
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Tasks</h3>
                <div className="space-y-3">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <p className="font-medium text-gray-800">{task.title}</p>
                          <p className="text-sm text-gray-500">{task.employee_name}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'tasks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Task Management</h2>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filter by Employee
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Employees</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filter by Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No tasks found</p>
                ) : (
                  filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => {
                        setEditingTask(task);
                        setShowTaskModal(true);
                      }}
                      onDelete={() => handleDeleteTask(task.id)}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'employees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
              <button
                onClick={() => setShowEmployeeModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Employee
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map(emp => {
                const empTasks = tasks.filter(t => t.employee_id === emp.id);
                const completed = empTasks.filter(t => t.status === 'completed').length;
                
                return (
                  <div key={emp.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-indigo-100 rounded-full p-3">
                        <User className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{emp.name}</h3>
                        <p className="text-gray-600">{emp.email}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-1">Department: <span className="font-medium">{emp.department}</span></p>
                      <p className="text-sm text-gray-600 mb-1">Position: <span className="font-medium">{emp.position}</span></p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tasks: {empTasks.length}</span>
                        <span className="text-sm text-gray-600">Completed: {completed}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          employees={employees}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSubmit={(data) => {
            if (editingTask) {
              handleUpdateTask(editingTask.id, data);
            } else {
              handleAddTask(data);
            }
          }}
        />
      )}

      {/* Employee Modal */}
      {showEmployeeModal && (
        <EmployeeModal
          onClose={() => setShowEmployeeModal(false)}
          onSubmit={handleAddEmployee}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
      </div>
      <div className={`${color} text-white p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

const TaskCard = ({ task, onEdit, onDelete, getStatusIcon, getStatusColor }) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3 flex-1">
        {getStatusIcon(task.status)}
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-lg">{task.title}</h3>
          <p className="text-gray-600 text-sm mt-1">{task.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm text-gray-500">
              <User className="w-4 h-4 inline mr-1" />
              {task.employee_name}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
            {task.due_date && (
              <span className="text-sm text-gray-500">
                <Clock className="w-4 h-4 inline mr-1" />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
);

const TaskModal = ({ task, employees, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    employee_id: task?.employee_id || '',
    status: task?.status || 'pending',
    due_date: task?.due_date || ''
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {task ? 'Edit Task' : 'Add New Task'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Employee</label>
            <select
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {task ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: ''
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Employee</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <input
              type="text"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;