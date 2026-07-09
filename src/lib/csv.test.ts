import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a simple header + row", () => {
    expect(parseCsv("Address,City\n123 Main St,Tulsa")).toEqual([
      ["Address", "City"],
      ["123 Main St", "Tulsa"],
    ]);
  });

  it("handles quoted fields containing commas", () => {
    expect(parseCsv('Address,City\n"123 Main St, Apt 4",Tulsa')).toEqual([
      ["Address", "City"],
      ["123 Main St, Apt 4", "Tulsa"],
    ]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    expect(parseCsv('Notes\n"Says ""vacant"" on file"')).toEqual([
      ["Notes"],
      ['Says "vacant" on file'],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("A,B\r\n1,2\r\n3,4")).toEqual([
      ["A", "B"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("handles a file with no trailing newline", () => {
    expect(parseCsv("A,B\n1,2")).toEqual([
      ["A", "B"],
      ["1", "2"],
    ]);
  });

  it("skips blank lines", () => {
    expect(parseCsv("A,B\n1,2\n\n3,4")).toEqual([
      ["A", "B"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("preserves empty fields", () => {
    expect(parseCsv("A,B,C\n1,,3")).toEqual([
      ["A", "B", "C"],
      ["1", "", "3"],
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});
