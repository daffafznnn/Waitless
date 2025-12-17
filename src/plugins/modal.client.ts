export interface AlertOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmText?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
  autoClose?: number
}

export interface ConfirmOptions {
  title?: string
  message: string
  type?: 'info' | 'warning' | 'error' | 'danger'
  confirmText?: string
  cancelText?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
}

interface ModalConfig {
  content: string
  actions: string
  type: string
  size: string
  closable: boolean
  autoClose?: number
}

class ModalService {
  private createModal(config: ModalConfig): Promise<boolean> {
    return new Promise((resolve) => {
      const { content, actions, type, size, closable, autoClose } = config
      
      // Create backdrop with initial opacity 0 for animation
      const backdrop = document.createElement('div')
      backdrop.className = 'fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out'
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0)'
      
      // Create modal container with transform for animation
      const modalContainer = document.createElement('div')
      modalContainer.className = 'transform transition-all duration-300 ease-out scale-95 opacity-0'
      
      // Create modal with proper sizing
      const modal = document.createElement('div')
      const modalSizeClass = this.getModalSizeClass(size)
      modal.className = `bg-white rounded-xl shadow-2xl ${modalSizeClass} mx-4 overflow-hidden border border-gray-100`
      
      // Get colors and styling based on type
      const colors = this.getTypeColors(type)
      
      modal.innerHTML = `
        <div class="relative">
          ${closable ? this.getCloseButton() : ''}
          <div class="p-6">
            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                ${this.getIcon(type, colors)}
              </div>
              <div class="flex-1">
                ${content}
              </div>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
              ${actions}
            </div>
          </div>
        </div>
      `
      
      modalContainer.appendChild(modal)
      backdrop.appendChild(modalContainer)
      document.body.appendChild(backdrop)
      document.body.style.overflow = 'hidden'
      
      // Animate in
      requestAnimationFrame(() => {
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
        modalContainer.classList.remove('scale-95', 'opacity-0')
        modalContainer.classList.add('scale-100', 'opacity-100')
      })
      
      // Auto close timer
      let autoCloseTimer: NodeJS.Timeout | null = null
      if (autoClose && autoClose > 0) {
        autoCloseTimer = setTimeout(() => {
          handleClose(true)
        }, autoClose)
      }
      
      // Handle close with animation
      const handleClose = (result: boolean) => {
        if (autoCloseTimer) {
          clearTimeout(autoCloseTimer)
        }
        
        // Animate out
        modalContainer.classList.remove('scale-100', 'opacity-100')
        modalContainer.classList.add('scale-95', 'opacity-0')
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0)'
        
        setTimeout(() => {
          document.body.removeChild(backdrop)
          document.body.style.overflow = ''
          resolve(result)
        }, 300)
      }
      
      // Handle backdrop click
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop && closable) {
          handleClose(false)
        }
      })
      
      // Handle close button
      const closeBtn = modal.querySelector('[data-action="close"]')
      closeBtn?.addEventListener('click', () => handleClose(false))
      
      // Handle action buttons
      const confirmBtn = modal.querySelector('[data-action="confirm"]')
      const cancelBtn = modal.querySelector('[data-action="cancel"]')
      
      confirmBtn?.addEventListener('click', () => handleClose(true))
      cancelBtn?.addEventListener('click', () => handleClose(false))
      
      // Focus management
      if (confirmBtn) {
        setTimeout(() => (confirmBtn as HTMLElement).focus(), 100)
      }
      
      // Handle ESC key
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closable) {
          document.removeEventListener('keydown', handleKeydown)
          handleClose(false)
        }
      }
      document.addEventListener('keydown', handleKeydown)
    })
  }
  
  private getModalSizeClass(size: string): string {
    const sizeMap = {
      sm: 'max-w-sm w-full',
      md: 'max-w-md w-full',
      lg: 'max-w-lg w-full',
      xl: 'max-w-xl w-full'
    }
    return sizeMap[size as keyof typeof sizeMap] || sizeMap.md
  }
  
  private getCloseButton(): string {
    return `
      <button 
        data-action="close"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
        aria-label="Close modal"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `
  }
  
  private getTypeColors(type: string) {
    const colorMap = {
      info: {
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
        confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        borderColor: 'border-blue-200'
      },
      success: {
        iconColor: 'text-green-600',
        iconBg: 'bg-green-100',
        confirmBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        borderColor: 'border-green-200'
      },
      warning: {
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        confirmBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        borderColor: 'border-yellow-200'
      },
      error: {
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
        confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        borderColor: 'border-red-200'
      },
      danger: {
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
        confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        borderColor: 'border-red-200'
      }
    }
    return colorMap[type as keyof typeof colorMap] || colorMap.info
  }
  
  private getIcon(type: string, colors: any) {
    const iconMap = {
      info: `
        <div class="w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center">
          <svg class="w-6 h-6 ${colors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      `,
      success: `
        <div class="w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center">
          <svg class="w-6 h-6 ${colors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      `,
      warning: `
        <div class="w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center">
          <svg class="w-6 h-6 ${colors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
      `,
      error: `
        <div class="w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center">
          <svg class="w-6 h-6 ${colors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      `,
      danger: `
        <div class="w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center">
          <svg class="w-6 h-6 ${colors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
      `
    }
    return iconMap[type as keyof typeof iconMap] || iconMap.info
  }
  
  alert(options: AlertOptions): Promise<boolean> {
    const { 
      title = 'Pemberitahuan', 
      message, 
      type = 'info', 
      confirmText = 'OK',
      size = 'md',
      closable = true,
      autoClose
    } = options
    
    const colors = this.getTypeColors(type)
    
    const content = `
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-3">${title}</h3>
        <p class="text-gray-600 leading-relaxed">${message}</p>
      </div>
    `
    
    const actions = `
      <button 
        data-action="confirm"
        class="px-6 py-2.5 text-sm font-medium text-white rounded-lg ${colors.confirmBg} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
      >
        ${confirmText}
      </button>
    `
    
    return this.createModal({
      content,
      actions,
      type,
      size,
      closable,
      autoClose
    })
  }
  
  confirm(options: ConfirmOptions): Promise<boolean> {
    const { 
      title = 'Konfirmasi', 
      message, 
      type = 'warning', 
      confirmText = 'Ya', 
      cancelText = 'Batal',
      size = 'md',
      closable = true
    } = options
    
    const colors = this.getTypeColors(type)
    
    const content = `
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-3">${title}</h3>
        <p class="text-gray-600 leading-relaxed">${message}</p>
      </div>
    `
    
    const actions = `
      <button 
        data-action="cancel"
        class="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105"
      >
        ${cancelText}
      </button>
      <button 
        data-action="confirm"
        class="px-6 py-2.5 text-sm font-medium text-white rounded-lg ${colors.confirmBg} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
      >
        ${confirmText}
      </button>
    `
    
    return this.createModal({
      content,
      actions,
      type,
      size,
      closable
    })
  }

  // Additional utility methods for common use cases
  success(message: string, options: Partial<AlertOptions> = {}): Promise<boolean> {
    return this.alert({
      ...options,
      message,
      type: 'success',
      title: options.title || 'Berhasil'
    })
  }

  error(message: string, options: Partial<AlertOptions> = {}): Promise<boolean> {
    return this.alert({
      ...options,
      message,
      type: 'error',
      title: options.title || 'Error'
    })
  }

  warning(message: string, options: Partial<AlertOptions> = {}): Promise<boolean> {
    return this.alert({
      ...options,
      message,
      type: 'warning',
      title: options.title || 'Peringatan'
    })
  }

  info(message: string, options: Partial<AlertOptions> = {}): Promise<boolean> {
    return this.alert({
      ...options,
      message,
      type: 'info',
      title: options.title || 'Informasi'
    })
  }

  // Quick confirmation for delete actions
  confirmDelete(message: string = 'Apakah Anda yakin ingin menghapus item ini?'): Promise<boolean> {
    return this.confirm({
      title: 'Konfirmasi Hapus',
      message,
      type: 'danger',
      confirmText: 'Hapus',
      cancelText: 'Batal'
    })
  }
}

const modalService = new ModalService()

declare global {
  interface Window {
    $modal: ModalService
  }
}

export default defineNuxtPlugin(() => {
  // Make modal service available globally
  if (process.client) {
    window.$modal = modalService
  }
  
  return {
    provide: {
      modal: modalService
    }
  }
})