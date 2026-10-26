"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CategoryPreview {
  name: string;
  parent_id?: string;
  display_order: number;
  description?: string;
  line: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ line: number; error: string }>;
}

/**
 * CategoryImportForm Component
 * Task 23.1: Create CategoryImportForm component
 * Requirements: 19.1, 19.2
 * 
 * Features:
 * - CSV file upload input
 * - Parse and validate CSV client-side
 * - Display preview of categories to import
 * - Call POST /api/admin/categories/import
 * - Display import results (success count, errors)
 */
export function CategoryImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [preview, setPreview] = useState<CategoryPreview[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setErrors(["Please select a valid CSV file"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setImportResult(null);

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      parseAndValidateCSV(content);
    };
    reader.readAsText(selectedFile);
  };

  const parseAndValidateCSV = (content: string) => {
    const lines = content.split("\n").filter((line) => line.trim());
    const validationErrors: string[] = [];
    const categories: CategoryPreview[] = [];

    if (lines.length === 0) {
      validationErrors.push("CSV file is empty");
      setErrors(validationErrors);
      return;
    }

    // Check header
    const header = lines[0].toLowerCase();
    const expectedHeaders = ["name", "parent_id", "display_order", "description"];
    const hasValidHeader = expectedHeaders.some((h) =>
      header.includes(h.replace("_", ""))
    );

    const startIndex = hasValidHeader ? 1 : 0;

    // Parse each line
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = parseCSVLine(line);
      const lineNumber = i + 1;

      if (parts.length < 2) {
        validationErrors.push(
          `Line ${lineNumber}: Insufficient columns (expected at least name and display_order)`
        );
        continue;
      }

      const name = parts[0]?.trim();
      const parent_id = parts[1]?.trim() || undefined;
      const display_order = parseInt(parts[2]?.trim() || "0", 10);
      const description = parts[3]?.trim() || undefined;

      // Validate name
      if (!name) {
        validationErrors.push(`Line ${lineNumber}: Category name is required`);
        continue;
      }

      // Validate display_order
      if (isNaN(display_order)) {
        validationErrors.push(
          `Line ${lineNumber}: Invalid display_order (must be a number)`
        );
        continue;
      }

      categories.push({
        name,
        parent_id: parent_id || undefined,
        display_order,
        description,
        line: lineNumber,
      });
    }

    setPreview(categories);
    setErrors(validationErrors);
  };

  // Simple CSV parser that handles quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const handleImport = async () => {
    if (!csvContent || preview.length === 0) {
      setErrors(["No valid categories to import"]);
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      const response = await fetch("/api/admin/categories/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csv_data: csvContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import categories");
      }

      const result: ImportResult = await response.json();
      setImportResult(result);

      // Clear form if successful
      if (result.errors.length === 0) {
        setFile(null);
        setCsvContent("");
        setPreview([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Failed to import categories",
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setCsvContent("");
    setPreview([]);
    setErrors([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Categories from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file to bulk import categories. Expected format: name,
          parent_id, display_order, description
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">CSV File</label>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-naija-green file:text-white
                hover:file:bg-naija-green/90
                file:cursor-pointer"
            />
            {file && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {file && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {file.name}
            </p>
          )}
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Validation Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              Preview ({preview.length} categories)
            </h3>
            <div className="border rounded-md max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Parent ID</th>
                    <th className="p-2 text-left">Order</th>
                    <th className="p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((category, index) => (
                    <tr
                      key={index}
                      className={cn(
                        "border-t",
                        index % 2 === 0 ? "bg-background" : "bg-muted/30"
                      )}
                    >
                      <td className="p-2">{category.name}</td>
                      <td className="p-2 text-muted-foreground">
                        {category.parent_id || "-"}
                      </td>
                      <td className="p-2">{category.display_order}</td>
                      <td className="p-2 text-muted-foreground truncate max-w-xs">
                        {category.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Button */}
        {preview.length > 0 && errors.length === 0 && (
          <Button
            onClick={handleImport}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {preview.length} Categories
              </>
            )}
          </Button>
        )}

        {/* Import Results */}
        {importResult && (
          <Alert
            variant={importResult.errors.length > 0 ? "destructive" : "default"}
            className={cn(
              importResult.errors.length === 0 &&
                "border-green-500 bg-green-50 dark:bg-green-950"
            )}
          >
            {importResult.errors.length === 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">Import Results:</div>
                <div className="text-sm space-y-1">
                  <p className="text-green-600 dark:text-green-400">
                    ✓ Successfully imported: {importResult.imported} categories
                  </p>
                  {importResult.skipped > 0 && (
                    <p className="text-yellow-600 dark:text-yellow-400">
                      ⚠ Skipped: {importResult.skipped} categories
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-red-600 dark:text-red-400 mb-1">
                        ✗ Errors: {importResult.errors.length}
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        {importResult.errors.map((err, index) => (
                          <li key={index} className="text-xs">
                            Line {err.line}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p className="font-semibold">CSV Format Instructions:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>First line (optional): name, parent_id, display_order, description</li>
            <li>Name: Required - Category name</li>
            <li>Parent ID: Optional - UUID of parent category for subcategories</li>
            <li>Display Order: Required - Number for sorting (0, 1, 2, ...)</li>
            <li>Description: Optional - Category description</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
