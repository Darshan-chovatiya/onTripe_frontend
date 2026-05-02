import { useState, useMemo } from 'react'
import { X, User, Ticket, IndianRupee, Mail, Hash, Users, Calendar, ArrowRight, Zap, TrendingUp, Info, BarChart3, PieChart } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'

export default function AgentCommissionsModal({ isOpen, onClose, data = [], individualBookings = [], whitelabelAgents = [], basePrice = 0, title = 'Financial Breakdown' }) {
  const [activeTab, setActiveTab] = useState('agents')

  const totalPackageRevenue = individualBookings.reduce((sum, b) => sum + (Number(b.parentEarned) || 0) + (Number(b.childEarned) || 0), 0)
  const totalParentEarnings = individualBookings.reduce((sum, b) => sum + (Number(b.parentEarned) || 0), 0)
  const totalChildCommissions = individualBookings.reduce((sum, b) => sum + (Number(b.childEarned) || 0), 0)

  const mergedAgentData = useMemo(() => {
    const agents = whitelabelAgents.map(wa => ({
      name: wa.name,
      agentCode: wa.agentCode,
      email: wa.email,
      earnings: 0,
      baseEarnings: 0,
      extraIncome: 0,
      bookings: 0,
      type: 'Potential',
      potentialCommission: (Number(wa.finalPrice) || 0) - (Number(basePrice) || 0)
    }))

    data.forEach(sd => {
      let agent = agents.find(a => a.agentCode === sd.agentCode)
      if (agent) {
        agent.earnings = sd.earnings
        agent.baseEarnings = sd.baseEarnings
        agent.extraIncome = sd.extraIncome
        agent.bookings = sd.bookings
        agent.type = sd.type
      } else {
        agents.push({
          ...sd,
          potentialCommission: 0
        })
      }
    })

    return agents
  }, [data, whitelabelAgents, basePrice])

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
                  {mergedAgentData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                        No agents have whitelabeled this package yet.
                      </td>
                    </tr>
                  ) : (
                    mergedAgentData.map((item, idx) => {
                      const baseRevenue = (Number(item.bookings) || 0) * (Number(basePrice) || 0);
                      const totalSalesValue = baseRevenue + (Number(item.earnings) || 0);

                      return (
                        <tr key={idx} className="group transition hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[12px] font-bold text-primary-700 group-hover:scale-110 transition-transform">
                                {item.name?.charAt(0).toUpperCase() || 'A'}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-bold text-gray-900">{item.name || 'Unknown Agent'}</p>
                                <p className="text-[10px] text-gray-500">Code: {item.agentCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1.5">
                              <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ring-1 ring-inset ${
                                item.type === 'Seller' 
                                  ? 'bg-blue-50 text-blue-700 ring-blue-700/10' 
                                  : item.type === 'Provider'
                                  ? 'bg-violet-50 text-violet-700 ring-violet-700/10'
                                  : 'bg-gray-50 text-gray-600 ring-gray-600/10'
                              }`}>
                                {item.type}
                              </span>
                              
                              {(item.type === 'Seller' || item.type === 'Provider') && (
                                <div className="flex flex-col gap-0.5 rounded-lg bg-gray-50/50 p-1.5 ring-1 ring-gray-100">
                                  <div className="flex items-center justify-between gap-4 text-[9px] text-gray-500">
                                    <span>Base Comm:</span>
                                    <span className="font-bold tabular-nums">₹{(Number(item.baseEarnings) || 0).toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-[9px] text-emerald-600">
                                    <span className="flex items-center gap-0.5"><TrendingUp className="h-2 w-2" />Extra:</span>
                                    <span className="font-bold tabular-nums">₹{(Number(item.extraIncome) || 0).toLocaleString('en-IN')}</span>
                                  </div>
                                </div>
                              )}

                              {item.type === 'Potential' && (
                                <div className="flex items-center gap-1 text-[9px] font-medium text-gray-400">
                                  <Zap className="h-2.5 w-2.5" />
                                  Potential: ₹{(Number(item.potentialCommission) || 0).toLocaleString('en-IN')} / sale
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                              <Ticket className="h-3 w-3 text-gray-400" />
                              {item.bookings}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-700 tabular-nums">
                            ₹{baseRevenue.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <p className="font-bold text-emerald-600">₹{(Number(item.earnings) || 0).toLocaleString('en-IN')}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-slate-900 tabular-nums bg-slate-50/50">
                            ₹{totalSalesValue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )
                    })
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
                    <th className="px-4 py-3">Commission Split</th>
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
                              <div className="flex items-center justify-between gap-4 text-emerald-600">
                                <span className="flex items-center gap-1 font-medium italic"><TrendingUp className="h-2.5 w-2.5" />Extra Income</span>
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
