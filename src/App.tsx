import {
  BadgeDollarSign,
  Boxes,
  CalendarClock,
  ChefHat,
  ClipboardList,
  CreditCard,
  Download,
  Factory,
  Gauge,
  HandCoins,
  History,
  LayoutDashboard,
  PackagePlus,
  Percent,
  Printer,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Star,
  Table2,
  Truck,
  Upload,
  Users,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { format } from 'date-fns'
import { orderTotals, useRestaurantStore } from './store'
import type { Deal, Material, Order, Product, Purchase, Role, Staff, Table, Vendor } from './store'
import './App.css'

const money = (value: number, currency: string) => `${currency} ${Math.round(value).toLocaleString()}`

const nav = [
  ['/command', LayoutDashboard, 'Command'],
  ['/pos', ReceiptText, 'POS'],
  ['/tables', Table2, 'Tables'],
  ['/kitchen', ChefHat, 'Kitchen'],
  ['/menu', ShoppingBasket, 'Products & Deals'],
  ['/inventory', Boxes, 'Raw Materials'],
  ['/purchase', PackagePlus, 'Purchasing'],
  ['/guests', Star, 'Guests'],
  ['/delivery', Truck, 'Delivery'],
  ['/people', Users, 'Staff'],
  ['/finance', BadgeDollarSign, 'Finance'],
  ['/audit', History, 'Audit'],
  ['/settings', Settings, 'Setup'],
] as const

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const screen = nav.find(([path]) => location.pathname === path)?.[0] ?? '/command'
  const store = useRestaurantStore()
  const activeOrder = store.orders.find((order) => order.id === store.activeOrderId) ?? store.orders[0]
  const paidOrders = store.orders.filter((order) => order.status === 'paid')
  const revenue = paidOrders.reduce((sum, order) => sum + orderTotals(order).total, 0)
  const openOrders = store.orders.filter((order) => order.status !== 'paid' && order.status !== 'void')
  const lowStock = store.materials.filter((material) => material.stock <= material.reorderAt)
  const fileInput = useRef<HTMLInputElement>(null)

  const snapshot = () => {
    const data = localStorage.getItem('restaurant-command-pos-v1') ?? '{}'
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `restaurant-command-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const restore = async (file?: File) => {
    if (!file) return
    const parsed = JSON.parse(await file.text())
    store.importSnapshot(parsed.state ?? parsed)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-slate-800 bg-[#0b1220] text-white shadow-xl">
        <div className="border-b border-white/10 p-3">
          <div className="flex items-center gap-2.5">
            <img className="size-9 rounded-lg shadow shadow-black/20" src="/brand-mark.svg" alt="RestoPilot mark" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold">{store.brand.restaurantName}</h1>
              <p className="truncate text-xs text-slate-300">{store.brand.tagline}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {nav.map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={clsx('group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-semibold transition', screen === id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white')}
            >
              <Icon size={15} className={clsx(screen === id ? 'text-teal-700' : 'text-slate-400 group-hover:text-white')} />
              {label}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-3 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span>Local data</span>
            <span className="rounded bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-200">On device</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={snapshot} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white/10 px-2 py-1.5 font-semibold transition hover:bg-white/15">
              <Download size={14} /> Backup
            </button>
            <button onClick={() => fileInput.current?.click()} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white/10 px-2 py-1.5 font-semibold transition hover:bg-white/15">
              <Upload size={14} /> Restore
            </button>
          </div>
          <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={(event) => restore(event.target.files?.[0])} />
        </div>
      </aside>

      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-slate-100/95 px-4 backdrop-blur">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">{format(new Date(), 'EEE, dd MMM yyyy')}</p>
            <h2 className="text-lg font-black text-slate-950">{nav.find(([id]) => id === screen)?.[2]}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold shadow-sm">Open: {openOrders.length}</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 font-semibold text-amber-900 shadow-sm">Low stock: {lowStock.length}</span>
          </div>
        </header>

        <section className="p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/command" replace />} />
            <Route path="/command" element={<Command revenue={revenue} openOrders={openOrders} lowStock={lowStock.length} />} />
            <Route path="/pos" element={<Pos activeOrder={activeOrder} />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/purchase" element={<Purchasing />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/people" element={<People />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/settings" element={<Setup />} />
          </Routes>
        </section>
      </main>
    </div>
  )
}

function Command({ revenue, openOrders, lowStock }: { revenue: number; openOrders: Order[]; lowStock: number }) {
  const { brand, orders, tables, materials, staff, expenses } = useRestaurantStore()
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <Metric icon={HandCoins} label="Paid revenue" value={money(revenue, brand.currency)} />
        <Metric icon={ClipboardList} label="Open orders" value={openOrders.length.toString()} />
        <Metric icon={Table2} label="Occupied tables" value={tables.filter((table) => table.status !== 'free').length.toString()} />
        <Metric icon={Gauge} label="Net after expenses" value={money(revenue - expenseTotal, brand.currency)} />
      </div>
      <div className="grid grid-cols-[1.35fr_.65fr] gap-3">
        <Panel title="Operating Pulse">
          <div className="grid grid-cols-3 gap-2">
            {['Dine-in', 'Takeaway', 'Delivery'].map((channel) => (
              <div key={channel} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs text-slate-500">{channel}</p>
                <p className="mt-1 text-xl font-semibold">{orders.filter((order) => order.channel === channel).length}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            {orders.slice(0, 7).map((order) => (
              <div key={order.id} className="grid grid-cols-5 border-b border-slate-100 px-3 py-2 text-xs last:border-b-0">
                <span>#{order.ticketNo}</span>
                <span>{order.channel}</span>
                <span>{order.status}</span>
                <span>{order.items.length} items</span>
                <span className="text-right">{money(orderTotals(order).total, brand.currency)}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Management Alerts">
          <Alert icon={Boxes} label={`${lowStock} materials need reorder`} />
          <Alert icon={Users} label={`${staff.filter((person) => person.active).length} active staff profiles`} />
          <Alert icon={Factory} label={`${materials.length} recipe-linked raw materials`} />
          <Alert icon={Star} label={`${staff.length} staff roles, guest profiles, loyalty, shifts, and audit covered`} />
          <Alert icon={ShieldCheck} label="Owner email and password configurable in Setup" />
        </Panel>
      </div>
    </div>
  )
}

function Pos({ activeOrder }: { activeOrder?: Order }) {
  const store = useRestaurantStore()
  const [channel, setChannel] = useState<Order['channel']>('Dine-in')
  const totals = activeOrder ? orderTotals(activeOrder) : undefined
  return (
    <div className="grid grid-cols-[1fr_390px] gap-3">
      <div className="space-y-3">
        <Panel title="Start Ticket">
          <div className="flex flex-wrap gap-2">
            {(['Dine-in', 'Takeaway', 'Delivery'] as const).map((item) => (
              <button key={item} onClick={() => setChannel(item)} className={clsx('rounded-md border px-3 py-1.5 text-xs font-bold transition', channel === item ? 'border-teal-700 bg-teal-700 text-white shadow shadow-teal-900/10' : 'border-slate-300 bg-white hover:border-teal-300')}>
                {item}
              </button>
            ))}
            <button onClick={() => store.createOrder(undefined, channel)} className="rounded-md bg-slate-950 px-3 py-1.5 text-xs font-bold text-white shadow transition hover:bg-slate-800">New ticket</button>
            {activeOrder && <button onClick={() => store.setOrderStatus(activeOrder.id, 'sent')} className="rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900">Send to kitchen</button>}
          </div>
        </Panel>
        <Panel title="Products">
          <div className="grid grid-cols-5 gap-2">
            {store.products.filter((product) => product.active).map((product) => (
              <button key={product.id} onClick={() => store.addProductToOrder(product.id)} className="rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-teal-600 hover:shadow">
                <p className="text-sm font-bold">{product.name}</p>
                <p className="text-xs text-slate-500">{product.category} · {product.station}</p>
                <p className="mt-2 text-sm font-black">{money(product.price, store.brand.currency)}</p>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Deals">
          <div className="grid grid-cols-3 gap-2">
            {store.deals.map((deal) => (
              <button key={deal.id} onClick={() => store.addDealToOrder(deal.id)} className="rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-orange-500 hover:shadow">
                <p className="text-sm font-bold">{deal.name}</p>
                <p className="text-xs text-slate-500">{deal.items.length} lines · {deal.validDays.join(', ')}</p>
                <p className="mt-2 text-sm font-black">{money(deal.price, store.brand.currency)}</p>
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title={activeOrder ? `Ticket #${activeOrder.ticketNo}` : 'No Active Ticket'}>
        {activeOrder ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {activeOrder.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_52px_82px] items-center gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.station}</p>
                  </div>
                  <input className="input" type="number" min={1} value={item.qty} onChange={(event) => store.updateOrder({ ...activeOrder, items: activeOrder.items.map((line) => line.id === item.id ? { ...line, qty: Number(event.target.value) } : line) })} />
                  <span className="text-right text-sm font-semibold">{money(item.price * item.qty, store.brand.currency)}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Discount %<input className="input mt-1" type="number" value={activeOrder.discount} onChange={(event) => store.updateOrder({ ...activeOrder, discount: Number(event.target.value) })} /></label>
              <label className="text-sm">Service %<input className="input mt-1" type="number" value={activeOrder.serviceCharge} onChange={(event) => store.updateOrder({ ...activeOrder, serviceCharge: Number(event.target.value) })} /></label>
            </div>
            <select className="input" value={activeOrder.status} onChange={(event) => store.setOrderStatus(activeOrder.id, event.target.value as Order['status'])}>
              {['draft', 'sent', 'preparing', 'ready', 'served', 'paid', 'void'].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <div className="rounded-md bg-slate-950 p-3 text-white shadow shadow-slate-900/20">
              <Row label="Subtotal" value={money(totals!.subtotal, store.brand.currency)} />
              <Row label="Discount" value={money(totals!.discount, store.brand.currency)} />
              <Row label="Service" value={money(totals!.service, store.brand.currency)} />
              <div className="mt-2 flex justify-between border-t border-white/20 pt-2 text-lg font-black"><span>Total</span><span>{money(totals!.total, store.brand.currency)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['Cash', 'Card', 'Wallet', 'Split'] as const).map((method) => (
                <button key={method} onClick={() => store.closeOrder(method)} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-teal-700 px-2 py-2 text-sm font-bold text-white shadow transition hover:bg-teal-800">
                  <CreditCard size={15} /> {method}
                </button>
              ))}
            </div>
            <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold shadow-sm transition hover:border-slate-400"><Printer size={15} /> Print receipt</button>
          </div>
        ) : <p className="text-sm text-stone-500">Create a ticket or select a table to begin.</p>}
      </Panel>
    </div>
  )
}

