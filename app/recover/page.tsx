import Link from "next/link";
import RecoveryForm from "@/components/RecoveryForm";
export default function RecoverPage() {
  return <main style={{ maxWidth: 440, margin: "3rem auto", padding: "1rem" }}>
    <h1>Recover your access</h1>
    <p>Ask your organiser to verify your identity and give you a one-time recovery code. Your picks stay with your account.</p>
    <RecoveryForm />
    <Link href="/">Back to join</Link>
  </main>;
}
