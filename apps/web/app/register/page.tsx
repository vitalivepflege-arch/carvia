import { AuthShell } from "../../components/auth/auth-shell";
import { RegisterForm } from "../../components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Create Account"
      title="Starte Carvia mit einem eigenen Haendlerkonto und richte danach sofort deinen ersten Tenant ein."
      description="Die Registrierung ist bewusst schlank gehalten: erst Zugang absichern, dann Unternehmenskontext erfassen und anschliessend direkt mit Suche und Inseraten arbeiten."
    >
      <RegisterForm />
    </AuthShell>
  );
}
