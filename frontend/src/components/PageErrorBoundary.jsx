// PageErrorBoundary.jsx
// If a page fails to load or crashes (e.g. its file is gone after a new
// deploy), show a short message with a Reload button instead of a blank
// screen. Navigating to another page (a new `resetKey`) clears the error.

import { Component } from 'react';

class PageErrorBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error) {
        console.error(error);
    }

    componentDidUpdate(prevProps) {
        if (this.state.failed && prevProps.resetKey !== this.props.resetKey) this.setState({ failed: false });
    }

    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <div className="page max-w-md py-16 text-center" role="alert">
                <p className="text-lg font-bold">Couldn't load this page</p>
                <p className="mt-1 text-sm text-muted">ArenaX may have just been updated. Reloading usually fixes it.</p>
                <button onClick={() => window.location.reload()} className="btn btn-dark mt-5">Reload</button>
            </div>
        );
    }
}

export default PageErrorBoundary;
