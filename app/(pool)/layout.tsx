import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Nav from "@/components/Nav";

export default async function PoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav displayName={session.displayName} />
      <main style={{ flex: 1, padding: "1.25rem 1rem 5rem" }}>{children}</main>
    </div>
  );
}
