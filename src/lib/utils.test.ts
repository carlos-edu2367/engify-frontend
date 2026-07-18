import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import { formatLocalDateTime } from "./utils";

describe("formatLocalDateTime", () => {
  it("formats an ISO timestamp with the browser local date and time", () => {
    const timestamp = "2026-07-18T15:45:00Z";

    expect(formatLocalDateTime(timestamp)).toBe(
      format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm"),
    );
  });
});
