import React, { useState, useEffect } from 'react';
import { Plus, Target, Flame, Calendar, Trash2, Edit3, Bell, BellOff, Trophy, TrendingUp, CheckCircle2 } from 'lucide-react';

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabit, setNewHabit] = useState({ name: '', description: '', category: 'health', target: 1 });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = {
    health: { color: 'bg-green-500', icon: '💪', label: 'Health' },
    productivity: { color: 'bg-blue-500', icon: '⚡', label: 'Productivity' },
    learning: { color: 'bg-purple-500', icon: '📚', label: 'Learning' },
    mindfulness: { color: 'bg-indigo-500', icon: '🧘', label: 'Mindfulness' },
    social: { color: 'bg-pink-500', icon: '👥', label: 'Social' },
    creative: { color: 'bg-orange-500', icon: '🎨', label: 'Creative' }
  };

  // Initialize data from memory
  useEffect(() => {
    const savedHabits = JSON.parse(localStorage?.getItem('habits') || '[]');
    if (savedHabits.length > 0) {
      setHabits(savedHabits);
    } else {
      // Demo data
      setHabits([
        {
          id: 1,
          name: 'Drink Water',
          description: 'Drink 8 glasses of water daily',
          category: 'health',
          target: 8,
          completions: { '2025-08-01': 6, '2025-08-02': 8, '2025-08-03': 7, '2025-08-04': 8, '2025-08-05': 3 },
          createdAt: '2025-08-01'
        },
        {
          id: 2,
          name: 'Read',
          description: 'Read for 30 minutes',
          category: 'learning',
          target: 1,
          completions: { '2025-08-01': 1, '2025-08-02': 1, '2025-08-04': 1, '2025-08-05': 0 },
          createdAt: '2025-08-01'
        },
        {
          id: 3,
          name: 'Exercise',
          description: 'Complete workout routine',
          category: 'health',
          target: 1,
          completions: { '2025-08-01': 1, '2025-08-02': 1, '2025-08-03': 1, '2025-08-05': 0 },
          createdAt: '2025-08-01'
        }
      ]);
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Save to memory whenever habits change
  useEffect(() => {
    if (habits.length > 0) {
      localStorage?.setItem('habits', JSON.stringify(habits));
    }
  }, [habits]);

  // Calculate streak for a habit
  const calculateStreak = (habit) => {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const completion = habit.completions[dateStr] || 0;
      
      if (completion >= habit.target) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (dateStr === today.toISOString().split('T')[0]) {
        // Today hasn't been completed yet, but don't break streak
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
      
      if (streak > 365) break; // Safety check
    }
    
    return streak;
  };

  // Calculate best streak
  const calculateBestStreak = (habit) => {
    const dates = Object.keys(habit.completions).sort();
    let bestStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < dates.length; i++) {
      const completion = habit.completions[dates[i]] || 0;
      
      if (completion >= habit.target) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return bestStreak;
  };

  // Add new habit
  const addHabit = () => {
    if (newHabit.name.trim()) {
      const habit = {
        id: Date.now(),
        ...newHabit,
        completions: {},
        createdAt: currentDate
      };
      setHabits([...habits, habit]);
      setNewHabit({ name: '', description: '', category: 'health', target: 1 });
      setShowAddForm(false);
    }
  };

  // Update habit
  const updateHabit = (id, updates) => {
    setHabits(habits.map(h => h.id === id ? { ...h, ...updates } : h));
    setEditingHabit(null);
  };

  // Delete habit
  const deleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  // Update completion for today
  const updateCompletion = (habitId, value) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const updatedCompletions = { ...habit.completions };
        updatedCompletions[currentDate] = Math.max(0, value);
        return { ...habit, completions: updatedCompletions };
      }
      return habit;
    }));
  };

  // Request notification permission
  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        // Schedule daily reminders
        scheduleNotifications();
      }
    }
  };

  // Schedule notifications (simplified - in real app would use Service Worker)
  const scheduleNotifications = () => {
    if (notificationsEnabled) {
      setTimeout(() => {
        new Notification('Habit Reminder', {
          body: 'Don\'t forget to track your habits today!',
          icon: '🎯',
          badge: '🎯'
        });
      }, 5000); // Demo notification after 5 seconds
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = (habit) => {
    const today = habit.completions[currentDate] || 0;
    return Math.min(100, (today / habit.target) * 100);
  };

  // Get total stats
  const getTotalStats = () => {
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => (h.completions[currentDate] || 0) >= h.target).length;
    const totalStreaks = habits.reduce((sum, h) => sum + calculateStreak(h), 0);
    const longestStreak = Math.max(...habits.map(h => calculateBestStreak(h)), 0);
    
    return { totalHabits, completedToday, totalStreaks, longestStreak };
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="text-indigo-600" size={32} />
                Habit Tracker
              </h1>
              <p className="text-gray-600 mt-1">Build better habits, one day at a time</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : requestNotifications}
                className={`p-2 rounded-lg transition-all ${
                  notificationsEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
              >
                {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
              </button>
              
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Add Habit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Habits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHabits}</p>
              </div>
              <Target className="text-indigo-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Done Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Streaks</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalStreaks}</p>
              </div>
              <Flame className="text-orange-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Streak</p>
                <p className="text-2xl font-bold text-purple-600">{stats.longestStreak}</p>
              </div>
              <Trophy className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="text-gray-600" size={20} />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-600">
              {currentDate === new Date().toISOString().split('T')[0] ? 'Today' : 'Historical'}
            </span>
          </div>
        </div>

        {/* Habits List */}
        <div className="space-y-4">
          {habits.map(habit => {
            const currentCompletion = habit.completions[currentDate] || 0;
            const completionPercentage = getCompletionPercentage(habit);
            const currentStreak = calculateStreak(habit);
            const bestStreak = calculateBestStreak(habit);
            const category = categories[habit.category];
            const isCompleted = currentCompletion >= habit.target;

            return (
              <div key={habit.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full ${category.color} mt-2`}></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{habit.name}</h3>
                      {habit.description && (
                        <p className="text-gray-600 text-sm mt-1">{habit.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {category.icon} {category.label}
                        </span>
                        <span className="text-xs text-gray-500">Target: {habit.target}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progress: {currentCompletion}/{habit.target}
                    </span>
                    <span className="text-sm text-gray-500">{completionPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Controls and Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCompletion(habit.id, currentCompletion - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors flex items-center justify-center"
                        disabled={currentCompletion <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{currentCompletion}</span>
                      <button
                        onClick={() => updateCompletion(habit.id, currentCompletion + 1)}
                        className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    
                    {isCompleted && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-medium">Complete!</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Flame size={16} className="text-orange-500" />
                      <span>{currentStreak} day streak</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={16} className="text-purple-500" />
                      <span>Best: {bestStreak}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {habits.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No habits yet</h3>
            <p className="text-gray-500 mb-4">Start building better habits today!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Your First Habit
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Habit Modal */}
      {(showAddForm || editingHabit) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingHabit ? 'Edit Habit' : 'Add New Habit'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Habit Name</label>
                <input
                  type="text"
                  value={editingHabit ? editingHabit.name : newHabit.name}
                  onChange={(e) => editingHabit 
                    ? setEditingHabit({ ...editingHabit, name: e.target.value })
                    : setNewHabit({ ...newHabit, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Drink water, Exercise, Read"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={editingHabit ? editingHabit.description : newHabit.description}
                  onChange={(e) => editingHabit 
                    ? setEditingHabit({ ...editingHabit, description: e.target.value })
                    : setNewHabit({ ...newHabit, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="2"
                  placeholder="Brief description of your habit"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editingHabit ? editingHabit.category : newHabit.category}
                  onChange={(e) => editingHabit 
                    ? setEditingHabit({ ...editingHabit, category: e.target.value })
                    : setNewHabit({ ...newHabit, category: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(categories).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Target</label>
                <input
                  type="number"
                  min="1"
                  value={editingHabit ? editingHabit.target : newHabit.target}
                  onChange={(e) => editingHabit 
                    ? setEditingHabit({ ...editingHabit, target: parseInt(e.target.value) || 1 })
                    : setNewHabit({ ...newHabit, target: parseInt(e.target.value) || 1 })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (editingHabit) {
                    updateHabit(editingHabit.id, editingHabit);
                  } else {
                    addHabit();
                  }
                }}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingHabit ? 'Update' : 'Add'} Habit
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingHabit(null);
                  setNewHabit({ name: '', description: '', category: 'health', target: 1 });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;