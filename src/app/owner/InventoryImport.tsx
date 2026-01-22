"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parseCSV, type ParsedProduct } from "@/lib/inventory-parser";
import { bulkImportProducts, type ImportProductData } from "./actions";

type DraftProduct = {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  isValid: boolean;
  errors: string[];
  selected: boolean;
};

interface InventoryImportProps {
  businessId: string;
  onClose: () => void;
}

export default function InventoryImport({ businessId, onClose }: InventoryImportProps) {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseErrors(["Please upload a CSV file. You can export to CSV from Excel or Google Sheets."]);
      return;
    }

    const text = await file.text();
    const result = parseCSV(text);

    if (!result.success) {
      setParseErrors(result.errors);
      return;
    }

    // Convert parsed products to drafts
    const newDrafts: DraftProduct[] = result.products.map((p, idx) => {
      const errors: string[] = [...p.errors];
      if (!p.name) errors.push("Name is required");
      if (p.price === null || p.price <= 0) errors.push("Valid price is required");

      return {
        id: `draft-${idx}`,
        name: p.name || "",
        price: p.price?.toString() || "",
        description: p.description || "",
        imageUrl: p.imageUrl || "",
        isValid: errors.length === 0,
        errors,
        selected: errors.length === 0, // Auto-select valid items
      };
    });

    setDrafts(newDrafts);
    setParseErrors(result.errors);
    setStep("preview");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const updateDraft = (id: string, field: keyof DraftProduct, value: string | boolean) => {
    setDrafts(prev =>
      prev.map(d => {
        if (d.id !== id) return d;

        const updated = { ...d, [field]: value };

        // Revalidate
        const errors: string[] = [];
        if (!updated.name.trim()) errors.push("Name is required");
        const priceNum = parseFloat(updated.price);
        if (isNaN(priceNum) || priceNum <= 0) errors.push("Valid price is required");

        updated.errors = errors;
        updated.isValid = errors.length === 0;

        return updated;
      })
    );
  };

  const toggleSelectAll = (selected: boolean) => {
    setDrafts(prev => prev.map(d => ({ ...d, selected: d.isValid ? selected : false })));
  };

  const handleImport = async () => {
    const selectedDrafts = drafts.filter(d => d.selected && d.isValid);

    if (selectedDrafts.length === 0) {
      setImportResult({ success: false, count: 0, error: "No valid products selected" });
      return;
    }

    setStep("importing");

    const products: ImportProductData[] = selectedDrafts.map(d => ({
      name: d.name.trim(),
      price: parseFloat(d.price),
      description: d.description.trim() || null,
      imageUrl: d.imageUrl.trim() || null,
    }));

    const result = await bulkImportProducts(businessId, products);

    if (result.success) {
      setImportResult({ success: true, count: result.importedCount || 0 });
      setStep("done");
      router.refresh();
    } else {
      setImportResult({ success: false, count: 0, error: result.error });
      setStep("preview");
    }
  };

  const validCount = drafts.filter(d => d.isValid).length;
  const selectedCount = drafts.filter(d => d.selected && d.isValid).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Import Inventory</h2>
            <p className="text-sm text-gray-500">
              {step === "upload" && "Upload a CSV file from Excel or Google Sheets"}
              {step === "preview" && "Review and edit your products before importing"}
              {step === "importing" && "Importing products..."}
              {step === "done" && "Import complete!"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === "upload" && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 mb-2">Drag and drop your CSV file here, or</p>
                <label className="inline-block">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    Browse Files
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Expected CSV format:</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Your CSV should have a header row with columns for product data. We auto-detect common column names:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>Name:</strong> name, product, item, title</li>
                  <li><strong>Price:</strong> price, cost, amount, unit price</li>
                  <li><strong>Description:</strong> description, desc, details, notes</li>
                  <li><strong>Image URL:</strong> image, image url, picture, photo</li>
                </ul>
                <p className="text-sm text-gray-500 mt-3">
                  Tip: Export from Excel as "CSV (Comma delimited)" or from Google Sheets as "CSV"
                </p>
              </div>

              {parseErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">Error parsing file:</h3>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {parseErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-600">
                    Found <strong>{drafts.length}</strong> products, <strong>{validCount}</strong> valid
                  </span>
                  {selectedCount > 0 && (
                    <span className="text-sm text-green-600 ml-2">
                      ({selectedCount} selected for import)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleSelectAll(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Select all valid
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Deselect all
                  </button>
                </div>
              </div>

              {importResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                  {importResult.error}
                </div>
              )}

              {/* Draft List */}
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={`border rounded-lg p-4 ${
                      draft.selected ? "border-blue-300 bg-blue-50/50" : "border-gray-200"
                    } ${!draft.isValid ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={draft.selected}
                          disabled={!draft.isValid}
                          onChange={(e) => updateDraft(draft.id, "selected", e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </div>

                      {/* Fields */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => updateDraft(draft.id, "name", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                            placeholder="Product name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Price *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1.5 text-gray-400 text-sm">$</span>
                            <input
                              type="text"
                              value={draft.price}
                              onChange={(e) => updateDraft(draft.id, "price", e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={draft.description}
                            onChange={(e) => updateDraft(draft.id, "description", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Image URL
                          </label>
                          <input
                            type="text"
                            value={draft.imageUrl}
                            onChange={(e) => updateDraft(draft.id, "imageUrl", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Errors */}
                    {draft.errors.length > 0 && (
                      <div className="mt-2 ml-8 text-xs text-red-500">
                        {draft.errors.join(" • ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Importing {selectedCount} products...</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Import Complete!</h3>
              <p className="text-gray-600">
                Successfully imported {importResult?.count} products
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {step === "preview" && (
              <button
                onClick={() => {
                  setStep("upload");
                  setDrafts([]);
                  setParseErrors([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Upload different file
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {step === "done" ? "Close" : "Cancel"}
            </button>
            {step === "preview" && (
              <button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import {selectedCount} Products
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
