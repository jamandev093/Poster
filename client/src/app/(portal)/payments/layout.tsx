import type {
  ReactNode,
} from "react";

import {
  PaymentsNavigation,
} from "@/features/workspace/components";

interface PaymentsLayoutProps {
  children:
    ReactNode;
}

export default function PaymentsLayout(
  props:
    PaymentsLayoutProps
) {
  return (
    <>
      <PaymentsNavigation />

      {props.children}
    </>
  );
}