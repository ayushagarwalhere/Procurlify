import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FiSearch, FiFilter, FiChevronRight, FiX, FiExternalLink, FiTrendingUp, FiAward, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'

const mockDepartments = [
  {
    id: 'fin-min',
    name: 'BMC',
    fullName: 'Bombay Municipal Corporation',
    type: 'District',
    sector: 'Municipal Corporation',
    description:
      'BMC is the civic body of the city of Mumbai, Maharashtra, India. It is the largest municipal corporation in the country in terms of area and population.',
    blockchain: { integrated: true, network: 'Polygon PoS', since: '2024-06' },
    stats: { contractsAwarded: 128, totalTenderValueCr: 942.5, adoptionRate: 0.86 },
    tenders: [
        { id: 'BMC-25-014', title: 'Roads EPC (Phase II)', status: 'Active', link: '#', valueCr: 260.0 },
        { id: 'BMC-24-221', title: 'Water Harvesting Structures', status: 'Closed', link: '#', valueCr: 50.0 },
    ],
  },
  {
    id: 'rural-dev',
    name: 'MHSRDC',
    fullName: 'Maharashtra State Road Development Corporation',
    type: 'State',
    sector: 'Road Development',
    description:
      'MHSRDC is a state-owned corporation that is responsible for the development of roads in Maharashtra. It is a major player in the road development sector in the country.',
    blockchain: { integrated: true, network: 'Polygon PoS', since: '2025-02' },
    stats: { contractsAwarded: 212, totalTenderValueCr: 1570.9, adoptionRate: 0.71 },
    tenders: [
        { id: 'MHSRDC-25-014', title: 'Highway EPC (Phase II)', status: 'Active', link: '#', valueCr: 1309.0 },
        { id: 'MHSRDC-24-221', title: 'Structures', status: 'Closed', link: '#', valueCr: 50.0 },
        ],
  },
  {
    id: 'state-edu',
    name: 'KDA',
    fullName: 'Kanpur Development Authority',
    type: 'District',
    sector: 'Town and Country Planning',
    description:
      'Kanpur Development Authority is a state-owned corporation that is responsible for the development of the city of Kanpur. It is a major player in the town and country planning sector in the country.',
    blockchain: { integrated: false, network: null, since: null },
    stats: { contractsAwarded: 89, totalTenderValueCr: 410.3, adoptionRate: 0.32 },
    tenders: [
        { id: 'KDA-25-014', title: 'Smart Classroom Deployment (Lot-1)', status: 'Active', link: '#', valueCr: 75.0 },
        { id: 'KDA-24-221', title: 'Teacher Training LMS', status: 'Closed', link: '#', valueCr: 12.0 },
    ],
  },
  {
    id: 'state-health',
    name: 'Health department',
    fullName: 'Department of Health & Family Welfare,Himachal Pradesh',
    type: 'State',
    sector: 'Healthcare',
    description:
      'The Health department is responsible for the health of the people of the state. It is a major player in the healthcare sector in the country.',
    blockchain: { integrated: true, network: 'Polygon PoS', since: '2024-11' },
    stats: { contractsAwarded: 176, totalTenderValueCr: 1215.4, adoptionRate: 0.64 },
    tenders: [
      { id: 'KA-H-25-022', title: 'District Hospital Diagnostics PPP', status: 'Active', link: '#', valueCr: 180.0 },
      { id: 'KA-H-24-198', title: 'Cold Chain IoT Monitoring', status: 'Closed', link: '#', valueCr: 30.0 },
    ],
  },
  {
    id: 'pwd',
    name: 'Public Works Department',
    fullName: 'Ministry of Public Works, Government of India',
    type: 'Central',
    sector: 'Infrastructure',
    description:
      'Manages public works projects, infrastructure development, and maintenance with transparent procurement practices.',
    blockchain: { integrated: true, network: 'Polygon PoS', since: '2024-11' },
    stats: { contractsAwarded: 176, totalTenderValueCr: 1215.4, adoptionRate: 0.64 },
    tenders: [
        { id: 'PW-25-014', title: 'Village Roads EPC (Phase II)', status: 'Active', link: '#', valueCr: 260.0 },
        { id: 'PW-24-221', title: 'Flyover Project (Phase I)', status: 'Closed', link: '#', valueCr: 50.0 },  
    ],
  },
]

