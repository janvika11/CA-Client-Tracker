import { Component } from 'react';

export class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Dashboard]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      const message = error?.message || String(error);
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50/90 p-6 text-rose-900 dark:border-dm-danger/40 dark:bg-[#450a0a]/35 dark:text-dm-danger">
          <p className="font-semibold">Dashboard crashed</p>
          <p className="mt-2 text-sm opacity-90">
            Open DevTools → Console for the stack trace. Error: {message}
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
