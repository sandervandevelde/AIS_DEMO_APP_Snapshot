import { ErrorBoundary } from "react-error-boundary";

import App from "./App";
import { AuthGate } from "./components/auth-gate.component";
import { ErrorFallback } from "./ErrorFallback";
import { ThemeContext } from "./hooks/theme.context";
import { useAppTheme } from "./hooks/use-theme";
import { AuthProvider } from "./hooks/use-auth";
import type { IAuthService } from "./services/rayfin-auth.service";

interface RootProps {
    rayfinAuthService: IAuthService;
}

export default function Root({ rayfinAuthService }: RootProps) {
    const { isDark, toggleTheme } = useAppTheme();

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <AuthProvider rayfinAuthService={rayfinAuthService}>
                    <AuthGate>
                        <App />
                    </AuthGate>
                </AuthProvider>
            </ErrorBoundary>
        </ThemeContext.Provider>
    );
}