const types = ['All', 'Central', 'State', 'District']
const sectors = ['All', 'Finance', 'Infrastructure', 'Education', 'Healthcare']
const sortOptions = [
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'type', label: 'Type' },
  { key: 'sector', label: 'Sector' },
  { key: 'value', label: 'Total Tender Value' },
  { key: 'contracts', label: 'Contracts Awarded' },
]

function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}

const StatusBadge = ({ integrated }) => {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
        integrated ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
      )}
    >
      {integrated ? <FiCheckCircle /> : <FiAlertTriangle />}
      {integrated ? 'On-chain' : 'Planned'}
    </span>
  )
}

const ProgressBar = ({ value }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#8e66fe] to-[#f331f0] transition-[width] duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

const DepartmentCard = ({ item, onOpen }) => {
  return (
    <div id="departments"
      className="reveal-card rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm p-5 text-white hover:bg-white/10 transition-colors duration-300 cursor-pointer"
      onClick={() => onOpen(item)}
    >
      <div className="flex items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-space-grotesk">{item.name}</h3>
            <StatusBadge integrated={item.blockchain.integrated} />
          </div>
          <p className="mt-1 text-sm text-white/60">
            {item.type} • {item.sector}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Contracts</span>
          <span className="font-medium">{item.stats.contractsAwarded}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Total Tender Value</span>
          <span className="font-medium">₹{item.stats.totalTenderValueCr} Cr</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Adoption</span>
            <span className="font-medium">{Math.round(item.stats.adoptionRate * 100)}%</span>
          </div>
          <ProgressBar value={item.stats.adoptionRate} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2 text-sm text-white/80">
        <span>Details</span>
        <FiChevronRight />
      </div>
    </div>
  )
}

const Drawer = ({ open, onClose, data }) => {
  return (
    <div
      className={classNames(
        'fixed inset-0 z-50 pointer-events-none',
        open && 'pointer-events-auto'
      )}
      aria-hidden={!open}
    >
      <div
        className={classNames(
          'absolute inset-0 bg-black/40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <aside
        className={classNames(
          'absolute right-0 top-0 h-full w-full max-w-xl bg-black text-white border-l border-white/15 backdrop-blur-xl',
          'transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-space-grotesk">{data?.fullName || data?.name}</h3>
              <p className="text-xs text-white/60">{data?.type} • {data?.sector}</p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto h-[calc(100%-68px)]">
          <div className="rounded-xl border border-white/15 bg-white/5 p-4">
            <p className="text-white/80 leading-7">{data?.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <FiAward />
                <span>Contracts Awarded</span>
              </div>
              <p className="mt-2 text-2xl font-space-grotesk">{data?.stats?.contractsAwarded ?? '-'}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <FiTrendingUp />
                <span>Total Tender Value</span>
              </div>
              <p className="mt-2 text-2xl font-space-grotesk">₹{data?.stats?.totalTenderValueCr ?? '-'} Cr</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-white/70">Blockchain Integration</p>
                <div className="flex items-center gap-3">
                  <StatusBadge integrated={!!data?.blockchain?.integrated} />
                  {data?.blockchain?.integrated && (
                    <span className="text-xs text-white/60">Network: {data.blockchain.network} • Since {data.blockchain.since}</span>
                  )}
                </div>
              </div>
              <div className="w-40">
                <ProgressBar value={data?.stats?.adoptionRate ?? 0} />
                <p className="mt-1 text-right text-xs text-white/60">{Math.round((data?.stats?.adoptionRate ?? 0) * 100)}%</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-space-grotesk">Tenders</h4>
            <div className="mt-3 space-y-3">
              {data?.tenders?.map(t => (
                <a
                  key={t.id}
                  href={t.link}
                  className="group flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-white/60 mt-1">
                      {t.id} • {t.status} • ₹{t.valueCr} Cr
                    </p>
                  </div>
                  <FiExternalLink className="text-white/60 group-hover:text-white transition-colors" />
                </a>
              ))}
              {(!data?.tenders || data.tenders.length === 0) && (
                <div className="text-white/60 text-sm">No tenders available.</div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

const DepartmentsPage = () => {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [sector, setSector] = useState('All')
  const [sortBy, setSortBy] = useState('name')
  const [selected, setSelected] = useState(null)
  const containerRef = useRef(null)

  // Intersection Observer for GSAP-like reveals
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const targets = el.querySelectorAll('.reveal-card')
    targets.forEach(node => {
      node.classList.add('opacity-0', 'translate-y-4')
    })
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0')
            entry.target.classList.remove('opacity-0', 'translate-y-4')
            entry.target.style.transition = 'opacity 600ms ease, transform 600ms ease'
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 }
    )
    targets.forEach(t => obs.observe(t))
    return () => obs.disconnect()
  }, [])

  const data = mockDepartments

  const filtered = useMemo(() => {
    let list = data
    if (type !== 'All') list = list.filter(d => d.type === type)
    if (sector !== 'All') list = list.filter(d => d.sector === sector)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.fullName.toLowerCase().includes(q) ||
        d.sector.toLowerCase().includes(q)
      )
    }
    switch (sortBy) {
      case 'type':
        list = [...list].sort((a, b) => a.type.localeCompare(b.type)); break
      case 'sector':
        list = [...list].sort((a, b) => a.sector.localeCompare(b.sector)); break
      case 'value':
        list = [...list].sort((a, b) => b.stats.totalTenderValueCr - a.stats.totalTenderValueCr); break
      case 'contracts':
        list = [...list].sort((a, b) => b.stats.contractsAwarded - a.stats.contractsAwarded); break
      default:
        list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [data, query, type, sector, sortBy])

  const aggregate = useMemo(() => {
    const totalDepartments = data.length
    const activeTenders = data.reduce((acc, d) => acc + d.tenders.filter(t => t.status === 'Active').length, 0)
    const adoption = data.reduce((acc, d) => acc + (d.stats.adoptionRate || 0), 0) / (totalDepartments || 1)
    return { totalDepartments, activeTenders, adoption }
  }, [data])

  return (
    <div id="departments" className="bg-black text-white w-full">
      {/* Hero */}
      <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-10">
        <div className="mb-4">
          <h1 className="text-6xl md:text-7xl font-poppins leading-tight">
            Departments and
            <span className="bg-gradient-to-r from-[#8e66fe] to-[#f331f0] text-transparent bg-clip-text"> Ministries</span>
          </h1>
          <p className="mt-4 text-white/70 max-w-3xl leading-7">
            Explore how ministries and state departments onboard to transparent, auditable procurement.
            Search, filter, and dive into live tenders and on‑chain status.
          </p>
        </div>

        {/* Filter/Search */}
        <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm p-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <input
                className="w-full rounded-lg bg-black/40 border border-white/15 pl-9 pr-3 h-11 outline-none focus:border-white/25"
                placeholder="Search by name, full name, or sector…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
                <select
                  className="appearance-none w-40 rounded-lg bg-black/40 border border-white/15 pl-9 pr-8 h-11 outline-none focus:border-white/25"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <select
                className="appearance-none w-44 rounded-lg bg-black/40 border border-white/15 px-3 h-11 outline-none focus:border-white/25"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                className="appearance-none w-52 rounded-lg bg-black/40 border border-white/15 px-3 h-11 outline-none focus:border-white/25"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="max-w-6xl mx-auto px-6 pb-4">
        <div className="reveal-card grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/15 bg-white/5 p-5">
            <p className="text-sm text-white/70">Departments Onboarded</p>
            <p className="mt-2 text-3xl font-space-grotesk">{aggregate.totalDepartments}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-5">
            <p className="text-sm text-white/70">Active Tenders</p>
            <p className="mt-2 text-3xl font-space-grotesk">{aggregate.activeTenders}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-5">
            <p className="text-sm text-white/70">Smart Contract Adoption</p>
            <div className="mt-2">
              <ProgressBar value={aggregate.adoption} />
              <p className="mt-1 text-right text-xs text-white/60">{Math.round(aggregate.adoption * 100)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8" ref={containerRef}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(item => (
            <DepartmentCard key={item.id} item={item} onOpen={setSelected} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-white/15 bg-white/5 p-8 text-center text-white/60">
              No departments match your filters.
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} data={selected} />
    </div>
  )
}

export default DepartmentsPage