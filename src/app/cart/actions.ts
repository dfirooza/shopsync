"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  discountedPrice: number | null;
  discountPercent: number | null;
  isDiscountActive: boolean;
  productImage: string | null;
  quantity: number;
  businessId: string;
  businessName: string;
};

export type CartSummary = {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
};

export async function getCartItems(): Promise<{
  error?: string;
  cart: CartSummary;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", cart: { items: [], totalAmount: 0, itemCount: 0 } };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cartItems, error } = await (supabase as any)
    .from("cart_items")
    .select("id, product_id, quantity")
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message, cart: { items: [], totalAmount: 0, itemCount: 0 } };
  }

  if (!cartItems || cartItems.length === 0) {
    return { cart: { items: [], totalAmount: 0, itemCount: 0 } };
  }

  // Get product details for each cart item
  const productIds = cartItems.map((item: { product_id: string }) => item.product_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products, error: productsError } = await (supabase as any)
    .from("products")
    .select("id, name, price, image_url, business_id, discount_percent, is_discount_active")
    .in("id", productIds);

  if (productsError) {
    return { error: productsError.message, cart: { items: [], totalAmount: 0, itemCount: 0 } };
  }

  // Get business names
  const businessIds = [...new Set(products.map((p: { business_id: string }) => p.business_id))];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: businesses } = await (supabase as any)
    .from("businesses")
    .select("id, name")
    .in("id", businessIds);

  const businessMap = new Map(
    (businesses || []).map((b: { id: string; name: string }) => [b.id, b.name])
  );

  type ProductInfo = {
    name: string;
    price: number;
    imageUrl: string | null;
    businessId: string;
    discountPercent: number | null;
    isDiscountActive: boolean;
  };
  const productMap = new Map<string, ProductInfo>(
    products.map((p: {
      id: string;
      name: string;
      price: number;
      image_url: string | null;
      business_id: string;
      discount_percent: number | null;
      is_discount_active: boolean;
    }) => [
      p.id,
      {
        name: p.name,
        price: p.price,
        imageUrl: p.image_url,
        businessId: p.business_id,
        discountPercent: p.discount_percent,
        isDiscountActive: p.is_discount_active,
      },
    ])
  );

  const items: CartItem[] = cartItems
    .map((item: { id: string; product_id: string; quantity: number }) => {
      const product = productMap.get(item.product_id);
      if (!product) return null;

      const discountedPrice = product.isDiscountActive && product.discountPercent
        ? product.price * (1 - product.discountPercent / 100)
        : null;

      return {
        id: item.id,
        productId: item.product_id,
        productName: product.name,
        productPrice: product.price,
        discountedPrice,
        discountPercent: product.discountPercent,
        isDiscountActive: product.isDiscountActive,
        productImage: product.imageUrl,
        quantity: item.quantity,
        businessId: product.businessId,
        businessName: businessMap.get(product.businessId) || "Unknown Business",
      };
    })
    .filter((item: CartItem | null): item is CartItem => item !== null);

  // Use discounted price if available
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.discountedPrice ?? item.productPrice) * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { cart: { items, totalAmount, itemCount } };
}

export async function getCartCount(): Promise<{ count: number; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { count: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cartItems, error } = await (supabase as any)
    .from("cart_items")
    .select("quantity")
    .eq("user_id", user.id);

  if (error) {
    return { count: 0, error: error.message };
  }

  const count = (cartItems || []).reduce(
    (sum: number, item: { quantity: number }) => sum + item.quantity,
    0
  );

  return { count };
}

