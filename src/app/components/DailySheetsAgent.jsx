"use client";
import { useDailySheets } from "../services/useDailySheets";

export default function DailySheetsAgent() {
  useDailySheets();
  return null;
}
