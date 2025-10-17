// src/lib/utils.ts
import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ✅ Hàm gộp className tiện dụng cho Tailwind + Radix UI
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