export async function addToCart(
  productId: string,
  quantity: number = 1
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if item already exists in cart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    // Update quantity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Insert new item
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("cart_items").insert({
      user_id: user.id,
      product_id: productId,
      quantity,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function updateCartQuantity(
  productId: string,
  quantity: number
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function removeFromCart(
  productId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function clearCart(): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("cart_items")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function checkout(
  customerNote?: string
): Promise<{ success?: boolean; orderId?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get cart items with product details
  const { cart, error: cartError } = await getCartItems();

  if (cartError) {
    return { error: cartError };
  }

  if (cart.items.length === 0) {
    return { error: "Cart is empty" };
  }

  // Create order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (supabase as any)
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total_amount: cart.totalAmount,
      customer_email: user.email,
      customer_note: customerNote || null,
    })
    .select("id")
    .single();

  if (orderError) {
    return { error: orderError.message };
  }

  // Create order items (use discounted price if available)
  const orderItems = cart.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    business_id: item.businessId,
    product_name: item.productName,
    product_price: item.discountedPrice ?? item.productPrice,
    quantity: item.quantity,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase as any)
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    // Rollback order if items fail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("orders").delete().eq("id", order.id);
    return { error: itemsError.message };
  }

  // Clear cart
  await clearCart();

  revalidatePath("/cart");
  revalidatePath("/orders");
  return { success: true, orderId: order.id };
}

export async function getOrders(): Promise<{
  error?: string;
  orders: {
    id: string;
    status: string;
    totalAmount: number;
    customerNote: string | null;
    createdAt: string;
  }[];
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", orders: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders, error } = await (supabase as any)
    .from("orders")
    .select("id, status, total_amount, customer_note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, orders: [] };
  }

  return {
    orders: (orders || []).map((order: {
      id: string;
      status: string;
      total_amount: number;
      customer_note: string | null;
      created_at: string;
    }) => ({
      id: order.id,
      status: order.status,
      totalAmount: order.total_amount,
      customerNote: order.customer_note,
      createdAt: order.created_at,
    })),
  };
}

export async function getOrderDetails(orderId: string): Promise<{
  error?: string;
  order?: {
    id: string;
    status: string;
    totalAmount: number;
    customerNote: string | null;
    createdAt: string;
    items: {
      id: string;
      productName: string;
      productPrice: number;
      quantity: number;
      businessName: string;
    }[];
  };
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (supabase as any)
    .from("orders")
    .select("id, status, total_amount, customer_note, created_at, user_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { error: orderError?.message || "Order not found" };
  }

  if (order.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  // Get order items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items, error: itemsError } = await (supabase as any)
    .from("order_items")
    .select("id, product_name, product_price, quantity, business_id")
    .eq("order_id", orderId);

  if (itemsError) {
    return { error: itemsError.message };
  }

  // Get business names
  const businessIds = [...new Set((items || []).map((i: { business_id: string }) => i.business_id))];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: businesses } = await (supabase as any)
    .from("businesses")
    .select("id, name")
    .in("id", businessIds);

  const businessMap = new Map(
    (businesses || []).map((b: { id: string; name: string }) => [b.id, b.name])
  );

  return {
    order: {
      id: order.id,
      status: order.status,
      totalAmount: order.total_amount,
      customerNote: order.customer_note,
      createdAt: order.created_at,
      items: (items || []).map((item: {
        id: string;
        product_name: string;
        product_price: number;
        quantity: number;
        business_id: string;
      }) => ({
        id: item.id,
        productName: item.product_name,
        productPrice: item.product_price,
        quantity: item.quantity,
        businessName: businessMap.get(item.business_id) || "Unknown Business",
      })),
    },
  };
}

export async function getBusinessOrders(): Promise<{
  error?: string;
  orders: {
    id: string;
    orderId: string;
    status: string;
    customerEmail: string | null;
    customerNote: string | null;
    createdAt: string;
    items: {
      productName: string;
      productPrice: number;
      quantity: number;
    }[];
    total: number;
  }[];
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", orders: [] };
  }

  // Get business owned by user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: business } = await (supabase as any)
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return { error: "No business found", orders: [] };
  }

  // Get order items for this business
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orderItems, error: itemsError } = await (supabase as any)
    .from("order_items")
    .select("id, order_id, product_name, product_price, quantity")
    .eq("business_id", business.id);

  if (itemsError) {
    return { error: itemsError.message, orders: [] };
  }

  if (!orderItems || orderItems.length === 0) {
    return { orders: [] };
  }

  // Get unique order IDs
  const orderIds = [...new Set(orderItems.map((item: { order_id: string }) => item.order_id))];

  // Get order details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders, error: ordersError } = await (supabase as any)
    .from("orders")
    .select("id, status, customer_email, customer_note, created_at")
    .in("id", orderIds)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return { error: ordersError.message, orders: [] };
  }

  // Group items by order
  const itemsByOrder = new Map<string, typeof orderItems>();
  for (const item of orderItems) {
    const existing = itemsByOrder.get(item.order_id) || [];
    existing.push(item);
    itemsByOrder.set(item.order_id, existing);
  }

  return {
    orders: (orders || []).map((order: {
      id: string;
      status: string;
      customer_email: string | null;
      customer_note: string | null;
      created_at: string;
    }) => {
      const items = itemsByOrder.get(order.id) || [];
      const total = items.reduce(
        (sum: number, item: { product_price: number; quantity: number }) =>
          sum + item.product_price * item.quantity,
        0
      );
      return {
        id: order.id,
        orderId: order.id,
        status: order.status,
        customerEmail: order.customer_email,
        customerNote: order.customer_note,
        createdAt: order.created_at,
        items: items.map((item: {
          product_name: string;
          product_price: number;
          quantity: number;
        }) => ({
          productName: item.product_name,
          productPrice: item.product_price,
          quantity: item.quantity,
        })),
        total,
      };
    }),
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify user owns a business with items in this order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: business } = await (supabase as any)
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return { error: "No business found" };
  }

  // Check if this order has items from their business
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orderItem } = await (supabase as any)
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();

  if (!orderItem) {
    return { error: "Order not found or unauthorized" };
  }

  // Update order status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/owner/orders");
  return { success: true };
}
