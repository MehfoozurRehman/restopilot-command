import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const now = () => new Date().toISOString();

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const [
      brand,
      products,
      deals,
      tables,
      materials,
      vendors,
      staff,
      orders,
      orderItems,
      expenses,
      purchases,
      customers,
      reservations,
      deliveries,
      shifts,
      audit,
    ] = await Promise.all([
      ctx.db.query("brand").take(1),
      ctx.db.query("products").take(200),
      ctx.db.query("deals").take(100),
      ctx.db.query("tables").take(200),
      ctx.db.query("materials").take(200),
      ctx.db.query("vendors").take(100),
      ctx.db.query("staff").take(100),
      ctx.db.query("orders").order("desc").take(200),
      ctx.db.query("orderItems").take(500),
      ctx.db.query("expenses").order("desc").take(200),
      ctx.db.query("purchases").order("desc").take(200),
      ctx.db.query("customers").take(200),
      ctx.db.query("reservations").order("desc").take(200),
      ctx.db.query("deliveries").take(200),
      ctx.db.query("shifts").order("desc").take(100),
      ctx.db.query("audit").order("desc").take(200),
    ]);
    return { brand: brand[0] ?? null, products, deals, tables, materials, vendors, staff, orders, orderItems, expenses, purchases, customers, reservations, deliveries, shifts, audit };
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("brand").take(1);
    const existingProducts = await ctx.db.query("products").take(1);
    if (existing.length && existingProducts.length) return null;
    const brandId = existing[0]?._id ?? await ctx.db.insert("brand", {
        restaurantName: "RestoPilot Command",
        tagline: "Restaurant operations platform",
        accent: "#0f766e",
        receiptFooter: "Thank you for dining with us.",
        email: "owner@restopilot.local",
        password: "change-me",
        taxId: "NTN-000000",
        currency: "Rs",
      });
    const vendorA = await ctx.db.insert("vendors", { name: "Fresh Foods Supply", phone: "0300-0000001", balance: 12400, leadDays: 1 });
    const vendorB = await ctx.db.insert("vendors", { name: "Beverage Depot", phone: "0300-0000002", balance: 6200, leadDays: 2 });
    const flour = await ctx.db.insert("materials", { name: "Flour", unit: "kg", stock: 42, reorderAt: 20, costPerUnit: 180, vendorId: vendorA });
    const chicken = await ctx.db.insert("materials", { name: "Chicken", unit: "kg", stock: 18, reorderAt: 12, costPerUnit: 760, vendorId: vendorA });
    const cheese = await ctx.db.insert("materials", { name: "Cheese", unit: "kg", stock: 9, reorderAt: 8, costPerUnit: 1450, vendorId: vendorA });
    const beef = await ctx.db.insert("materials", { name: "Beef patty", unit: "pcs", stock: 70, reorderAt: 40, costPerUnit: 155, vendorId: vendorA });
    const cola = await ctx.db.insert("materials", { name: "Soft drink bottle", unit: "pcs", stock: 96, reorderAt: 36, costPerUnit: 85, vendorId: vendorB });
    const burger = await ctx.db.insert("products", { name: "Smash Burger", category: "Burgers", price: 820, cost: 360, tax: 0.16, station: "Grill", active: true, prepMinutes: 12 });
    const pizza = await ctx.db.insert("products", { name: "Chicken Fajita Pizza", category: "Pizza", price: 1450, cost: 610, tax: 0.16, station: "Kitchen", active: true, prepMinutes: 18 });
    const drink = await ctx.db.insert("products", { name: "Soft Drink", category: "Drinks", price: 180, cost: 85, tax: 0.16, station: "Bar", active: true, prepMinutes: 1 });
    await ctx.db.insert("recipes", { productId: burger, materialId: beef, qty: 1 });
    await ctx.db.insert("recipes", { productId: burger, materialId: cheese, qty: 0.05 });
    await ctx.db.insert("recipes", { productId: pizza, materialId: flour, qty: 0.4 });
    await ctx.db.insert("recipes", { productId: pizza, materialId: chicken, qty: 0.25 });
    await ctx.db.insert("recipes", { productId: drink, materialId: cola, qty: 1 });
    const deal = await ctx.db.insert("deals", { name: "Burger Lunch Box", price: 999, validDays: ["Mon", "Tue", "Wed", "Thu"], active: true });
    await ctx.db.insert("dealItems", { dealId: deal, productId: burger, qty: 1 });
    await ctx.db.insert("dealItems", { dealId: deal, productId: drink, qty: 1 });
    for (let i = 0; i < 18; i++) {
      await ctx.db.insert("tables", { name: `T${i + 1}`, area: i < 10 ? "Main Hall" : i < 14 ? "Family Room" : "Rooftop", seats: i % 4 === 0 ? 6 : 4, status: i === 1 ? "ordered" : i === 4 ? "billing" : i === 7 ? "reserved" : "free", waiter: ["Ali", "Sana", "Omar"][i % 3] });
    }
    await ctx.db.insert("staff", { name: "Ayesha Khan", role: "Owner", pin: "1001", hourlyRate: 0, active: true });
    await ctx.db.insert("staff", { name: "Sana Iqbal", role: "Cashier", pin: "3301", hourlyRate: 520, active: true });
    await ctx.db.insert("customers", { name: "Walk-in Guest", phone: "-", visits: 12, loyaltyPoints: 0, notes: "Default counter customer" });
    await ctx.db.insert("expenses", { category: "Utilities", amount: 8500, note: "Electricity advance", date: now() });
    await ctx.db.insert("audit", { at: now(), actor: "System", action: `Seeded deployment ${brandId}` });
    return null;
  },
});

