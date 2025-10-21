import { create } from 'zustand';
import { getGoals, createGoal, updateGoal, deleteGoal, createCheckin, getGoalCheckins } from '../services/api';

const useGoalsStore = create((set, get) => ({
  // State
  goals: [],
  activeGoals: [],
  completedGoals: [],
  loading: false,
  error: null,

  // Actions

  /**
   * Load all goals
   */
  loadGoals: async (status) => {
    set({ loading: true, error: null });
    try {
      const goals = await getGoals(status);

      // Separate active and completed
      const activeGoals = goals.filter(g => g.status === 'active');
      const completedGoals = goals.filter(g => g.status === 'completed');

      set({
        goals,
        activeGoals,
        completedGoals,
        loading: false
      });

    } catch (error) {
      console.error('Error loading goals:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Create new goal
   */
  createGoal: async (goal, description) => {
    set({ loading: true, error: null });
    try {
      const newGoal = await createGoal(goal, description);

      set((state) => ({
        goals: [newGoal, ...state.goals],
        activeGoals: [newGoal, ...state.activeGoals],
        loading: false
      }));

      return newGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update goal (status or progress)
   */
  updateGoal: async (goalId, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedGoal = await updateGoal(goalId, updates);

      set((state) => {
        const goals = state.goals.map(g =>
          g.id === goalId ? { ...g, ...updatedGoal } : g
        );

        const activeGoals = goals.filter(g => g.status === 'active');
        const completedGoals = goals.filter(g => g.status === 'completed');

        return {
          goals,
          activeGoals,
          completedGoals,
          loading: false
        };
      });

      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Mark goal as completed
   */
  completeGoal: async (goalId) => {
    return get().updateGoal(goalId, { status: 'completed', progress: 100 });
  },

  /**
   * Update goal progress
   */
  updateProgress: async (goalId, progress) => {
    return get().updateGoal(goalId, { progress });
  },

  /**
   * Delete goal
   */
  deleteGoal: async (goalId) => {
    set({ loading: true, error: null });
    try {
      await deleteGoal(goalId);

      set((state) => {
        const goals = state.goals.filter(g => g.id !== goalId);
        const activeGoals = goals.filter(g => g.status === 'active');
        const completedGoals = goals.filter(g => g.status === 'completed');

        return {
          goals,
          activeGoals,
          completedGoals,
          loading: false
        };
      });

    } catch (error) {
      console.error('Error deleting goal:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create check-in for goal
   */
  createCheckin: async (goalId, notes, moodScore) => {
    try {
      const checkin = await createCheckin(goalId, notes, moodScore);
      return checkin;
    } catch (error) {
      console.error('Error creating check-in:', error);
      throw error;
    }
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset goals state
   */
  reset: () => {
    set({
      goals: [],
      activeGoals: [],
      completedGoals: [],
      loading: false,
      error: null
    });
  }

}));

export default useGoalsStore;
