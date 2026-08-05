import { AuthShell } from "../../components/auth/auth-shell";
import { LoginForm } from "../../components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Carvia Access"
      title="Melde dein Einkaufsteam in einer geschlossenen Analyseumgebung an."
      description="Carvia startet mit einer tenant-sicheren Authentifizierung, damit Einkauf, Watchlist und spaetere Providerdaten sauber pro Unternehmen getrennt bleiben."
    >
      <LoginForm />
    </AuthShell>
  );
}

