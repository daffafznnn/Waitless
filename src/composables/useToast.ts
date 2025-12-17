import type { ToastOptions } from 'vue-toastification'

interface ToastParams {
  title: string
  description?: string
  icon?: string
  color?: 'green' | 'red' | 'blue' | 'orange' | 'yellow' | 'purple'
  timeout?: number
}

export const useToast = () => {
  const { $toast } = useNuxtApp()

  const add = ({ title, description, color = 'blue', timeout }: ToastParams) => {
    const message = description ? `${title}: ${description}` : title
    
    const options: ToastOptions = {
      timeout: timeout || 4000,
    }

    switch (color) {
      case 'green':
        $toast.success(message, options)
        break
      case 'red':
        $toast.error(message, options)
        break
      case 'orange':
      case 'yellow':
        $toast.warning(message, options)
        break
      case 'blue':
      case 'purple':
      default:
        $toast.info(message, options)
        break
    }
  }

  return {
    add
  }
}