export const createOrder = mutation({
  args: { tableId: v.optional(v.id("tables")), channel: v.union(v.literal("Dine-in"), v.literal("Takeaway"), v.literal("Delivery")) },
  handler: async (ctx, args) => {
    const latest = await ctx.db.query("orders").order("desc").take(1);
    const ticketNo = (latest[0]?.ticketNo ?? 0) + 1;
    const orderId = await ctx.db.insert("orders", { ticketNo, tableId: args.tableId, customer: args.channel === "Dine-in" ? "Walk-in" : "", channel: args.channel, status: "draft", discount: 0, serviceCharge: args.channel === "Dine-in" ? 5 : 0, createdAt: now() });
    if (args.tableId) await ctx.db.patch(args.tableId, { status: "seated" });
    await ctx.db.insert("audit", { at: now(), actor: "Cashier", action: `Created ticket #${ticketNo}` });
    return orderId;
  },
});

export const addProductToOrder = mutation({
  args: { orderId: v.id("orders"), productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    await ctx.db.insert("orderItems", { orderId: args.orderId, productId: args.productId, name: product.name, qty: 1, price: product.price, notes: "", station: product.station });
    return null;
  },
});

export const updateOrderItemQty = mutation({
  args: { itemId: v.id("orderItems"), qty: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, { qty: Math.max(1, args.qty) });
  },
});

export const setOrderStatus = mutation({
  args: { orderId: v.id("orders"), status: v.union(v.literal("draft"), v.literal("sent"), v.literal("preparing"), v.literal("ready"), v.literal("served"), v.literal("paid"), v.literal("void")) },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    await ctx.db.patch(args.orderId, { status: args.status });
    if (order.tableId) {
      const status = args.status === "paid" ? "free" : args.status === "served" ? "served" : args.status === "sent" || args.status === "preparing" ? "ordered" : undefined;
      if (status) await ctx.db.patch(order.tableId, { status });
    }
    await ctx.db.insert("audit", { at: now(), actor: "Kitchen", action: `Ticket #${order.ticketNo} moved to ${args.status}` });
    return null;
  },
});

export const saveTable = mutation({
  args: { id: v.optional(v.id("tables")), name: v.string(), area: v.string(), seats: v.number(), status: v.union(v.literal("free"), v.literal("seated"), v.literal("ordered"), v.literal("served"), v.literal("billing"), v.literal("reserved")), waiter: v.string() },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    if (id) await ctx.db.patch(id, fields);
    else await ctx.db.insert("tables", fields);
  },
});
