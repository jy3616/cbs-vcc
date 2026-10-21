import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useBookmarks } from "@/lib/bookmarks";

const URL_A = "https://example.com/associate";

describe("Browser bookmarks", () => {
  beforeEach(() => localStorage.clear());

  it("adds then removes a posting", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => result.current.toggle(URL_A));
    expect(typeof result.current.map[URL_A]).toBe("string");

    act(() => result.current.toggle(URL_A));
    expect(result.current.map[URL_A]).toBeUndefined();
  });

  it("keeps every open copy of the list in step without a reload", () => {
    // The header count and the card button are two separate copies of the list.
    const header = renderHook(() => useBookmarks());
    const card = renderHook(() => useBookmarks());

    act(() => header.result.current.toggle(URL_A));

    expect(card.result.current.map[URL_A]).toBeTypeOf("string");

    act(() => card.result.current.toggle(URL_A));

    expect(header.result.current.map[URL_A]).toBeUndefined();
  });
});
