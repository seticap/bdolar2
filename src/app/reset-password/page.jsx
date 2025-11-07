import { Suspense } from "react";
import ResetPassword from "./ResetPassword";

export const dynamic = "force-static";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-gray-400">Cargando…</div>}
    >
      <ResetPassword />
    </Suspense>
  );
}