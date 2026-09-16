import type { ContractsData, ContractRow } from "../data/contracts";

interface ContractsViewProps {
  data: ContractsData;
  search: string;
}

function matches(row: ContractRow, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    row.contractName.toLowerCase().includes(q) ||
    row.section.toLowerCase().includes(q) ||
    row.deliveryPoints.toLowerCase().includes(q)
  );
}

function ContractCard({ row }: { row: ContractRow }) {
  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <p className="text-sm font-semibold text-slate-100">{row.contractName}</p>
      <p className="text-xs text-slate-400">{row.section}</p>
      <dl className="mt-2 text-xs text-slate-300 grid grid-cols-2 gap-x-3 gap-y-1">
        <div><dt className="inline text-slate-500">Start: </dt><dd className="inline">{row.startDate}</dd></div>
        <div><dt className="inline text-slate-500">End: </dt><dd className="inline">{row.endDate}</dd></div>
        {row.acq && <div><dt className="inline text-slate-500">ACQ: </dt><dd className="inline">{row.acq}</dd></div>}
        {row.mdq && <div><dt className="inline text-slate-500">MDQ: </dt><dd className="inline">{row.mdq}</dd></div>}
        {row.totalAcq && <div><dt className="inline text-slate-500">Total ACQ: </dt><dd className="inline">{row.totalAcq}</dd></div>}
        {row.topPercent && <div><dt className="inline text-slate-500">ToP: </dt><dd className="inline">{row.topPercent}</dd></div>}
        <div className="col-span-2"><dt className="inline text-slate-500">Delivery: </dt><dd className="inline">{row.deliveryPoints}</dd></div>
        <div className="col-span-2"><dt className="inline text-slate-500">Price: </dt><dd className="inline">{row.price}</dd></div>
        {row.other && <div className="col-span-2"><dt className="inline text-slate-500">Other: </dt><dd className="inline">{row.other}</dd></div>}
      </dl>
    </div>
  );
}

export function ContractsView({ data, search }: ContractsViewProps) {
  const supply = data.supply.filter((r) => matches(r, search));
  const demand = data.demand.filter((r) => matches(r, search));

  return (
    <div className="p-4 space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Supply</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {supply.map((row) => (
            <ContractCard key={row.id} row={row} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Demand</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {demand.map((row) => (
            <ContractCard key={row.id} row={row} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">CFDs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-slate-400">
              <tr>
                <th className="pr-3 py-1">Start</th>
                <th className="pr-3 py-1">End</th>
                <th className="pr-3 py-1">B/S</th>
                <th className="pr-3 py-1">Strike</th>
                <th className="pr-3 py-1">GJ</th>
                <th className="pr-3 py-1">Counterparty</th>
                <th className="pr-3 py-1">Market</th>
                <th className="pr-3 py-1">Trade Date</th>
                <th className="pr-3 py-1">Comments</th>
              </tr>
            </thead>
            <tbody>
              {[...data.cfds.sell, ...data.cfds.buy].map((cfd, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="pr-3 py-1">{cfd.startDate}</td>
                  <td className="pr-3 py-1">{cfd.endDate}</td>
                  <td className="pr-3 py-1">{cfd.buySell === 1 ? "Buy" : "Sell"}</td>
                  <td className="pr-3 py-1">{cfd.strike}</td>
                  <td className="pr-3 py-1">{cfd.volumeGJ}</td>
                  <td className="pr-3 py-1">{cfd.counterparty}</td>
                  <td className="pr-3 py-1">{cfd.marketRegion}</td>
                  <td className="pr-3 py-1">{cfd.tradeDate}</td>
                  <td className="pr-3 py-1">{cfd.comments ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Quarterly Capacity (Syd Buy / Vic Sell, TJ/day)</h2>
        <table className="text-xs text-left text-slate-300">
          <thead className="text-slate-400">
            <tr>
              <th className="pr-6 py-1">Period</th>
              <th className="pr-6 py-1">Syd Buy</th>
              <th className="pr-6 py-1">Vic Sell</th>
            </tr>
          </thead>
          <tbody>
            {data.quarterlyCapacity.map((q) => (
              <tr key={q.period} className="border-t border-line">
                <td className="pr-6 py-1">{q.period}</td>
                <td className="pr-6 py-1">{q.sydBuyTJDay.toLocaleString()}</td>
                <td className="pr-6 py-1">{q.vicSellTJDay.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
