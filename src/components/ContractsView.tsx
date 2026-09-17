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
    <div className="rounded-lg border border-line bg-panel p-3 shadow-sm hover:border-slateline transition-colors">
      <p className="text-sm font-semibold text-fg">{row.contractName}</p>
      <p className="text-xs font-medium text-teal">{row.section}</p>
      <dl className="mt-2 text-xs text-fg/90 grid grid-cols-2 gap-x-3 gap-y-1">
        <div><dt className="inline text-fgmuted">Start: </dt><dd className="inline">{row.startDate}</dd></div>
        <div><dt className="inline text-fgmuted">End: </dt><dd className="inline">{row.endDate}</dd></div>
        {row.acq && <div><dt className="inline text-fgmuted">ACQ: </dt><dd className="inline">{row.acq}</dd></div>}
        {row.mdq && <div><dt className="inline text-fgmuted">MDQ: </dt><dd className="inline">{row.mdq}</dd></div>}
        {row.totalAcq && <div><dt className="inline text-fgmuted">Total ACQ: </dt><dd className="inline">{row.totalAcq}</dd></div>}
        {row.topPercent && <div><dt className="inline text-fgmuted">ToP: </dt><dd className="inline">{row.topPercent}</dd></div>}
        <div className="col-span-2"><dt className="inline text-fgmuted">Delivery: </dt><dd className="inline">{row.deliveryPoints}</dd></div>
        <div className="col-span-2"><dt className="inline text-fgmuted">Price: </dt><dd className="inline">{row.price}</dd></div>
        {row.other && <div className="col-span-2"><dt className="inline text-fgmuted">Other: </dt><dd className="inline">{row.other}</dd></div>}
      </dl>
    </div>
  );
}

export function ContractsView({ data, search }: ContractsViewProps) {
  const supply = data.supply.filter((r) => matches(r, search));
  const demand = data.demand.filter((r) => matches(r, search));

  return (
    <div className="p-6 space-y-10 max-w-[1400px] mx-auto">
      <section>
        <h2 className="text-lg font-bold mb-3 pb-2 border-b border-line">Supply</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {supply.map((row) => (
            <ContractCard key={row.id} row={row} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 pb-2 border-b border-line">Demand</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {demand.map((row) => (
            <ContractCard key={row.id} row={row} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 pb-2 border-b border-line">CFDs</h2>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-xs text-left text-fg/90">
            <thead className="text-fgmuted bg-ink/40">
              <tr>
                <th className="pr-3 pl-3 py-2">Start</th>
                <th className="pr-3 py-2">End</th>
                <th className="pr-3 py-2">B/S</th>
                <th className="pr-3 py-2">Strike</th>
                <th className="pr-3 py-2">GJ</th>
                <th className="pr-3 py-2">Counterparty</th>
                <th className="pr-3 py-2">Market</th>
                <th className="pr-3 py-2">Trade Date</th>
                <th className="pr-3 py-2">Comments</th>
              </tr>
            </thead>
            <tbody>
              {[...data.cfds.sell, ...data.cfds.buy].map((cfd, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="pl-3 pr-3 py-1.5">{cfd.startDate}</td>
                  <td className="pr-3 py-1.5">{cfd.endDate}</td>
                  <td className="pr-3 py-1.5">{cfd.buySell === 1 ? "Buy" : "Sell"}</td>
                  <td className="pr-3 py-1.5">{cfd.strike}</td>
                  <td className="pr-3 py-1.5">{cfd.volumeGJ}</td>
                  <td className="pr-3 py-1.5">{cfd.counterparty}</td>
                  <td className="pr-3 py-1.5">{cfd.marketRegion}</td>
                  <td className="pr-3 py-1.5">{cfd.tradeDate}</td>
                  <td className="pr-3 py-1.5">{cfd.comments ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 pb-2 border-b border-line">Quarterly Capacity (Syd Buy / Vic Sell, TJ/day)</h2>
        <table className="text-xs text-left text-fg/90 rounded-lg border border-line overflow-hidden">
          <thead className="text-fgmuted bg-ink/40">
            <tr>
              <th className="pl-3 pr-6 py-2">Period</th>
              <th className="pr-6 py-2">Syd Buy</th>
              <th className="pr-6 py-2">Vic Sell</th>
            </tr>
          </thead>
          <tbody>
            {data.quarterlyCapacity.map((q) => (
              <tr key={q.period} className="border-t border-line">
                <td className="pl-3 pr-6 py-1.5">{q.period}</td>
                <td className="pr-6 py-1.5">{q.sydBuyTJDay.toLocaleString()}</td>
                <td className="pr-6 py-1.5">{q.vicSellTJDay.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
