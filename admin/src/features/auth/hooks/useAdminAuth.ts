"use client";

import {
  useContext,
} from "react";

import {
  AdminAuthContext,
} from "../context/AdminAuthProvider";

export default function useAdminAuth() {
  const context =
    useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth must be used inside AdminAuthProvider."
    );
  }

  return context;
}
