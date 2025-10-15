"use client"

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console (можно отправить в систему мониторинга)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle>Что-то пошло не так</CardTitle>
              </div>
              <CardDescription>
                Произошла ошибка при отображении этого компонента
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="rounded-md bg-gray-100 p-3">
                  <p className="text-sm font-mono text-gray-800">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void 
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle>Ошибка</CardTitle>
          </div>
          <CardDescription>
            {error.message || 'Произошла неожиданная ошибка'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

