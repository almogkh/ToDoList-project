import { createContext } from "react";
import type React from "react";

export const LayoutContext = createContext<{setMobileMenuContent?: (content: React.JSX.Element | null) => void}>({})