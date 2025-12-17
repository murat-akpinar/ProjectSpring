import { useState, useEffect } from 'react';
import { Task } from '../types/Task';
import { taskService } from '../services/taskService';

export const useTasks = (teamId?: number, year?: number, month?: number) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await taskService.getTasks(teamId, year, month);
        setTasks(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [teamId, year, month]);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks(teamId, year, month);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  return { tasks, loading, error, refetch };
};

