"use client";

import React from "react";

interface AutoSubmitSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function AutoSubmitSelect({ children, ...props }: AutoSubmitSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.target.form?.submit();
  };

  return (
    <select {...props} onChange={handleChange}>
      {children}
    </select>
  );
}
