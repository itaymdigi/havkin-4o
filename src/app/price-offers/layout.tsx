import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "הצעת מחיר חדשה | Streamline",
  description: "יצירת הצעת מחיר חדשה",
};

export default function PriceOffersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
