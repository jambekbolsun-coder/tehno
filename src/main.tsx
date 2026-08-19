import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/public.css";
import "@/styles/crm.css";
import "@/styles/responsive.css";
import "@/styles/buyer-market.css";
import "@/styles/mbank-refresh.css";

createRoot(document.getElementById("root")!).render(<StrictMode><App/></StrictMode>);
