"use client";

import React from "react";

interface DeleteConfirmFormProps {
  action: (formData: FormData) => Promise<void>;
  message: string;
  className?: string;
  children: React.ReactNode;
}

export function DeleteConfirmForm({ action, message, className = "inline-flex", children }: DeleteConfirmFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) {
      e.preventDefault();
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}
