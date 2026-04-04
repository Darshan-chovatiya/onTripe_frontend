import { Component } from 'react'
import Button from '@/shared/components/Button.jsx'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
          <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="max-w-md text-center text-sm text-gray-600">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button type="button" variant="primary" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
