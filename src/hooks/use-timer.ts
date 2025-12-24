import { useState, useEffect, useCallback, useRef } from 'react'
import { startTimeEntry, stopTimeEntry, TimeEntry } from '@/lib/time-tracking'

interface TimerState {
  isRunning: boolean
  startTime: Date | null
  elapsedSeconds: number
  currentEntry: TimeEntry | null
  taskId?: string
  projectId: string
}

interface UseTimerOptions {
  projectId: string
  taskId?: string
  description?: string
  autoSave?: boolean
}

export function useTimer(options: UseTimerOptions) {
  const { projectId, taskId, description, autoSave = true } = options

  // Estado del timer
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedSeconds: 0,
    currentEntry: null,
    taskId,
    projectId
  })

  // Refs para manejar el intervalo
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    const savedState = localStorage.getItem(`timer_${projectId}_${taskId || 'general'}`)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        if (parsed.isRunning && parsed.startTime) {
          const startTime = new Date(parsed.startTime)
          const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)

          setTimerState({
            isRunning: true,
            startTime,
            elapsedSeconds: elapsed,
            currentEntry: parsed.currentEntry || null,
            taskId: parsed.taskId,
            projectId: parsed.projectId
          })

          startTimeRef.current = startTime

          // Reiniciar el intervalo
          intervalRef.current = setInterval(() => {
            setTimerState(prev => ({
              ...prev,
              elapsedSeconds: Math.floor((Date.now() - startTime.getTime()) / 1000)
            }))
          }, 1000)
        }
      } catch (error) {
        console.error('Error loading timer state:', error)
        localStorage.removeItem(`timer_${projectId}_${taskId || 'general'}`)
      }
    }
  }, [projectId, taskId])

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Guardar estado en localStorage
  const saveStateToStorage = useCallback((state: TimerState) => {
    const storageKey = `timer_${projectId}_${taskId || 'general'}`
    localStorage.setItem(storageKey, JSON.stringify({
      ...state,
      startTime: state.startTime?.toISOString()
    }))
  }, [projectId, taskId])

  // Limpiar estado de localStorage
  const clearStateFromStorage = useCallback(() => {
    const storageKey = `timer_${projectId}_${taskId || 'general'}`
    localStorage.removeItem(storageKey)
  }, [projectId, taskId])

  // Iniciar timer
  const startTimer = useCallback(async () => {
    if (timerState.isRunning) return

    try {
      console.log('Iniciando timer para proyecto:', projectId, 'tarea:', taskId)

      const timeEntry = await startTimeEntry({
        tarea_id: taskId,
        proyecto_id: projectId,
        descripcion: description
      })

      const now = new Date()
      startTimeRef.current = now

      const newState: TimerState = {
        isRunning: true,
        startTime: now,
        elapsedSeconds: 0,
        currentEntry: timeEntry,
        taskId,
        projectId
      }

      setTimerState(newState)
      saveStateToStorage(newState)

      // Iniciar intervalo para actualizar el tiempo
      intervalRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          elapsedSeconds: Math.floor((Date.now() - now.getTime()) / 1000)
        }))
      }, 1000)

      console.log('Timer iniciado exitosamente')
    } catch (error) {
      console.error('Error starting timer:', error)
      throw error
    }
  }, [timerState.isRunning, projectId, taskId, description, saveStateToStorage])

  // Detener timer
  const stopTimer = useCallback(async () => {
    if (!timerState.isRunning || !timerState.currentEntry) return

    try {
      console.log('Deteniendo timer...')

      // Limpiar intervalo
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Detener en la base de datos
      await stopTimeEntry(timerState.currentEntry.id!)

      // Actualizar estado
      const finalState: TimerState = {
        isRunning: false,
        startTime: null,
        elapsedSeconds: 0,
        currentEntry: null,
        taskId,
        projectId
      }

      setTimerState(finalState)
      clearStateFromStorage()

      console.log('Timer detenido exitosamente')
    } catch (error) {
      console.error('Error stopping timer:', error)
      throw error
    }
  }, [timerState.isRunning, timerState.currentEntry, taskId, projectId, clearStateFromStorage])

  // Pausar timer (sin detener completamente)
  const pauseTimer = useCallback(() => {
    if (!timerState.isRunning) return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const pausedState = { ...timerState, isRunning: false }
    setTimerState(pausedState)
    saveStateToStorage(pausedState)

    console.log('Timer pausado')
  }, [timerState, saveStateToStorage])

  // Reanudar timer
  const resumeTimer = useCallback(() => {
    if (timerState.isRunning || !timerState.startTime) return

    const now = new Date()
    startTimeRef.current = now

    // Calcular tiempo transcurrido desde la pausa
    const pausedElapsed = timerState.elapsedSeconds

    const resumedState: TimerState = {
      ...timerState,
      isRunning: true,
      startTime: now
    }

    setTimerState(resumedState)
    saveStateToStorage(resumedState)

    // Reiniciar intervalo
    intervalRef.current = setInterval(() => {
      setTimerState(prev => ({
        ...prev,
        elapsedSeconds: pausedElapsed + Math.floor((Date.now() - now.getTime()) / 1000)
      }))
    }, 1000)

    console.log('Timer reanudado')
  }, [timerState, saveStateToStorage])

  // Resetear timer (sin guardar)
  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const resetState: TimerState = {
      isRunning: false,
      startTime: null,
      elapsedSeconds: 0,
      currentEntry: null,
      taskId,
      projectId
    }

    setTimerState(resetState)
    clearStateFromStorage()

    console.log('Timer reseteado')
  }, [taskId, projectId, clearStateFromStorage])

  // Formatear tiempo para display
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    // Estado
    isRunning: timerState.isRunning,
    elapsedSeconds: timerState.elapsedSeconds,
    currentEntry: timerState.currentEntry,
    formattedTime: formatTime(timerState.elapsedSeconds),

    // Acciones
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    resetTimer
  }
}