function Tables() {
  const store = useRestaurantStore()
  const [table, setTable] = useState<Omit<Table, 'id'>>({ name: '', area: 'Main Hall', seats: 4, status: 'free', waiter: '' })
  return (
    <div className="space-y-3">
      <Panel title="Create Table">
        <div className="grid grid-cols-5 gap-2">
          <input className="input" placeholder="Table name" value={table.name} onChange={(event) => setTable({ ...table, name: event.target.value })} />
          <input className="input" placeholder="Area" value={table.area} onChange={(event) => setTable({ ...table, area: event.target.value })} />
          <input className="input" type="number" min={1} value={table.seats} onChange={(event) => setTable({ ...table, seats: Number(event.target.value) })} />
          <input className="input" placeholder="Waiter" value={table.waiter} onChange={(event) => setTable({ ...table, waiter: event.target.value })} />
          <Action onClick={() => { if (table.name) store.addTable(table); setTable({ name: '', area: 'Main Hall', seats: 4, status: 'free', waiter: '' }) }}>Add table</Action>
        </div>
      </Panel>
      <div className="grid grid-cols-8 gap-2">
        {store.tables.map((item) => (
          <div key={item.id} className={clsx('rounded-md border p-3 text-left shadow-sm transition hover:shadow', item.status === 'free' ? 'border-slate-200 bg-white' : 'border-teal-600 bg-teal-50')}>
            <button className="w-full text-left" onClick={() => store.createOrder(item.id, 'Dine-in')}>
              <p className="text-lg font-black">{item.name}</p>
              <p className="text-xs text-slate-500">{item.area} · {item.seats}</p>
            </button>
            <select className="input mt-3" value={item.status} onChange={(event) => store.updateTable({ ...item, status: event.target.value as Table['status'] })}>
              {['free', 'seated', 'ordered', 'served', 'billing', 'reserved'].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button className="mt-1 text-[11px] font-bold text-red-700" onClick={() => store.deleteTable(item.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Kitchen() {
  const { orders, setOrderStatus } = useRestaurantStore()
  const tickets = orders.filter((order) => ['sent', 'preparing', 'ready', 'draft'].includes(order.status) && order.items.length)
  return (
    <div className="grid grid-cols-4 gap-4">
      {['Kitchen', 'Grill', 'Bar', 'Dessert'].map((station) => (
        <Panel key={station} title={station}>
          <div className="space-y-3">
            {tickets.flatMap((order) => order.items.filter((item) => item.station === station).map((item) => ({ item, order }))).map(({ item, order }) => (
              <div key={item.id} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
                <p className="font-semibold">#{order.ticketNo} · {item.name}</p>
                <p className="text-sm text-stone-500">Qty {item.qty} · {order.channel}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900" onClick={() => setOrderStatus(order.id, 'preparing')}>Prep</button>
                  <button className="rounded bg-teal-100 px-2 py-1 text-xs font-bold text-teal-900" onClick={() => setOrderStatus(order.id, 'ready')}>Ready</button>
                  <button className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-900" onClick={() => setOrderStatus(order.id, 'served')}>Served</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  )
}

function Menu() {
  const store = useRestaurantStore()
  const [product, setProduct] = useState<Product>({ id: '', name: '', category: '', price: 0, cost: 0, tax: 0.16, station: 'Kitchen', active: true, prepMinutes: 10, recipe: [] })
  const [deal, setDeal] = useState<Deal>({ id: '', name: '', price: 0, items: [], validDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], active: true })
  return (
    <div className="space-y-5">
      <Panel title="Product Editor">
        <div className="grid grid-cols-7 gap-3">
          <input className="input" placeholder="Name" value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} />
          <input className="input" placeholder="Category" value={product.category} onChange={(event) => setProduct({ ...product, category: event.target.value })} />
          <input className="input" type="number" placeholder="Price" value={product.price} onChange={(event) => setProduct({ ...product, price: Number(event.target.value) })} />
          <input className="input" type="number" placeholder="Cost" value={product.cost} onChange={(event) => setProduct({ ...product, cost: Number(event.target.value) })} />
          <select className="input" value={product.station} onChange={(event) => setProduct({ ...product, station: event.target.value as Product['station'] })}>{['Kitchen', 'Grill', 'Bar', 'Dessert'].map((s) => <option key={s}>{s}</option>)}</select>
          <input className="input" type="number" placeholder="Prep min" value={product.prepMinutes} onChange={(event) => setProduct({ ...product, prepMinutes: Number(event.target.value) })} />
          <Action onClick={() => { if (product.name) store.saveProduct(product); setProduct({ id: '', name: '', category: '', price: 0, cost: 0, tax: 0.16, station: 'Kitchen', active: true, prepMinutes: 10, recipe: [] }) }}>Save</Action>
        </div>
      </Panel>
      <div className="grid grid-cols-2 gap-5">
        <Panel title="Menu Items">
          <div className="space-y-2">{store.products.map((p) => <RecordRow key={p.id} title={p.name} meta={`${p.category} · ${money(p.price, store.brand.currency)} · ${p.station}`} onEdit={() => setProduct(p)} onDelete={() => store.deleteProduct(p.id)} />)}</div>
        </Panel>
        <Panel title="Deals">
          <div className="grid grid-cols-[1fr_120px_120px] gap-3">
            <input className="input" placeholder="Deal name" value={deal.name} onChange={(event) => setDeal({ ...deal, name: event.target.value })} />
            <input className="input" type="number" placeholder="Price" value={deal.price} onChange={(event) => setDeal({ ...deal, price: Number(event.target.value) })} />
            <Action onClick={() => { if (deal.name) store.saveDeal(deal); setDeal({ id: '', name: '', price: 0, items: [], validDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], active: true }) }}>Save</Action>
          </div>
          <div className="mt-4 space-y-2">{store.deals.map((d) => <RecordRow key={d.id} title={d.name} meta={`${money(d.price, store.brand.currency)} · ${d.active ? 'Active' : 'Off'}`} onEdit={() => setDeal(d)} onDelete={() => store.deleteDeal(d.id)} />)}</div>
        </Panel>
      </div>
    </div>
  )
}

function Inventory() {
  const store = useRestaurantStore()
  const [material, setMaterial] = useState<Omit<Material, 'id'>>({ name: '', unit: 'kg', stock: 0, reorderAt: 0, costPerUnit: 0, vendorId: store.vendors[0]?.id ?? '' })
  const [vendor, setVendor] = useState<Vendor>({ id: '', name: '', phone: '', balance: 0, leadDays: 1 })
  return (
    <div className="space-y-5">
      <Panel title="Add Raw Material">
        <div className="grid grid-cols-7 gap-3">
          <input className="input" placeholder="Material" value={material.name} onChange={(event) => setMaterial({ ...material, name: event.target.value })} />
          <input className="input" placeholder="Unit" value={material.unit} onChange={(event) => setMaterial({ ...material, unit: event.target.value })} />
          <input className="input" type="number" placeholder="Stock" value={material.stock} onChange={(event) => setMaterial({ ...material, stock: Number(event.target.value) })} />
          <input className="input" type="number" placeholder="Reorder" value={material.reorderAt} onChange={(event) => setMaterial({ ...material, reorderAt: Number(event.target.value) })} />
          <input className="input" type="number" placeholder="Cost" value={material.costPerUnit} onChange={(event) => setMaterial({ ...material, costPerUnit: Number(event.target.value) })} />
          <select className="input" value={material.vendorId} onChange={(event) => setMaterial({ ...material, vendorId: event.target.value })}>{store.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          <Action onClick={() => { if (material.name) store.addMaterial(material); setMaterial({ name: '', unit: 'kg', stock: 0, reorderAt: 0, costPerUnit: 0, vendorId: store.vendors[0]?.id ?? '' }) }}>Add</Action>
        </div>
      </Panel>
      <div className="grid grid-cols-[1fr_420px] gap-5">
        <Panel title="Raw Materials">
          <div className="space-y-2">{store.materials.map((m) => <RecordRow key={m.id} title={m.name} meta={`${m.stock} ${m.unit} · reorder ${m.reorderAt} · ${money(m.costPerUnit, store.brand.currency)}`} onEdit={() => store.updateMaterial({ ...m, stock: m.stock + 1 })} onDelete={() => store.deleteMaterial(m.id)} editLabel="+1 stock" />)}</div>
        </Panel>
        <Panel title="Vendors">
          <div className="space-y-3">
            <input className="input" placeholder="Vendor name" value={vendor.name} onChange={(event) => setVendor({ ...vendor, name: event.target.value })} />
            <input className="input" placeholder="Phone" value={vendor.phone} onChange={(event) => setVendor({ ...vendor, phone: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" placeholder="Balance" value={vendor.balance} onChange={(event) => setVendor({ ...vendor, balance: Number(event.target.value) })} />
              <input className="input" type="number" placeholder="Lead days" value={vendor.leadDays} onChange={(event) => setVendor({ ...vendor, leadDays: Number(event.target.value) })} />
            </div>
            <Action onClick={() => { if (vendor.name) store.saveVendor(vendor); setVendor({ id: '', name: '', phone: '', balance: 0, leadDays: 1 }) }}>Save vendor</Action>
            <div className="space-y-2">{store.vendors.map((v) => <RecordRow key={v.id} title={v.name} meta={`${v.phone} · payable ${money(v.balance, store.brand.currency)}`} onEdit={() => setVendor(v)} onDelete={() => store.deleteVendor(v.id)} />)}</div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Purchasing() {
  const store = useRestaurantStore()
  const [purchase, setPurchase] = useState<Purchase>({ id: '', vendorId: store.vendors[0]?.id, materialId: store.materials[0]?.id, qty: 1, total: 0, status: 'draft', date: new Date().toISOString() })
  return (
    <div className="grid grid-cols-[420px_1fr] gap-4">
      <Panel title="Receive Stock">
        <div className="space-y-3">
          <select className="input" value={purchase.vendorId} onChange={(event) => setPurchase({ ...purchase, vendorId: event.target.value })}>{store.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          <select className="input" value={purchase.materialId} onChange={(event) => setPurchase({ ...purchase, materialId: event.target.value })}>{store.materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <input className="input" type="number" min={1} value={purchase.qty} onChange={(event) => setPurchase({ ...purchase, qty: Number(event.target.value) })} />
          <input className="input" type="number" min={0} placeholder="Total invoice" value={purchase.total} onChange={(event) => setPurchase({ ...purchase, total: Number(event.target.value) })} />
          <button onClick={() => store.receivePurchase(purchase)} className="w-full rounded-lg bg-slate-950 px-4 py-3 font-bold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800">Receive purchase</button>
        </div>
      </Panel>
      <DataGrid title="Purchase history" rows={store.purchases.map((p) => [format(new Date(p.date), 'dd MMM'), store.vendors.find((v) => v.id === p.vendorId)?.name ?? '', store.materials.find((m) => m.id === p.materialId)?.name ?? '', p.qty, money(p.total, store.brand.currency), p.status])} />
    </div>
  )
}

function People() {
  const { staff, brand, shifts, openShift, closeShift, saveStaff, deleteStaff } = useRestaurantStore()
  const open = shifts.find((shift) => !shift.closedAt)
  const [person, setPerson] = useState<Staff>({ id: '', name: '', role: 'Waiter', pin: '', hourlyRate: 0, active: true })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Panel title="Cash Shift">
          <div className="space-y-3">
            <p className="text-sm text-stone-600">{open ? `Open shift since ${format(new Date(open.openedAt), 'hh:mm a')}` : 'No open cash shift'}</p>
            {open ? (
              <button onClick={() => closeShift(open.id, open.openingCash)} className="w-full rounded-lg bg-slate-950 px-4 py-3 font-bold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800">Close shift</button>
            ) : (
              <button onClick={() => openShift(staff[0].id, 10000)} className="w-full rounded-lg bg-teal-700 px-4 py-3 font-bold text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-800">Open shift</button>
            )}
          </div>
        </Panel>
        <Metric icon={Users} label="Active staff" value={staff.filter((p) => p.active).length.toString()} />
        <Metric icon={HandCoins} label="Shift records" value={shifts.length.toString()} />
      </div>
      <Panel title="Staff Editor">
        <div className="grid grid-cols-6 gap-3">
          <input className="input" placeholder="Name" value={person.name} onChange={(event) => setPerson({ ...person, name: event.target.value })} />
          <select className="input" value={person.role} onChange={(event) => setPerson({ ...person, role: event.target.value as Role })}>{['Owner', 'Manager', 'Cashier', 'Chef', 'Waiter', 'Inventory'].map((role) => <option key={role}>{role}</option>)}</select>
          <input className="input" placeholder="PIN" value={person.pin} onChange={(event) => setPerson({ ...person, pin: event.target.value })} />
          <input className="input" type="number" placeholder="Hourly rate" value={person.hourlyRate} onChange={(event) => setPerson({ ...person, hourlyRate: Number(event.target.value) })} />
          <select className="input" value={person.active ? 'active' : 'inactive'} onChange={(event) => setPerson({ ...person, active: event.target.value === 'active' })}><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <Action onClick={() => { if (person.name) saveStaff(person); setPerson({ id: '', name: '', role: 'Waiter', pin: '', hourlyRate: 0, active: true }) }}>Save</Action>
        </div>
      </Panel>
      <Panel title="Staff, roles, pins, payroll base">
        <div className="space-y-2">{staff.map((p) => <RecordRow key={p.id} title={p.name} meta={`${p.role} · PIN ${p.pin} · ${money(p.hourlyRate, brand.currency)} · ${p.active ? 'Active' : 'Inactive'}`} onEdit={() => setPerson(p)} onDelete={() => deleteStaff(p.id)} />)}</div>
      </Panel>
    </div>
  )
}

function Guests() {
  const store = useRestaurantStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [reservation, setReservation] = useState({ customerId: store.customers[0]?.id ?? '', tableId: store.tables[0]?.id ?? '', guests: 2, time: new Date().toISOString().slice(0, 16) })
  return (
    <div className="grid grid-cols-[380px_1fr] gap-4">
      <Panel title="Guest Profile">
        <div className="space-y-3">
          <input className="input" placeholder="Customer name" value={name} onChange={(event) => setName(event.target.value)} />
          <input className="input" placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <button onClick={() => { if (name) store.addCustomer({ name, phone, notes: '' }); setName(''); setPhone('') }} className="w-full rounded-lg bg-slate-950 px-4 py-3 font-bold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800">Save guest</button>
        </div>
      </Panel>
      <DataGrid title="Customers, loyalty, visit history" rows={store.customers.map((c) => [c.name, c.phone, `${c.visits} visits`, `${c.loyaltyPoints} points`, c.notes || 'No notes'])} />
      <div className="col-span-2">
        <Panel title="Create Reservation">
          <div className="grid grid-cols-5 gap-3">
            <select className="input" value={reservation.customerId} onChange={(event) => setReservation({ ...reservation, customerId: event.target.value })}>{store.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select className="input" value={reservation.tableId} onChange={(event) => setReservation({ ...reservation, tableId: event.target.value })}>{store.tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <input className="input" type="number" value={reservation.guests} onChange={(event) => setReservation({ ...reservation, guests: Number(event.target.value) })} />
            <input className="input" type="datetime-local" value={reservation.time} onChange={(event) => setReservation({ ...reservation, time: event.target.value })} />
            <Action onClick={() => store.addReservation({ ...reservation, time: new Date(reservation.time).toISOString() })}>Book</Action>
          </div>
        </Panel>
        <div className="mt-4 space-y-2">{store.reservations.map((r) => <RecordRow key={r.id} title={`${format(new Date(r.time), 'dd MMM hh:mm a')} · ${store.customers.find((c) => c.id === r.customerId)?.name ?? ''}`} meta={`${store.tables.find((t) => t.id === r.tableId)?.name ?? ''} · ${r.guests} guests · ${r.status}`} onEdit={() => store.setReservationStatus(r.id, r.status === 'booked' ? 'seated' : 'completed')} editLabel="Advance" onDelete={() => store.setReservationStatus(r.id, 'cancelled')} deleteLabel="Cancel" />)}</div>
      </div>
    </div>
  )
}

function Delivery() {
  const store = useRestaurantStore()
  const deliveryOrders = store.orders.filter((o) => o.channel === 'Delivery')
  const [delivery, setDelivery] = useState({ orderId: deliveryOrders[0]?.id ?? '', rider: '', address: '', fee: 0 })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Metric icon={Truck} label="Delivery jobs" value={store.deliveries.length.toString()} />
        <Metric icon={ReceiptText} label="Delivery orders" value={store.orders.filter((o) => o.channel === 'Delivery').length.toString()} />
        <Metric icon={HandCoins} label="Delivery fees" value={money(store.deliveries.reduce((sum, item) => sum + item.fee, 0), store.brand.currency)} />
        <Metric icon={Users} label="Customers" value={store.customers.length.toString()} />
      </div>
      <Panel title="Create Delivery Job">
        <div className="grid grid-cols-5 gap-3">
          <select className="input" value={delivery.orderId} onChange={(event) => setDelivery({ ...delivery, orderId: event.target.value })}>{deliveryOrders.map((o) => <option key={o.id} value={o.id}>Ticket #{o.ticketNo}</option>)}</select>
          <input className="input" placeholder="Rider" value={delivery.rider} onChange={(event) => setDelivery({ ...delivery, rider: event.target.value })} />
          <input className="input" placeholder="Address" value={delivery.address} onChange={(event) => setDelivery({ ...delivery, address: event.target.value })} />
          <input className="input" type="number" placeholder="Fee" value={delivery.fee} onChange={(event) => setDelivery({ ...delivery, fee: Number(event.target.value) })} />
          <Action onClick={() => { if (delivery.orderId) store.addDelivery(delivery); setDelivery({ orderId: deliveryOrders[0]?.id ?? '', rider: '', address: '', fee: 0 }) }}>Dispatch</Action>
        </div>
      </Panel>
      <Panel title="Delivery dispatch board">
        <div className="space-y-2">{store.deliveries.map((d) => <RecordRow key={d.id} title={`Ticket ${store.orders.find((o) => o.id === d.orderId)?.ticketNo ?? d.orderId}`} meta={`${d.rider} · ${d.address} · ${money(d.fee, store.brand.currency)} · ${d.status}`} onEdit={() => store.setDeliveryStatus(d.id, d.status === 'queued' ? 'picked-up' : 'delivered')} editLabel="Advance" onDelete={() => store.setDeliveryStatus(d.id, 'delivered')} deleteLabel="Delivered" />)}</div>
      </Panel>
    </div>
  )
}

function Finance() {
  const store = useRestaurantStore()
  const [expense, setExpense] = useState({ category: '', amount: 0, note: '', date: new Date().toISOString() })
  const rows = useMemo(() => store.expenses.map((expense) => [format(new Date(expense.date), 'dd MMM'), expense.category, expense.note, money(expense.amount, store.brand.currency)]), [store.expenses, store.brand.currency])
  return (
    <div className="grid grid-cols-3 gap-4">
      <Metric icon={Percent} label="Tax ready items" value={store.products.filter((item) => item.tax > 0).length.toString()} />
      <Metric icon={CalendarClock} label="Expense entries" value={store.expenses.length.toString()} />
      <Metric icon={HandCoins} label="Vendor payable" value={money(store.vendors.reduce((sum, item) => sum + item.balance, 0), store.brand.currency)} />
      <div className="col-span-3">
        <Panel title="Record Expense">
          <div className="grid grid-cols-5 gap-3">
            <input className="input" placeholder="Category" value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })} />
            <input className="input" type="number" placeholder="Amount" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: Number(event.target.value) })} />
            <input className="input col-span-2" placeholder="Note" value={expense.note} onChange={(event) => setExpense({ ...expense, note: event.target.value })} />
            <Action onClick={() => { if (expense.category) store.addExpense(expense); setExpense({ category: '', amount: 0, note: '', date: new Date().toISOString() }) }}>Save expense</Action>
          </div>
        </Panel>
      </div>
      <div className="col-span-3"><DataGrid title="Expenses and cash controls" rows={rows} /></div>
    </div>
  )
}

function Setup() {
  const store = useRestaurantStore()
  const [brand, setBrand] = useState(store.brand)
  return (
    <Panel title="RestoPilot Branding, Login Config, Receipt Setup">
      <div className="mb-5 flex items-center gap-4 rounded border border-stone-200 bg-white p-4">
        <img className="h-20 w-80 object-contain object-left" src="/brand-logo.svg" alt="RestoPilot Command logo" />
        <div className="text-sm text-stone-600">
          <p className="font-semibold text-stone-950">Installed product identity</p>
          <p>App name, window title, installer metadata, favicon, and Electron icon are configured.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(brand).map(([key, value]) => (
          <label key={key} className="text-sm font-medium capitalize">
            {key.replace(/([A-Z])/g, ' $1')}
            <input className="input mt-1" type={key === 'password' ? 'password' : key === 'accent' ? 'color' : 'text'} value={value} onChange={(event) => setBrand({ ...brand, [key]: event.target.value })} />
          </label>
        ))}
      </div>
      <button onClick={() => store.setBrand(brand)} className="mt-4 rounded-lg bg-teal-700 px-4 py-3 font-bold text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-800">Save configuration</button>
    </Panel>
  )
}

function Audit() {
  const { audit } = useRestaurantStore()
  return <DataGrid title="Local audit trail" rows={audit.map((entry) => [format(new Date(entry.at), 'dd MMM hh:mm a'), entry.actor, entry.action])} />
}

function Metric({ icon: Icon, label, value }: { icon: ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid size-8 place-items-center rounded-md bg-teal-50 text-teal-700">
        <Icon size={17} />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"><h3 className="mb-2.5 border-b border-slate-100 pb-2 text-sm font-black text-slate-950">{title}</h3>{children}</section>
}

function Alert({ icon: Icon, label }: { icon: ComponentType<{ size?: number; className?: string }>; label: string }) {
  return <div className="mb-2 flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm"><span className="grid size-7 place-items-center rounded bg-teal-50"><Icon size={15} className="text-teal-700" /></span><span className="text-xs font-medium text-slate-700">{label}</span></div>
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between py-0.5 text-xs"><span className="text-slate-300">{label}</span><span>{value}</span></div>
}

function DataGrid({ title, rows }: { title: string; rows: (string | number)[][] }) {
  return (
    <Panel title={title}>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={index} className="grid grid-cols-6 gap-2 border-b border-slate-100 px-3 py-2 text-xs transition last:border-b-0 hover:bg-slate-50">
              {row.map((cell, cellIndex) => <span key={cellIndex} className={clsx('truncate', cellIndex === 0 ? 'font-bold text-slate-950' : 'font-medium text-slate-600')}>{cell}</span>)}
            </div>
          ))
        ) : (
          <div className="px-3 py-6 text-center text-xs font-medium text-slate-500">No records yet</div>
        )}
      </div>
    </Panel>
  )
}

function Action({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-slate-800">{children}</button>
}

function RecordRow({ title, meta, onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete' }: { title: string; meta: string; onEdit: () => void; onDelete: () => void; editLabel?: string; deleteLabel?: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-950">{title}</p>
        <p className="truncate text-[11px] font-medium text-slate-500">{meta}</p>
      </div>
      <button onClick={onEdit} className="rounded border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:border-teal-400 hover:text-teal-800">{editLabel}</button>
      <button onClick={onDelete} className="rounded border border-red-100 bg-red-50 px-2 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-100">{deleteLabel}</button>
    </div>
  )
}

export default App
