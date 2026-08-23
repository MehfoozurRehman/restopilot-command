import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'

export type Role = 'Owner' | 'Manager' | 'Cashier' | 'Chef' | 'Waiter' | 'Inventory'
export type TableStatus = 'free' | 'seated' | 'ordered' | 'served' | 'billing' | 'reserved'
export type OrderStatus = 'draft' | 'sent' | 'preparing' | 'ready' | 'served' | 'paid' | 'void'
export type Station = 'Kitchen' | 'Grill' | 'Bar' | 'Dessert'

export type BrandConfig = {
  restaurantName: string
  tagline: string
  accent: string
  receiptFooter: string
  email: string
  password: string
  taxId: string
  currency: string
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  cost: number
  tax: number
  station: Station
  active: boolean
  prepMinutes: number
  recipe: { materialId: string; qty: number }[]
}
export type Deal = { id: string; name: string; price: number; items: { productId: string; qty: number }[]; validDays: string[]; active: boolean }
export type Table = { id: string; name: string; area: string; seats: number; status: TableStatus; waiter: string }
export type Material = { id: string; name: string; unit: string; stock: number; reorderAt: number; costPerUnit: number; vendorId: string }
export type Vendor = { id: string; name: string; phone: string; balance: number; leadDays: number }
export type Staff = { id: string; name: string; role: Role; pin: string; hourlyRate: number; active: boolean }
export type OrderItem = { id: string; productId?: string; dealId?: string; name: string; qty: number; price: number; notes: string; station: string }
export type Order = { id: string; ticketNo: number; tableId?: string; customer: string; channel: 'Dine-in' | 'Takeaway' | 'Delivery'; status: OrderStatus; items: OrderItem[]; discount: number; serviceCharge: number; paidBy?: 'Cash' | 'Card' | 'Wallet' | 'Split'; createdAt: string }
export type Expense = { id: string; category: string; amount: number; note: string; date: string }
export type Customer = { id: string; name: string; phone: string; visits: number; loyaltyPoints: number; notes: string }
export type Reservation = { id: string; customerId: string; tableId: string; guests: number; time: string; status: 'booked' | 'seated' | 'cancelled' | 'completed' }
export type DeliveryJob = { id: string; orderId: string; rider: string; address: string; fee: number; status: 'queued' | 'picked-up' | 'delivered' }
export type Shift = { id: string; staffId: string; openedAt: string; closedAt?: string; openingCash: number; closingCash?: number }
export type AuditEntry = { id: string; at: string; actor: string; action: string }
export type Purchase = { id: string; vendorId: string; materialId: string; qty: number; total: number; status: 'draft' | 'ordered' | 'received'; date: string }

const fallbackBrand: BrandConfig = {
  restaurantName: 'RestoPilot Command',
  tagline: 'Restaurant operations platform',
  accent: '#0f766e',
  receiptFooter: 'Thank you for dining with us.',
  email: 'owner@restopilot.local',
  password: 'change-me',
  taxId: 'NTN-000000',
  currency: 'Rs',
}

const mapId = <T extends { _id: string }>(doc: T) => ({ ...doc, id: doc._id })
const noop = (..._args: unknown[]) => null

