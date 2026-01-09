"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createBusiness, updateBusiness } from "./actions";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending
        ? isEdit
          ? "Updating..."
          : "Creating..."
        : isEdit
        ? "Update Business"
        : "Create Business"}
    </button>
  );
}

interface BusinessFormProps {
  business?: {
    id: string;
    name: string;
    category: string;
    address: string;
  };
}

export default function BusinessForm({ business }: BusinessFormProps) {
  const isEdit = !!business;
  const action = isEdit
    ? updateBusiness.bind(null, business.id)
    : createBusiness;

  const [state, formAction] = useActionState(action, undefined);

  return (
    <div className="border rounded-lg p-8">
      <h2 className="text-xl font-semibold mb-4">
        {isEdit ? "Edit Business Profile" : "Create Business Profile"}
      </h2>
      <p className="text-gray-600 mb-6">
        {isEdit
          ? "Update your business information below."
          : "Set up your business profile to start managing products."}
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Business Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={business?.name}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Enter business name"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category
          </label>
          <input
            id="category"
            name="category"
            type="text"
            required
            defaultValue={business?.category}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="e.g., Restaurant, Retail, Service"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-2">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            defaultValue={business?.address}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Full business address"
          />
        </div>

        {state?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{state.error}</p>
          </div>
        )}

        {state?.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">
              {isEdit
                ? "Business updated successfully!"
                : "Business created successfully!"}
            </p>
          </div>
        )}

        <SubmitButton isEdit={isEdit} />
      </form>
    </div>
  );
}
