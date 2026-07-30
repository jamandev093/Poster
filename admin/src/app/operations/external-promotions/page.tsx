import { redirect } from "next/navigation";

export default function ExternalPromotionsIndexPage() {
  redirect(
    "/operations/external-promotions/promotions"
  );
}
