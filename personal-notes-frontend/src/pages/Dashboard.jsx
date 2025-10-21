import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  ArrowLeft,
  TrendingUp,
  Calendar,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import useGoalsStore from '../store/goalsStore';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

function Dashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
  });

  const {
    goals,
    activeGoals,
    completedGoals,
    loading,
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  } = useGoalsStore();

  const { user } = useAuthStore();

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleOpenModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        description: goal.description || '',
        target_date: goal.target_date
          ? new Date(goal.target_date).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingGoal(null);
      setFormData({ title: '', description: '', target_date: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    setFormData({ title: '', description: '', target_date: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const goalData = {
      title: formData.title,
      description: formData.description || null,
      target_date: formData.target_date || null,
    };

    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData);
    } else {
      await createGoal(goalData);
    }

    handleCloseModal();
  };

  const handleDelete = async (goalId) => {
    if (window.confirm('Tem certeza que deseja excluir este objetivo?')) {
      await deleteGoal(goalId);
    }
  };

  const handleMarkComplete = async (goal) => {
    await updateGoal(goal.id, { progress: 100 });
  };

  const calculateProgress = (goal) => {
    return goal.progress || 0;
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-success-500';
    if (progress >= 50) return 'bg-warning-500';
    if (progress >= 25) return 'bg-primary-500';
    return 'bg-gray-300';
  };

  const GoalCard = ({ goal }) => {
    const progress = calculateProgress(goal);
    const progressColor = getProgressColor(progress);
    const isCompleted = progress === 100;

    return (
      <div className="bg-white dark:bg-notion-dark-sidebar rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/10 p-6 hover:shadow-md hover:border-purple-100 dark:hover:border-purple-500/30 transition-all duration-200 animate-fade-in">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3
              className={`text-lg font-semibold ${
                isCompleted ? 'text-success-700 dark:text-success-400 line-through' : 'text-gray-800 dark:text-white/90'
              }`}
            >
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-sm text-gray-600 dark:text-white/60 mt-1">{goal.description}</p>
            )}
          </div>
          <div className="flex gap-1">
            {!isCompleted && (
              <>
                <button
                  onClick={() => handleMarkComplete(goal)}
                  className="p-2 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-500/20 rounded-lg transition-colors"
                  title="Marcar como concluído"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenModal(goal)}
                  className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/20 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => handleDelete(goal.id)}
              className="p-2 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/20 rounded-lg transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/60 mb-1">
            <span>Progresso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
            <div
              className={`${progressColor} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Meta Date */}
        {goal.target_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
            <Calendar className="w-4 h-4" />
            <span>
              Meta: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}

        {/* Created Date */}
        <div className="text-xs text-gray-500 dark:text-white/40 mt-2">
          Criado em {new Date(goal.created_at).toLocaleDateString('pt-BR')}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] dark:bg-notion-dark-bg">
      {/* Header */}
      <div className="bg-white dark:bg-notion-dark-sidebar border-b border-gray-200/80 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/chat')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-white/60" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  Meus Objetivos
                </h1>
                <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                  Acompanhe seu progresso e conquistas
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-200 dark:hover:shadow-purple-900/30 transition-all duration-200 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Novo Objetivo
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-notion-dark-sidebar rounded-lg shadow dark:shadow-none dark:border dark:border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-white/60">Total de Objetivos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white/90 mt-1">
                  {goals.length}
                </p>
              </div>
              <div className="p-3 bg-primary-50 dark:bg-primary-500/20 rounded-full">
                <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-notion-dark-sidebar rounded-lg shadow dark:shadow-none dark:border dark:border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-white/60">Em Progresso</p>
                <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                  {activeGoals.length}
                </p>
              </div>
              <div className="p-3 bg-warning-50 dark:bg-warning-500/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-notion-dark-sidebar rounded-lg shadow dark:shadow-none dark:border dark:border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-white/60">Concluídos</p>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
                  {completedGoals.length}
                </p>
              </div>
              <div className="p-3 bg-success-50 dark:bg-success-500/20 rounded-full">
                <Check className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Goals List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-white/60">Carregando objetivos...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-notion-dark-sidebar rounded-lg shadow dark:shadow-none dark:border dark:border-white/10">
            <Target className="w-16 h-16 text-gray-300 dark:text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-white/70 mb-2">
              Nenhum objetivo ainda
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-6">
              Crie seu primeiro objetivo para começar a acompanhar seu progresso
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Objetivo
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                  Em Progresso ({activeGoals.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                  Concluídos ({completedGoals.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-notion-dark-sidebar rounded-xl shadow-xl dark:border dark:border-white/10 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white/90">
                {editingGoal ? 'Editar Objetivo' : 'Novo Objetivo'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-white/60" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="input-field w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-notion-dark-bg text-gray-900 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/40"
                  placeholder="Ex: Economizar para independência financeira"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-notion-dark-bg text-gray-900 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/40"
                  rows="3"
                  placeholder="Descreva seu objetivo com mais detalhes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                  Data Meta
                </label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) =>
                    setFormData({ ...formData, target_date: e.target.value })
                  }
                  className="input-field w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-notion-dark-bg text-gray-900 dark:text-white/90"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors text-gray-700 dark:text-white/70"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading
                    ? 'Salvando...'
                    : editingGoal
                    ? 'Salvar'
                    : 'Criar Objetivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
