import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkAndAddDecorators } from "./checkAndAddDecorators";
import fs from "fs";
import path from "path";

describe("checkAndAddDecorators", () => {
  const testFilePath = path.resolve(__dirname, "__tests__/test.controller.ts");
  const backupFilePath = `${testFilePath}.backup`;

  beforeEach(() => {
    // Create a backup of the original file
    fs.copyFileSync(testFilePath, backupFilePath);
  });

  afterEach(() => {
    // Restore the original file from backup
    fs.copyFileSync(backupFilePath, testFilePath);
    fs.unlinkSync(backupFilePath);
  });

  it("should add missing decorators", () => {
    const originalContent = fs.readFileSync(testFilePath, "utf8");
    console.log("Original content:", originalContent);

    const modifiedFiles = checkAndAddDecorators([testFilePath]);
    const updatedContent = modifiedFiles[testFilePath] || originalContent;
    console.log("Updated content:", updatedContent);

    const unauthorizedRegex =
      /@Response<ErrorResponse>\(401, "Unauthorized"\)/g;
    const forbiddenRegex = /@Response<ErrorResponse>\(403, "Forbidden"\)/g;

    expect(unauthorizedRegex.test(updatedContent)).toBe(true);
    expect(forbiddenRegex.test(updatedContent)).toBe(true);
    expect(updatedContent).not.toBe(originalContent);
  });

  it("should not add decorators if they already exist", () => {
    // First, add the decorators
    const modifiedFiles1 = checkAndAddDecorators([testFilePath]);
    const contentWithDecorators = modifiedFiles1[testFilePath] || "";

    // Then, try to add them again
    const modifiedFiles2 = checkAndAddDecorators([testFilePath]);
    const finalContent = modifiedFiles2[testFilePath] || contentWithDecorators;

    expect(finalContent).toBe(contentWithDecorators);
  });
});
