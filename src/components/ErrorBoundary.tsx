import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-8 flex justify-center items-center min-h-[50vh]">
                    <Card className="w-full max-w-2xl border-destructive shadow-lg">
                        <CardHeader className="bg-destructive/10 pb-4 border-b border-destructive/20">
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6" />
                                Something went wrong in {this.props.name || 'this component'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <p className="text-lg font-medium">The application crashed.</p>

                            <div className="bg-muted p-4 rounded-md overflow-x-auto">
                                <p className="font-mono text-sm text-destructive font-bold mb-2">
                                    {this.state.error?.toString()}
                                </p>
                                <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                                    {this.state.errorInfo?.componentStack || "No stack trace available"}
                                </pre>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <RefreshCcw size={16} />
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
