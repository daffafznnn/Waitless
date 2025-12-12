/* FILE: src/tests/components/Button.spec.ts */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '~/components/ui/Button.vue'

describe('Button Component', () => {
  it('renders button with default props', () => {
    const wrapper = mount(Button, {
      props: {
        label: 'Click me'
      }
    })
    
    expect(wrapper.text()).toContain('Click me')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('applies correct variant classes', () => {
    const wrapper = mount(Button, {
      props: {
        label: 'Primary Button',
        variant: 'primary'
      }
    })
    
    const button = wrapper.find('button')
    expect(button.classes()).toContain('bg-primary-600')
    expect(button.classes()).toContain('text-white')
  })

  it('handles click events', async () => {
    const wrapper = mount(Button, {
      props: {
        label: 'Click me'
      }
    })
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('shows loading state', () => {
    const wrapper = mount(Button, {
      props: {
        label: 'Loading...',
        loading: true
      }
    })
    
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('disables button when disabled prop is true', () => {
    const wrapper = mount(Button, {
      props: {
        label: 'Disabled',
        disabled: true
      }
    })
    
    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.classes()).toContain('opacity-50')
  })

  it('renders as NuxtLink when to prop is provided', () => {
    const wrapper = mount(Button, {
      props: {
        label: 'Link',
        to: '/test'
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
            props: ['to']
          }
        }
      }
    })
    
    expect(wrapper.find('a').exists()).toBe(true)
  })
})