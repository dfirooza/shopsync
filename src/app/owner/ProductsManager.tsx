"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProduct, updateProduct, deleteProduct, updateProductDiscount } from "./actions";
import type { Tables } from "@/types/database";
import InventoryImport from "./InventoryImport";

type Product = Tables<"products">;

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending
        ? isEdit
          ? "Updating..."
          : "Adding..."
        : isEdit
        ? "Update Product"
        : "Add Product"}
    </button>
  );
}

interface ProductFormProps {
  businessId: string;
  product?: Product;
  onCancel?: () => void;
}

function ProductForm({ businessId, product, onCancel }: ProductFormProps) {
  const isEdit = !!product;
  const action = isEdit
    ? updateProduct.bind(null, product.id)
    : createProduct.bind(null, businessId);

  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="border rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        {isEdit ? "Edit Product" : "Add New Product"}
      </h3>

      <div className="space-y-4">
        <div>
          <label htmlFor={`name-${product?.id || 'new'}`} className="block text-sm font-medium mb-2 text-gray-900">
            Product Name
          </label>
          <input
            id={`name-${product?.id || 'new'}`}
            name="name"
            type="text"
            required
            defaultValue={product?.name}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label htmlFor={`price-${product?.id || 'new'}`} className="block text-sm font-medium mb-2 text-gray-900">
            Price ($)
          </label>
          <input
            id={`price-${product?.id || 'new'}`}
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.price}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor={`description-${product?.id || 'new'}`} className="block text-sm font-medium mb-2 text-gray-900">
            Description (Optional)
          </label>
          <textarea
            id={`description-${product?.id || 'new'}`}
            name="description"
            rows={3}
            defaultValue={product?.description || ''}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Product description"
          />
        </div>

        <div>
          <label htmlFor={`image-${product?.id || 'new'}`} className="block text-sm font-medium mb-2 text-gray-900">
            Product Image (Optional)
          </label>
          <input
            id={`image-${product?.id || 'new'}`}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">Max 5MB. Formats: JPG, PNG, WebP</p>
          {product?.image_url && (
            <p className="text-xs text-green-600 mt-1">Current image will be replaced if you select a new one</p>
          )}
        </div>

        {state?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{state.error}</p>
          </div>
        )}

        {state?.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">
              {isEdit ? "Product updated!" : "Product added!"}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <SubmitButton isEdit={isEdit} />
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

interface ProductsManagerProps {
  businessId: string;
  initialProducts: Product[];
}

export default function ProductsManager({
  businessId,
  initialProducts,
}: ProductsManagerProps) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [discountingProductId, setDiscountingProductId] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [discountLoading, setDiscountLoading] = useState(false);

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const result = await deleteProduct(productId);
    if (result.error) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleApplyDiscount = async (productId: string) => {
    setDiscountLoading(true);
    const result = await updateProductDiscount(productId, discountPercent, true);
    setDiscountLoading(false);

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      setDiscountingProductId(null);
    }
  };

  const handleRemoveDiscount = async (productId: string) => {
    if (!confirm("Are you sure you want to remove this discount?")) {
      return;
    }

    setDiscountLoading(true);
    const result = await updateProductDiscount(productId, null, false);
    setDiscountLoading(false);

    if (result.error) {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Products</h2>
        {!showAddForm && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Inventory
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Add Product
            </button>
          </div>
        )}
      </div>

      {showAddForm && (
        <ProductForm
          businessId={businessId}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {initialProducts.length === 0 && !showAddForm ? (
        <div className="border rounded-lg p-8 text-center text-gray-500">
          <p>No products yet. Add your first product to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {initialProducts.map((product) => (
            <div key={product.id}>
              {editingProductId === product.id ? (
                <ProductForm
                  businessId={businessId}
                  product={product}
                  onCancel={() => setEditingProductId(null)}
                />
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex gap-4">
                    {product.image_url && (
                      <div className="flex-shrink-0 relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        {product.is_discount_active && product.discount_percent && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            -{product.discount_percent}%
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex-1 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          {product.is_discount_active && product.discount_percent && !product.image_url && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              -{product.discount_percent}%
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          {product.is_discount_active && product.discount_percent ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xl text-green-600 font-bold">
                                ${(product.price * (1 - product.discount_percent / 100)).toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-400 line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xl text-green-600 font-bold">
                              ${product.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-gray-600 mt-2">{product.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingProductId(product.id)}
                            className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                        {product.is_discount_active ? (
                          <button
                            onClick={() => handleRemoveDiscount(product.id)}
                            disabled={discountLoading}
                            className="bg-orange-500 text-white py-1 px-3 rounded hover:bg-orange-600 text-sm disabled:opacity-50"
                          >
                            {discountLoading ? "..." : "Remove Discount"}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setDiscountingProductId(product.id);
                              setDiscountPercent(10);
                            }}
                            className="bg-purple-600 text-white py-1 px-3 rounded hover:bg-purple-700 text-sm"
                          >
                            Add Discount
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Discount Form */}
                  {discountingProductId === product.id && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-3">Set In-App Discount</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(Math.min(99, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-20 px-3 py-2 border rounded-lg text-center text-gray-900"
                          />
                          <span className="text-purple-900">% off</span>
                        </div>
                        <div className="text-sm text-purple-700">
                          New price: <strong>${(product.price * (1 - discountPercent / 100)).toFixed(2)}</strong>
                        </div>
                      </div>
                      <p className="text-xs text-purple-600 mt-2">
                        Followers will be notified when you activate this discount
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApplyDiscount(product.id)}
                          disabled={discountLoading}
                          className="bg-purple-600 text-white py-1.5 px-4 rounded hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
                        >
                          {discountLoading ? "Applying..." : "Apply Discount"}
                        </button>
                        <button
                          onClick={() => setDiscountingProductId(null)}
                          className="bg-gray-200 text-gray-700 py-1.5 px-4 rounded hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Import Inventory Modal */}
      {showImportModal && (
        <InventoryImport
          businessId={businessId}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}
