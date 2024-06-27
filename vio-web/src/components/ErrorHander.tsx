import React, { Component, ReactNode, ErrorInfo, FC } from "react";

export class ReactErrorBoundary extends Component<{ children: ReactNode }> {
  state: Readonly<{ errored?: { error: Error; errorInfo: ErrorInfo } }> = {};
  private ErrorPanel: FC<ErrorPanelProps> = ErrorPanel;
  render(): React.ReactNode {
    const { errored } = this.state;
    if (errored) {
      const { error, errorInfo } = errored;
      const ErrorPanel = this.ErrorPanel;
      return <ErrorPanel error={error} errorInfo={errorInfo} onRetry={() => this.setState({})} />;
    }
    return this.props.children;
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errored: { error, errorInfo } });
  }
}
type ErrorPanelProps = {
  error: Error;
  errorInfo: ErrorInfo;
  onRetry?(): void;
};
function ErrorPanel(props: ErrorPanelProps) {
  const { error, errorInfo, onRetry } = props;
  const stack = error instanceof Error ? error.stack ?? error.message : String(error);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "auto",
        whiteSpace: "preserve",
      }}
    >
      <div>
        发生错误，你可以尝试
        <button onClick={onRetry}>刷新</button>
      </div>
      <div>{errorInfo && errorInfo.componentStack}</div>
      <div>{stack}</div>
    </div>
  );
}
