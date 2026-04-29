interface AuthRouteDebugScreenProps {
  title: string;
  description: string;
  payload: Record<string, unknown>;
}

const AuthRouteDebugScreen = ({ title, description, payload }: AuthRouteDebugScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-3xl p-6 w-full max-w-2xl space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold gradient-text">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <pre className="rounded-2xl border border-border bg-muted/40 p-4 text-xs overflow-x-auto whitespace-pre-wrap break-words text-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default AuthRouteDebugScreen;