export const useRestaurantStore = () => {
  const data = useQuery(api.restaurant.overview)
  const seed = useMutation(api.restaurant.seed)
  const createOrderMutation = useMutation(api.restaurant.createOrder)
  const addProductMutation = useMutation(api.restaurant.addProductToOrder)
  const updateOrderItemQty = useMutation(api.restaurant.updateOrderItemQty)
  const setOrderStatusMutation = useMutation(api.restaurant.setOrderStatus)
  const saveTableMutation = useMutation(api.restaurant.saveTable)
  const [activeOrderId, setActiveOrderId] = useState('')

  useEffect(() => {
    if (data && (!data.brand || data.products.length === 0)) void seed()
  }, [data, seed])

  const orderItemsByOrder = useMemo(() => {
    const grouped = new Map<string, OrderItem[]>()
    for (const item of data?.orderItems ?? []) {
      const row: OrderItem = { id: item._id, productId: item.productId, dealId: item.dealId, name: item.name, qty: item.qty, price: item.price, notes: item.notes, station: item.station }
      grouped.set(item.orderId, [...(grouped.get(item.orderId) ?? []), row])
    }
    return grouped
  }, [data?.orderItems])

  const orders: Order[] = (data?.orders ?? []).map((order) => ({
    id: order._id,
    ticketNo: order.ticketNo,
    tableId: order.tableId,
    customer: order.customer,
    channel: order.channel,
    status: order.status,
    items: orderItemsByOrder.get(order._id) ?? [],
    discount: order.discount,
    serviceCharge: order.serviceCharge,
    paidBy: order.paidBy,
    createdAt: order.createdAt,
  }))

  const products: Product[] = (data?.products ?? []).map((product) => ({ ...mapId(product), recipe: [] }))
  const tables: Table[] = (data?.tables ?? []).map(mapId)

  return {
    brand: data?.brand ? mapId(data.brand) : fallbackBrand,
    products,
    deals: (data?.deals ?? []).map((deal) => ({ ...mapId(deal), items: [] })) as Deal[],
    tables,
    materials: (data?.materials ?? []).map((material) => ({ ...mapId(material), vendorId: material.vendorId ?? '' })) as Material[],
    vendors: (data?.vendors ?? []).map(mapId) as Vendor[],
    staff: (data?.staff ?? []).map(mapId) as Staff[],
    orders,
    expenses: (data?.expenses ?? []).map(mapId) as Expense[],
    purchases: (data?.purchases ?? []).map(mapId) as Purchase[],
    customers: (data?.customers ?? []).map(mapId) as Customer[],
    reservations: (data?.reservations ?? []).map(mapId) as Reservation[],
    deliveries: (data?.deliveries ?? []).map(mapId) as DeliveryJob[],
    shifts: (data?.shifts ?? []).map(mapId) as Shift[],
    audit: (data?.audit ?? []).map(mapId) as AuditEntry[],
    activeOrderId: activeOrderId || orders[0]?.id || '',
    setActiveOrder: setActiveOrderId,
    createOrder: async (tableId?: string, channel: Order['channel'] = 'Dine-in') => {
      const id = await createOrderMutation({ tableId: tableId as Id<'tables'> | undefined, channel })
      if (id) setActiveOrderId(id)
    },
    addProductToOrder: (productId: string) => {
      const orderId = activeOrderId || orders[0]?.id
      if (orderId) void addProductMutation({ orderId: orderId as Id<'orders'>, productId: productId as Id<'products'> })
    },
    addDealToOrder: noop,
    updateOrder: (order: Order) => {
      for (const item of order.items) void updateOrderItemQty({ itemId: item.id as Id<'orderItems'>, qty: item.qty })
    },
    setOrderStatus: (orderId: string, status: OrderStatus) => void setOrderStatusMutation({ orderId: orderId as Id<'orders'>, status }),
    closeOrder: (paidBy: Order['paidBy']) => {
      const orderId = activeOrderId || orders[0]?.id
      if (orderId && paidBy) void setOrderStatusMutation({ orderId: orderId as Id<'orders'>, status: 'paid' })
    },
    updateTable: (table: Table) => void saveTableMutation({ id: table.id as Id<'tables'>, name: table.name, area: table.area, seats: table.seats, status: table.status, waiter: table.waiter }),
    addTable: (table: Omit<Table, 'id'>) => void saveTableMutation(table),
    deleteTable: noop,
    setBrand: noop,
    saveProduct: noop,
    deleteProduct: noop,
    saveDeal: noop,
    deleteDeal: noop,
    saveVendor: noop,
    deleteVendor: noop,
    updateMaterial: noop,
    addMaterial: noop,
    deleteMaterial: noop,
    receivePurchase: noop,
    addExpense: noop,
    deleteExpense: noop,
    addCustomer: noop,
    saveCustomer: noop,
    addReservation: noop,
    setReservationStatus: noop,
    addDelivery: noop,
    setDeliveryStatus: noop,
    saveStaff: noop,
    deleteStaff: noop,
    openShift: noop,
    closeShift: noop,
    importSnapshot: noop,
  }
}

export const orderTotals = (order: Order) => {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const discount = subtotal * (order.discount / 100)
  const service = (subtotal - discount) * (order.serviceCharge / 100)
  const total = subtotal - discount + service
  return { subtotal, discount, service, total }
}
