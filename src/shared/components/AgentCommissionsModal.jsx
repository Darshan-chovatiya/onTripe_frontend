import { useState, useMemo } from 'react'
import { X, User, Ticket, IndianRupee, Mail, Hash, Users, Calendar, ArrowRight, Zap, ChevronRight, Info, BarChart3, PieChart, TrendingUp } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'

export default function AgentCommissionsModal({ isOpen, onClose, data = [], individualBookings = [], whitelabelAgents = [], basePrice = 0, title = 'Financial Breakdown' }) {
  const [activeTab, setActiveTab] = useState('agents')

  const totalPackageRevenue = individualBookings.reduce((sum, b) => sum + (Number(b.parentEarned) || 0) + (Number(b.childEarned) || 0), 0)
  const totalParentEarnings = individualBookings.reduce((sum, b) => sum + (Number(b.parentEarned) || 0), 0)
  const totalChildCommissions = individualBookings.reduce((sum, b) => sum + (Number(b.childEarned) || 0), 0)

  const treeData = useMemo(() => {
    // 1. Collect all agents from both sources (whitelabels and actual sales)
    const agentMap = new Map()

    // Add potential agents from whitelabels
    whitelabelAgents.forEach(wa => {
      const aid = String(wa._id || wa.id || wa.agentCode) // Use a reliable ID
      if (!agentMap.has(aid)) {
        agentMap.set(aid, {
          id: aid,
          name: wa.name,
          agentCode: wa.agentCode,
          email: wa.email,
          role: wa.role || 'child_agent',
          parentRef: wa.parentRef,
          earnings: 0,
          baseEarnings: 0,
          extraIncome: 0,
          bookings: 0,
          potentialCommission: (Number(wa.finalPrice) || 0) - (Number(basePrice) || 0),
          children: [],
          customers: []
        })
      }
    })

    // Add/Update agents from actual sales data
    data.forEach(sd => {
      const aid = String(sd.agentId || sd.agentCode)
      if (!agentMap.has(aid)) {
        agentMap.set(aid, {
          id: aid,
          name: sd.name,
          agentCode: sd.agentCode,
          role: sd.role,
          parentRef: sd.parentRef,
          earnings: 0,
          baseEarnings: 0,
          extraIncome: 0,
          bookings: 0,
          children: [],
          customers: []
        })
      }
      const agent = agentMap.get(aid)
      agent.earnings = sd.earnings
      agent.baseEarnings = sd.baseEarnings
      agent.extraIncome = sd.extraIncome
      agent.bookings = sd.bookings
    })

    // 3. Build the hierarchy
    const root = {
      id: 'root',
      name: 'My Agency',
      role: 'parent_agent',
      isRoot: true,
      children: [],
      customers: []
    }

    // 2. Add customers to their respective agents
    individualBookings.forEach(b => {
      const aid = String(b.agentId || b.agentCode)
      if (agentMap.has(aid)) {
        agentMap.get(aid).customers.push(b)
      } else {
        // If not in agentMap, it belongs to the root (Parent Agent)
        root.customers.push(b)
      }
    })

    const agents = Array.from(agentMap.values())
    agents.forEach(agent => {
      const parentId = agent.parentRef ? String(agent.parentRef._id || agent.parentRef) : null
      if (parentId && agentMap.has(parentId)) {
        agentMap.get(parentId).children.push(agent)
      } else {
        // If no parent found or parent is the root (current user)
        root.children.push(agent)
      }
    })

    // 4. Aggregation Logic
    const aggregate = (node) => {
      let totalBookings = node.customers?.length || 0
      let totalEarnings = node.customers?.reduce((sum, c) => sum + (Number(c.childEarned) || 0), 0)

      node.children?.forEach(child => {
        const totals = aggregate(child)
        totalBookings += totals.bookings
        totalEarnings += totals.earnings
      })

      // For agents, node.bookings is their individual sales.
      // We'll show aggregated values for the tree view to make it meaningful.
      node.displayBookings = (node.bookings || 0) + totalBookings
      node.displayEarnings = (node.earnings || 0) + totalEarnings
      
      return { bookings: node.displayBookings, earnings: node.displayEarnings }
    }

    aggregate(root)

    return root
  }, [data, whitelabelAgents, basePrice, individualBookings])

  function CustomerRow({ cust, depth }) {
    return (
      <tr className="bg-gray-50/30">
        <td className="px-4 py-2" style={{ paddingLeft: `${depth * 24 + 16}px` }}>
          <div className="flex items-center gap-2 relative">
            {depth > 0 && (
              <div 
                className="absolute -left-6 top-[-20px] bottom-[12px] w-[1px] bg-gray-300"
                style={{ left: '-18px' }}
              />
            )}
            {depth > 0 && (
              <div 
                className="absolute -left-6 top-[12px] w-4 h-[1px] bg-gray-300"
                style={{ left: '-18px' }}
              />
            )}
            <User className="h-3 w-3 text-gray-400" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[11px] font-bold text-gray-700">{cust.customerName}</p>
                {cust.bookingId && (
                  <span className="flex items-center gap-0.5 font-mono text-[9px] font-semibold text-gray-400">
                    <Hash size={9} />{cust.bookingId}
                  </span>
                )}
                {cust.travelers?.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-50 px-1.5 py-0.5 text-[8px] font-bold text-primary-700 ring-1 ring-inset ring-primary-100">
                    +{cust.travelers.length} travelers
                  </span>
                )}
              </div>
              <p className="text-[9px] text-gray-400">{new Date(cust.date).toLocaleDateString('en-IN')}</p>
              
              {cust.travelers?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {cust.travelers.map((t, ti) => (
                    <span key={ti} className="text-[8px] text-gray-400">
                      • {t.name}{ti < cust.travelers.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-2 text-[10px] text-gray-400">Customer</td>
        <td className="px-4 py-2 text-center">—</td>
        <td className="px-4 py-2 text-right text-[10px] text-gray-500 font-medium">₹{(Number(cust.parentEarned) || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-2 text-right text-[10px] text-emerald-600 font-bold">₹{(Number(cust.childEarned) || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-2 text-right text-[10px] text-slate-900 font-black">₹{(Number(cust.parentEarned) + Number(cust.childEarned)).toLocaleString('en-IN')}</td>
      </tr>
    )
  }

  function AgentRow({ node, depth = 0 }) {
    const [isExpanded, setIsExpanded] = useState(true)
    const hasChildren = node.children?.length > 0 || node.customers?.length > 0
    const paddingLeft = depth * 24

    if (node.displayBookings === 0 && !node.isRoot) return null

    return (
      <>
        <tr className="group transition hover:bg-gray-50/50">
          <td className="px-4 py-3" style={{ paddingLeft: `${paddingLeft + 16}px` }}>
            <div className="flex items-center gap-3 relative">
              {depth > 0 && (
                <div 
                  className="absolute -left-6 top-[-20px] bottom-[14px] w-[1px] bg-gray-300"
                  style={{ left: '-18px' }}
                />
              )}
              {depth > 0 && (
                <div 
                  className="absolute -left-6 top-[14px] w-4 h-[1px] bg-gray-300"
                  style={{ left: '-18px' }}
                />
              )}
              {hasChildren && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 text-gray-400 transition-colors"
                >
                  <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-primary-600' : ''}`} />
                </button>
              )}
              {!hasChildren && <div className="w-5" />}
              
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                node.role === 'child_agent' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {node.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-gray-900 text-xs">{node.name || 'Unknown'}</p>
                {node.agentCode && <p className="text-[9px] text-gray-500">Code: {node.agentCode}</p>}
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm ring-1 ring-inset ${
              node.role === 'child_agent' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' : 'bg-purple-50 text-purple-700 ring-purple-700/10'
            }`}>
              {node.role?.replace('_', ' ')}
            </span>
          </td>
          <td className="px-4 py-3 text-center">
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
              <Ticket className="h-2.5 w-2.5 text-gray-400" />
              {node.displayBookings || 0}
            </span>
          </td>
          <td className="px-4 py-3 text-right font-bold text-gray-700 tabular-nums text-xs">
            ₹{((node.displayBookings || 0) * basePrice).toLocaleString('en-IN')}
          </td>
          <td className="px-4 py-3 text-right tabular-nums">
            <p className="font-bold text-emerald-600 text-xs">₹{(Number(node.displayEarnings) || 0).toLocaleString('en-IN')}</p>
          </td>
          <td className="px-4 py-3 text-right font-black text-slate-900 tabular-nums bg-slate-50/50 text-xs">
            ₹{((node.displayBookings || 0) * basePrice + (Number(node.displayEarnings) || 0)).toLocaleString('en-IN')}
          </td>
        </tr>

        {isExpanded && node.children?.map(child => (
          <AgentRow key={child.id} node={child} depth={depth + 1} />
        ))}

        {isExpanded && node.customers?.map((cust, cidx) => (
          <CustomerRow key={`cust-${cidx}`} cust={cust} depth={depth + 1} />
        ))}
      </>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-5xl">
      <div className="flex flex-col gap-6">
        {/* Overall Stats Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-4 ring-1 ring-orange-100 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
              <Zap className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Base Price</p>
              <p className="text-2xl font-black text-orange-900">
                ₹{Number(basePrice || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
              <BarChart3 className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Revenue</p>
              <p className="text-2xl font-black text-slate-900">
                ₹{totalPackageRevenue.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-primary-50 p-4 ring-1 ring-primary-100 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
              <IndianRupee className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary-700">My Total Earnings</p>
              <p className="text-2xl font-black text-primary-900">
                ₹{totalParentEarnings.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <Users className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Child Commissions</p>
              <p className="text-2xl font-black text-emerald-900">
                ₹{totalChildCommissions.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 bg-gray-50/50 p-1 shadow-inner">
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'agents' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Hash className="h-3.5 w-3.5" />
            Breakdown by Agent
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'bookings' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Breakdown by Customer
          </button>
        </div>

        <div className="min-h-[300px]">
          {activeTab === 'agents' ? (
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Role / Breakdown</th>
                    <th className="px-4 py-3 text-center">Sales</th>
                    <th className="px-4 py-3 text-right">Base Revenue (My Share)</th>
                    <th className="px-4 py-3 text-right">Commission Earned</th>
                    <th className="px-4 py-3 text-right">Total Sales Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {treeData.children.length === 0 && treeData.customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                        No network activity for this package yet.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {treeData.customers.map((cust, idx) => (
                        <CustomerRow key={`root-cust-${idx}`} cust={cust} depth={0} />
                      ))}
                      {treeData.children.map(child => (
                        <AgentRow key={child.id} node={child} depth={0} />
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Customer & Date</th>
                    <th className="px-4 py-3 text-center">Commission Split</th>
                    <th className="px-4 py-3 text-right">My Earnings</th>
                    <th className="px-4 py-3 text-right">Total Child Comm.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {individualBookings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-16 text-center text-gray-400">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    individualBookings.map((b, idx) => (
                      <tr key={idx} className="group transition hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-gray-900">{b.customerName}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            {b.travelers?.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Additional Travelers ({b.travelers.length})</p>
                                <div className="flex flex-wrap gap-1">
                                  {b.travelers.map((t, ti) => (
                                    <span key={ti} className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600 ring-1 ring-gray-200">
                                      {t.name} {t.age ? `(${t.age})` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-[10px]">
                            {(Number(b.providerEarned) || 0) > 0 && (
                              <div className="flex items-center justify-between gap-4 text-violet-600">
                                <span className="font-medium">Provider Comm.</span>
                                <span className="font-bold tabular-nums">₹{(Number(b.providerEarned) || 0).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-4 text-blue-600">
                              <span className="font-medium">Seller ({b.agentName})</span>
                              <span className="font-bold tabular-nums">₹{(Number(b.sellerEarned) || 0).toLocaleString('en-IN')}</span>
                            </div>
                            {(Number(b.extraIncome) || 0) > 0 && (
                              <div className="flex items-center justify-between gap-4 text-blue-600">
                                <span className="flex items-center gap-1 font-medium italic">{/* <TrendingUp className="h-2.5 w-2.5" />Extra Income*/}</span>
                                <span className="font-bold tabular-nums">₹{(Number(b.extraIncome) || 0).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary-600 tabular-nums">
                          ₹{(Number(b.parentEarned) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600 tabular-nums">
                          ₹{(Number(b.childEarned) || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
